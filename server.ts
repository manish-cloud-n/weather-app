import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets panel.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// 1. AI Weather Insights Endpoint
app.post("/api/weather/ai-insights", async (req, res) => {
  const { city, country, temp, weatherCode, conditionText, humidity, wind } = req.body;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  // Construct standard fallback in case Gemini fails
  const getFallbackInsights = () => {
    const garments = [];
    if (temp < 10) {
      garments.push("Heavy insulating coat", "Woolen scarf", "Thermal gloves", "Fleece layers");
    } else if (temp < 18) {
      garments.push("Stylish light jacket or trench", "Comfy knit sweater", "Denim or chinos");
    } else if (temp < 28) {
      garments.push("Breathable cotton t-shirt", "Polarized sunglasses", "Linen shorts", "Light sneaks");
    } else {
      garments.push("Ultra-light performance top", "UV sunglasses", "Wide-brim protective sunhat");
    }

    const recActivities = [
      {
        name: "Outdoor Running & Cardio",
        rating: temp > 35 || temp < 0 ? 30 : temp > 28 ? 65 : 92,
        status: temp > 35 || temp < 0 ? "Not Recommended" : temp > 28 ? "Feasible" : "Ideal",
        tip: temp > 28 ? "Plan a moderate pace, choose shaded trails, and carry water." : "Excellent temperatures for setting your running personal records!"
      },
      {
        name: "Al Fresco Café & Reading",
        rating: String(conditionText).toLowerCase().includes("rain") || String(conditionText).toLowerCase().includes("snow") ? 15 : 90,
        status: String(conditionText).toLowerCase().includes("rain") || String(conditionText).toLowerCase().includes("snow") ? "Not Recommended" : "Ideal",
        tip: String(conditionText).toLowerCase().includes("rain") ? "Precipitation detected. Pick a cozy micro-brewery or library instead." : "Atmosphere is highly pleasant. Great light and gentle wind breezes."
      },
      {
        name: "Urban Photography & Walk",
        rating: temp < 5 ? 40 : 85,
        status: temp < 5 ? "Feasible" : "Ideal",
        tip: temp < 5 ? "Remember to wear insulated gloves so your hands stay warm while snapping photos." : "Fabulous contrast and view patterns for stunning scenery."
      }
    ];

    return {
      brief: `Currently ${temp}°C and ${conditionText || 'Clear'} in ${city}. The surrounding air parameters indicate a ${temp > 20 ? 'soft, warm feeling' : 'bracingly cool, fresh'} atmosphere suited for active days.`,
      clothing: garments,
      activities: recActivities,
      healthAdvice: temp > 28 
        ? "Apply standard broad-spectrum sunscreen, prioritize hydration with refreshing electrolytes, and stay clear of prolonged exposure." 
        : "Apply targeted moisturizer to protect against local breezes, and wear loose layers to quickly adjust comfort."
    };
  };

  try {
    const ai = getGeminiClient();

    const prompt = `Generate tailored weather insights and lifestyle recommendations based on the following weather data for ${city}, ${country}:
    - Temperature: ${temp}°C
    - Condition: ${conditionText} (WMO Code: ${weatherCode})
    - Humidity: ${humidity}%
    - Wind Speed: ${wind} km/h

    Provide high-value, realistic tips including:
    1. A short, interesting "Brief" summarizing the feel of the day.
    2. Suggested "Clothing" items to wear, keep in mind comfort and weather conditions.
    3. Suggested "Activities" with scoring (0 to 100), visual status/color (e.g. green, orange, red for advisability), and a practical tip. Make sure to suggest common activities like Running, Cycling, Picnic, Hiking, or Indoor Study/Work.
    4. Practical "Health & Hydration" advice.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite meteorologist and lifestyle advisor. Format the response strictly as a JSON object matching the defined schema. Avoid conversational fillers, markdown wrappers or code blocks.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["brief", "clothing", "activities", "healthAdvice"],
          properties: {
            brief: {
              type: Type.STRING,
              description: "A summary sentence of the overall feel of the weather today.",
            },
            clothing: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of specific garments or apparel recommended for this exact condition.",
            },
            activities: {
              type: Type.ARRAY,
              description: "List of weather-dependent lifestyle activities.",
              items: {
                type: Type.OBJECT,
                required: ["name", "rating", "status", "tip"],
                properties: {
                  name: { type: Type.STRING, description: "Name of the activity (e.g., Running, Outdoor Café, Gardening, Laundry)." },
                  rating: { type: Type.INTEGER, description: "Rating score from 0 (impossible) to 100 (optimal) for the activity." },
                  status: { type: Type.STRING, description: "Activity warning or suitability status (green = Ideal, yellow = Feasible, red = Not Recommended)." },
                  tip: { type: Type.STRING, description: "Specific meteorologist's tip or warning for this activity." },
                }
              }
            },
            healthAdvice: {
              type: Type.STRING,
              description: "Practical hygiene, skin care, joint comfort, allergen advice, or hydration guidelines.",
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    res.json({ ...JSON.parse(text), _isFallback: false });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("EXHAUSTED");
    console.warn(`[AI System Warning] Weather insights endpoint fallback activated. Cause: ${isRateLimit ? "Service quota limit reached (429)" : "Service unavailable"}`);
    res.json({ ...getFallbackInsights(), _isFallback: true });
  }
});

// 2. Localized AI Weather News Stories Endpoint
app.post("/api/weather/ai-news", async (req, res) => {
  const { city, country, temp, conditionText, currentLocalTime } = req.body;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  // Construct standard fallback articles in case Gemini fails
  const getFallbackNews = () => {
    return {
      articles: [
        {
          id: "local-news-1",
          title: `Local Parks Buzz in ${city} Amid ${temp}°C Atmosphere`,
          content: `Residents are out enjoying the ${conditionText ? conditionText.toLowerCase() : 'pleasant'} conditions today. Local park officials note a significant increase in morning commutes and wellness strolls, recommending midday hydration as temperatures progress.`,
          category: "Community Feed",
          readTime: "1 min read",
          tag: "COMMUNITY"
        },
        {
          id: "grid-energy-2",
          title: `Grid Demand Remains Stable in ${city}`,
          content: `${temp > 25 ? 'High cooling' : temp < 12 ? 'Heating demands' : 'Moderate conditions'} have kept local backup grids operating within standard ranges. Climate observers forecast that green renewable sources are satisfying local consumption peaks.`,
          category: "Energy Grid",
          readTime: "2 min read",
          tag: "GRID INFO"
        },
        {
          id: "trivia-3",
          title: `Climate Archives: How ${city} Compares to Seasonal Trends`,
          content: `Today's localized temperature of ${temp}°C aligns closely with standard baseline patterns for this month. Historians note dry humidity ratios have historically cleared local views nicely.`,
          category: "Eco Trivia",
          readTime: "1 min read",
          tag: "INTERESTING"
        }
      ]
    };
  };

  try {
    const ai = getGeminiClient();
    const newsApiKey = process.env.NEWS_API_KEY;
    let externalNewsContext = "";

    // If News API Key is present, try reaching NewsAPI for true real-world headlines
    if (newsApiKey && newsApiKey !== "MY_NEWS_API_KEY" && newsApiKey.trim().length > 0) {
      try {
        const query = encodeURIComponent(`${city} weather OR climate OR environment`);
        const newsUrl = `https://newsapi.org/v2/everything?q=${query}&sortBy=relevance&pageSize=4&apiKey=${newsApiKey}`;
        
        const r = await fetch(newsUrl, {
          headers: { 'User-Agent': 'VentureWeather/1.0' }
        });
        
        if (r.ok) {
          const rawNews = await r.json();
          if (rawNews.articles && rawNews.articles.length > 0) {
            externalNewsContext = rawNews.articles.map((art: any, index: number) => {
              return `External Story #${index + 1}: Title: "${art.title}" - Description: "${art.description || ''}" (Source: ${art.source?.name || 'News'})`;
            }).join("\n");
            console.log("Successfully fetched NewsAPI real-world headlines to feed into Gemini.");
          }
        } else {
          console.warn("NewsAPI response status not OK:", r.status);
        }
      } catch (newsErr) {
        console.warn("Non-blocking headline indexing alert: News API query was not completed.");
      }
    }

    const prompt = `Create a realistic, localized "Daily Weather Bulletin" consisting of 3 short, localized weather or environmental news briefs or alerts for the city of ${city}, ${country} today (${currentLocalTime}).
    Current weather condition: ${temp}°C, ${conditionText}.

    ${externalNewsContext ? `
    We have received the following real-world news articles related to this city. Please summarize, verify, curate, or use these as guidelines to keep the bulletin accurately anchored to live local events:
    ${externalNewsContext}
    ` : `
    Determine realistic environmental topics to explore:
    - Story 1: "Local Impact Brief" (e.g. how the temperature is affecting local parks, commutes, or agricultural markets/gardens).
    - Story 2: "Regional Energy & Grid Forecast" (e.g. energy usage forecasts based on heat or cold, power saving, or water reservoir update).
    - Story 3: "Seasonal Trivia or Health Highlight" (e.g. historical average comparison, allergy/pollen levels, or a localized weather trivia).
    `}

    Ensure they sound highly professional, custom-tailored for the region, and grammatically perfect. No generic placeholders. Code categories carefully. Return exactly 3 articles matching the schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a local news editor and environmental journalist. Return a strictly validated JSON structure of news articles. Do not include markdown or external commentary.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["articles"],
          properties: {
            articles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "content", "category", "readTime", "tag"],
                properties: {
                  id: { type: Type.STRING, description: "Unique article ID like local-news-1, grid-energy-2, trivia-3" },
                  title: { type: Type.STRING, description: "Engaging headline reflecting the localized weather context." },
                  content: { type: Type.STRING, description: "Detailed 2-3 sentence article briefing on the localized weather storyline." },
                  category: { type: Type.STRING, description: "Classification: e.g. Community, Allergy Report, Grid/Energy, Eco Trivia." },
                  readTime: { type: Type.STRING, description: "Estimated read duration (e.g., '1 min read', '2 min read')." },
                  tag: { type: Type.STRING, description: "Highlight badge text (e.g., 'URGENT', 'INTERESTING', 'GRID INFO', 'HEALTH ALERT')." }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    res.json({ ...JSON.parse(text), _isFallback: false });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("EXHAUSTED");
    console.warn(`[AI System Warning] Weather news bulletin fallback activated. Cause: ${isRateLimit ? "Service quota limit reached (429)" : "Service unavailable"}`);
    res.json({ ...getFallbackNews(), _isFallback: true });
  }
});

// 3. AI Weather Assistant Chat Endpoint
app.post("/api/weather/ai-chat", async (req, res) => {
  const { message, chatHistory, currentSystemContext } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const ai = getGeminiClient();

    // Construct a rich narrative prompt with context and past chats to preserve memory
    const historyTranscript = (chatHistory || [])
      .map((h: any) => `${h.role === 'user' ? 'User' : 'Weather Bot'}: ${h.text}`)
      .join("\n");

    const prompt = `System Environment Context:
    ${currentSystemContext}

    Past Conversation History:
    ${historyTranscript || "No prior messages."}

    User's New Message:
    "${message}"

    Response instructions:
    1. Respond naturally, engagingly, and with friendly expertise.
    2. Focus solely on answering the user’s weather-related or location-specific inquiry using the supplied System Environment Context.
    3. If they ask about local forecasts, travel planning, or comparison to other cities, cite appropriate tips or state comparison constraints cheerfully.
    4. Provide markdown formatted lists or brief key tips if requested (like itemized lists, suggestions, or tables).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the resident 'AI Weather Companion' - an exceptionally friendly, positive, and knowledgeable weather chatbot. You specialize in weather physics, climate stories, packing tips, and local micro-climate trivia. Keep answers concise, highly engaging, and helpful. Always use context data if available."
      }
    });

    const answer = response.text || "I apologize, I wasn't able to compile a response. Could you try asking me again?";
    res.json({ response: answer, _isFallback: false });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const isRateLimit = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("EXHAUSTED");
    console.info(`[AI System Info] Chat system fallback activated. Cause: ${isRateLimit ? "Service quota limit reached (429)" : "Service unavailable"}`);
    
    // Construct dynamic beautiful chat response based on input content
    const locationPart = currentSystemContext?.split("User is viewing weather for:")[1]?.split(".")[0]?.trim() || "your selected city";
    const lowercaseMsg = String(message).toLowerCase();
    
    let answerText = `I am currently operating in high-demand smart fallback mode for **${locationPart}**. `;
    if (lowercaseMsg.includes("packing") || lowercaseMsg.includes("wear") || lowercaseMsg.includes("clothe")) {
      answerText += "For today's atmospheric parameters, I recommend wearing standard comfortable layers adjusted for outdoor commutes. Don't forget sunglasses if it gets bright!";
    } else if (lowercaseMsg.includes("outdoor") || lowercaseMsg.includes("run") || lowercaseMsg.includes("activ")) {
      answerText += "Cardio sessions and outdoor walks seem highly feasible today! Just be sure to hydrate properly and plan moderate pacing.";
    } else {
      answerText += `To make your day in **${locationPart}** fabulous, I suggest viewing our customized **Advice** and **Bulletin** modules on the main workspace. Feel free to ask more specific weather tips!`;
    }
    
    res.json({ response: answerText, _isFallback: true });
  }
});

// Configure Vite or Static Files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Weather app server successfully running on http://localhost:${PORT}`);
  });
}

startServer();
