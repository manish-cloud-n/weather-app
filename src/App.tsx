import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  CloudSun, 
  MapPin, 
  Calendar, 
  Clock, 
  Sparkles, 
  Newspaper, 
  MessageSquare, 
  Send, 
  Compass, 
  AlertCircle,
  HelpCircle,
  Thermometer,
  CloudRain,
  Activity,
  Heart,
  Shirt,
  ShieldCheck,
  ChevronRight,
  Info,
  Sun,
  CloudFog,
  CloudLightning,
  CloudSnow,
  Share2,
  Check,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff
} from "lucide-react";
import SearchCity from "./components/SearchCity";
import MetricBentoGrid from "./components/MetricBentoGrid";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid,
  Line,
  Legend,
  ReferenceLine,
  ReferenceDot
} from "recharts";
import { 
  CitySuggestion, 
  CurrentWeather, 
  HourlyForecast, 
  DailyForecast, 
  AIInsights, 
  AINewsArticle, 
  ChatMessage 
} from "./types";
import { 
  getWeatherCondition, 
  formatWeekday, 
  formatMonthAndDay, 
  formatTime,
  cToF
} from "./utils/weatherUtils";

export default function App() {
  // Navigation tabs / focus
  const [activeTab, setActiveTab] = useState<"insights" | "bulletin" | "chatbot">("bulletin");

  // Temperature Unit selection state
  const [tempUnit, setTempUnit] = useState<"C" | "F">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tempUnit");
      if (saved === "C" || saved === "F") return saved;
    }
    return "C";
  });

  // Persist temperature unit
  useEffect(() => {
    localStorage.setItem("tempUnit", tempUnit);
  }, [tempUnit]);

  // Dynamic temperature formatter helper
  const formatTemp = (c: number, includeUnit = true) => {
    const converted = tempUnit === "F" ? cToF(c) : Math.round(c);
    return `${converted}°${includeUnit ? tempUnit : ""}`;
  };

  // Selection states
  const [selectedCity, setSelectedCity] = useState<CitySuggestion>({
    name: "New York",
    country: "United States",
    latitude: 40.7128,
    longitude: -74.006,
    country_code: "US",
  });

  // Weather response data states
  const [weatherData, setWeatherData] = useState<CurrentWeather | null>(null);
  const [simulatedCode, setSimulatedCode] = useState<number | null>(null);

  // High fidelity weather simulations representing specific microclimate conditions
  const weatherSimulations = useMemo(() => [
    {
      code: null,
      label: "Live Station",
      icon: Compass,
      temp: null,
      details: "Real-time query data feed"
    },
    {
      code: 0,
      label: "Sunny Horizon",
      icon: Sun,
      temp: 30,
      tempMax: 34,
      tempMin: 21,
      conditionText: "Brilliant Sunscreen Weather",
      humidity: 32,
      windSpeed: 8,
      apparentTemp: 32,
      precipitation: 0,
      uvIndex: 9,
      visibility: 15,
      pressure: 1016,
      details: "Warm amber theme with clear rays"
    },
    {
      code: 63,
      label: "Rain Showers",
      icon: CloudRain,
      temp: 15,
      tempMax: 18,
      tempMin: 11,
      conditionText: "Frequent Rain Showers",
      humidity: 89,
      windSpeed: 22,
      apparentTemp: 13,
      precipitation: 6.8,
      uvIndex: 1,
      visibility: 6,
      pressure: 1008,
      details: "Deep ocean navy themed rain"
    },
    {
      code: 45,
      label: "Foggy Drift",
      icon: CloudFog,
      temp: 9,
      tempMax: 11,
      tempMin: 6,
      conditionText: "Dense Misty Fog",
      humidity: 100,
      windSpeed: 4,
      apparentTemp: 8,
      precipitation: 0.1,
      uvIndex: 2,
      visibility: 1,
      pressure: 1022,
      details: "Mineral slate grey layout mapping"
    },
    {
      code: 95,
      label: "Thunderstorm",
      icon: CloudLightning,
      temp: 24,
      tempMax: 27,
      tempMin: 19,
      conditionText: "Severe Lightning Storm",
      humidity: 91,
      windSpeed: 45,
      apparentTemp: 25,
      precipitation: 16.4,
      uvIndex: 3,
      visibility: 4,
      pressure: 997,
      details: "Electric neon purple style aura"
    },
    {
      code: 73,
      label: "Cold Snowfall",
      icon: CloudSnow,
      temp: -3,
      tempMax: -1,
      tempMin: -8,
      conditionText: "Fresh Snowy Flurries",
      humidity: 81,
      windSpeed: 17,
      apparentTemp: -9,
      precipitation: 3.5,
      uvIndex: 1,
      visibility: 3,
      pressure: 1012,
      details: "Icy polar sky blue aesthetic"
    }
  ], []);

  // Compute active weather taking simulation choices into consideration
  const activeWeather = useMemo(() => {
    if (!weatherData) return null;
    if (simulatedCode === null) return weatherData;

    const matched = weatherSimulations.find(s => s.code === simulatedCode);
    if (!matched || matched.temp === null) return weatherData;

    return {
      ...weatherData,
      temp: matched.temp,
      tempMax: matched.tempMax ?? weatherData.tempMax,
      tempMin: matched.tempMin ?? weatherData.tempMin,
      conditionText: matched.conditionText ?? weatherData.conditionText,
      weatherCode: matched.code ?? weatherData.weatherCode,
      humidity: matched.humidity ?? weatherData.humidity,
      windSpeed: matched.windSpeed ?? weatherData.windSpeed,
      apparentTemp: matched.apparentTemp ?? weatherData.apparentTemp,
      precipitation: matched.precipitation ?? weatherData.precipitation,
      uvIndex: matched.uvIndex ?? weatherData.uvIndex,
      visibility: matched.visibility ?? weatherData.visibility,
      pressure: matched.pressure ?? weatherData.pressure,
    };
  }, [weatherData, simulatedCode, weatherSimulations]);

  // Severe Weather Alert State Tracker & Dismissals
  const [dismissedAlert, setDismissedAlert] = useState<string | null>(null);

  // Analyze active weather for severe hazards
  const activeAlert = useMemo(() => {
    if (!activeWeather) return null;
    const code = activeWeather.weatherCode;
    const temp = activeWeather.temp;
    const wind = activeWeather.windSpeed;
    const uv = activeWeather.uvIndex;

    if ([95, 96, 99].includes(code)) {
      return {
        id: "thunderstorm-" + code,
        type: "danger",
        title: "SEVERE THUNDERSTORM WARNING",
        message: "Dangerous lightning and extreme convective storm cells detected in this area. Heavy rainfall and wind gusts are active. Take immediate indoor shelter.",
        severity: "CRITICAL RISK LEVEL",
        colorClass: "bg-red-50/95 border-red-300 text-red-950 shadow-md",
        iconClass: "text-red-600 bg-red-100 border border-red-200",
        actionBtn: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-200"
      };
    }
    if (temp <= 0) {
      return {
        id: "freeze-" + temp,
        type: "warning",
        title: "EXTREME SUB-ZERO FREEZING TEMPERATURE ALERT",
        message: "Sub-zero temperatures below freezing are active. High risk of frostbite on exposed skin and frozen pipeline infrastructure. Bundle up extensively.",
        severity: "SEVERE COLD RISK",
        colorClass: "bg-cyan-50/95 border-cyan-300 text-cyan-950 shadow-md",
        iconClass: "text-cyan-600 bg-cyan-100 border border-cyan-200",
        actionBtn: "bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-200"
      };
    }
    if (wind >= 38) {
      return {
        id: "wind-" + wind,
        type: "warning",
        title: "GALE FORCE HIGH WIND VELOCITY ADVISORY",
        message: "Violent local atmospheric pressure gradient pushing high-velocity gusts. Secure loose outdoor property and avoid open ridges.",
        severity: "MODERATE GALE RISK",
        colorClass: "bg-amber-50/95 border-amber-300 text-slate-900 shadow-md",
        iconClass: "text-amber-600 bg-amber-100 border border-amber-200",
        actionBtn: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-200"
      };
    }
    if (uv >= 8) {
      return {
        id: "uv-" + uv,
        type: "info",
        title: "EXTREME ULTRAVIOLET RADIATION WARNING",
        message: "Very dangerous UV exposure scale. Safe skin contact limit is less than 15 minutes. Wear SPF 50+, hats, and premium protective clothing.",
        severity: "CRITICAL SUNBURN INDEX",
        colorClass: "bg-orange-50/95 border-orange-300 text-orange-950 shadow-md",
        iconClass: "text-orange-600 bg-orange-100 border border-orange-200",
        actionBtn: "bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-200"
      };
    }
    return null;
  }, [activeWeather]);

  // Temperature Glow Effect Configuration matching warm/cool profiles
  const temperatureGlow = useMemo(() => {
    if (!activeWeather) {
      return {
        id: "neutral",
        glowColor: "rgba(255, 255, 255, 0.15)",
        blurColor: "rgba(255, 255, 255, 0.08)",
        shadowClass: "shadow-slate-500/10",
        indicatorText: "N/A FEEDBACK",
        indicatorStyle: "bg-slate-500/10 text-slate-100 border-slate-500/20",
        pulseStyle: "bg-slate-400"
      };
    }
    const temp = activeWeather.temp;
    if (temp >= 30) {
      // Extremely Hot: Deep brilliant red/orange glow
      return {
        id: "extreme-heat",
        glowColor: "rgba(239, 68, 68, 0.45)", // red-500
        blurColor: "rgba(249, 115, 22, 0.3)", // orange-500
        shadowClass: "shadow-[0_0_50px_0_rgba(239,68,68,0.35)]",
        shadowHover: "hover:shadow-[0_0_60px_5px_rgba(239,68,68,0.45)]",
        indicatorText: "🔥 THERMAL HEAT WAVE INJECTION ACTIVE",
        indicatorStyle: "bg-red-500/20 text-red-200 border-red-500/30",
        pulseStyle: "bg-red-400 duration-1000 animate-pulse"
      };
    } else if (temp >= 20) {
      // Warm: Warm amber/orange glow
      return {
        id: "moderate-warmth",
        glowColor: "rgba(245, 158, 11, 0.38)", // amber-500
        blurColor: "rgba(234, 179, 8, 0.22)", // yellow-500
        shadowClass: "shadow-[0_0_40px_0_rgba(245,158,11,0.25)]",
        shadowHover: "hover:shadow-[0_0_50px_5px_rgba(245,158,11,0.35)]",
        indicatorText: "☀️ MID-RANGE WARMTH CYCLE ACTIVE",
        indicatorStyle: "bg-amber-500/20 text-amber-200 border-amber-500/30",
        pulseStyle: "bg-amber-400 duration-1000 animate-pulse"
      };
    } else if (temp >= 10) {
      // Mild/Cool: Fresh emerald/teal glow
      return {
        id: "mild-spring",
        glowColor: "rgba(16, 185, 129, 0.28)", // emerald-500
        blurColor: "rgba(20, 184, 166, 0.18)", // teal-500
        shadowClass: "shadow-[0_0_35px_0_rgba(16,185,129,0.18)]",
        shadowHover: "hover:shadow-[0_0_45px_5px_rgba(16,185,129,0.28)]",
        indicatorText: "🌱 OPTIMAL TEMPERATE BALANCE",
        indicatorStyle: "bg-emerald-500/20 text-emerald-100 border-emerald-500/30",
        pulseStyle: "bg-emerald-400 duration-1000 animate-pulse"
      };
    } else if (temp >= 0) {
      // Chilly: Ice blue glow
      return {
        id: "cold-chill",
        glowColor: "rgba(14, 165, 233, 0.35)", // sky-500
        blurColor: "rgba(59, 130, 246, 0.18)", // blue-500
        shadowClass: "shadow-[0_0_40px_0_rgba(14,165,233,0.25)]",
        shadowHover: "hover:shadow-[0_0_50px_5px_rgba(14,165,233,0.35)]",
        indicatorText: "❄️ SUB-CHILL ATMOSPHERIC INFUSION",
        indicatorStyle: "bg-sky-500/20 text-sky-100 border-sky-500/30",
        pulseStyle: "bg-sky-400 duration-1000 animate-pulse"
      };
    } else {
      // Deep Freeze: Indigo/purple glow
      return {
        id: "deep-freezing",
        glowColor: "rgba(139, 92, 246, 0.48)", // purple-500
        blurColor: "rgba(99, 102, 241, 0.28)", // indigo-500
        shadowClass: "shadow-[0_0_50px_0_rgba(139,92,246,0.35)]",
        shadowHover: "hover:shadow-[0_0_60px_5px_rgba(139,92,246,0.45)]",
        indicatorText: "🥶 CRYOGENIC CRITICAL CHILL ENVELOPE",
        indicatorStyle: "bg-purple-500/20 text-purple-200 border-purple-500/30",
        pulseStyle: "bg-purple-400 duration-1000 animate-pulse"
      };
    }
  }, [activeWeather]);

  // Auto-reset dismissed alerts if user changes city or changes active weather preset simulation
  useEffect(() => {
    setDismissedAlert(null);
  }, [selectedCity, simulatedCode]);

  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [hourlyViewMode, setHourlyViewMode] = useState<"cards" | "chart">("chart");
  const [hourlyZoom, setHourlyZoom] = useState<6 | 12>(12);
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [showNowMarker, setShowNowMarker] = useState<boolean>(true);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);

  // Format hourly weather trends data for Recharts plotted view
  const hourlyChartData = useMemo(() => {
    const sliced = hourlyForecast.slice(0, hourlyZoom);
    return sliced.map((hour, idx) => {
      const numericTemp = tempUnit === "F" ? Math.round(cToF(hour.temp)) : Math.round(hour.temp);
      let trend: "up" | "down" | "flat" = "flat";
      let trendDiff = 0;
      if (idx > 0) {
        const prevHour = sliced[idx - 1];
        const prevNumericTemp = tempUnit === "F" ? Math.round(cToF(prevHour.temp)) : Math.round(prevHour.temp);
        trendDiff = numericTemp - prevNumericTemp;
        if (trendDiff > 0) {
          trend = "up";
        } else if (trendDiff < 0) {
          trend = "down";
        }
      }
      return {
        name: formatTime(hour.time),
        temperature: numericTemp,
        precipitation: hour.rainChance,
        trend,
        trendDiff: Math.abs(trendDiff)
      };
    });
  }, [hourlyForecast, tempUnit, hourlyZoom]);
  
  // Loading & status flags
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Tooltip & clipboard copy states
  const [shareCopied, setShareCopied] = useState(false);

  // Build high-concept copyable weather report summary
  const handleShareWeather = () => {
    if (!activeWeather) return;
    const currentTemp = tempUnit === "F" ? `${Math.round(cToF(activeWeather.temp))}°F` : `${Math.round(activeWeather.temp)}°C`;
    const apparent = tempUnit === "F" ? `${Math.round(cToF(activeWeather.apparentTemp))}°F` : `${Math.round(activeWeather.apparentTemp)}°C`;
    const high = tempUnit === "F" ? `${Math.round(cToF(activeWeather.tempMax))}°F` : `${Math.round(activeWeather.tempMax)}°C`;
    const low = tempUnit === "F" ? `${Math.round(cToF(activeWeather.tempMin))}°F` : `${Math.round(activeWeather.tempMin)}°C`;
    
    const summary = `📍 METEOROLOGICAL CURRENT SUMMARY FOR: ${selectedCity.name.toUpperCase()}
🌍 Location: ${selectedCity.state ? `${selectedCity.state}, ` : ""}${selectedCity.country}
🌡️ Measured Temperature: ${currentTemp} (Feels like ${apparent})
🌤️ Current Profile: ${activeTheme.text}
📈 Today's Extremums: High: ${high} | Low: ${low}
💧 Absolute Humidity: ${activeWeather.humidity}%
💨 Windflow velocity: ${activeWeather.windSpeed} km/h
☀️ UV Radiation Scale: ${activeWeather.uvIndex}
👁️ Environmental Sight Range: ${Math.round(activeWeather.visibility)} km
🧭 Barometric Air Pressure: ${Math.round(activeWeather.pressure)} hPa

Shared via WeatherApplication. Sync Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    navigator.clipboard.writeText(summary)
      .then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Clipboard system failure:", err);
      });
  };

  // AI analysis outcomes
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [aiNews, setAiNews] = useState<AINewsArticle[]>([]);
  const [isAiFallback, setIsAiFallback] = useState<boolean>(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Default initial configuration suggestion on page mount
  useEffect(() => {
    fetchWeatherData(selectedCity);
    setActiveTab("bulletin");
  }, [selectedCity]);

  // Handle auto scroll-to-bottom for chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const fetchWeatherData = async (city: CitySuggestion) => {
    setIsWeatherLoading(true);
    setApiError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,uv_index,visibility&hourly=temperature_2m,weather_code,precipitation_probability,rain&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,rain_sum&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Could not fetch meteorological forecast data.");

      const raw = await res.json();
      
      const current = raw.current;
      const parsedWeather: CurrentWeather = {
        temp: current.temperature_2m,
        apparentTemp: current.apparent_temperature,
        tempMax: raw.daily.temperature_2m_max[0],
        tempMin: raw.daily.temperature_2m_min[0],
        weatherCode: current.weather_code,
        conditionText: getWeatherCondition(current.weather_code).text,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        pressure: current.pressure_msl,
        uvIndex: current.uv_index,
        visibility: current.visibility,
        sunrise: raw.daily.sunrise[0],
        sunset: raw.daily.sunset[0],
        rainSum: raw.daily.rain_sum[0]
      };

      setWeatherData(parsedWeather);

      // Hourly items (next 12 hours)
      const hourlyList: HourlyForecast[] = [];
      const currentHourIdx = new Date().getHours();
      for (let i = currentHourIdx; i < currentHourIdx + 12; i++) {
        if (raw.hourly.time[i]) {
          hourlyList.push({
            time: raw.hourly.time[i],
            temp: raw.hourly.temperature_2m[i],
            weatherCode: raw.hourly.weather_code[i],
            rainChance: raw.hourly.precipitation_probability[i] || 0
          });
        }
      }
      setHourlyForecast(hourlyList);

      // Daily Forecast lists (next 7 days)
      const dailyList: DailyForecast[] = [];
      for (let i = 0; i < 7; i++) {
        if (raw.daily.time[i]) {
          dailyList.push({
            date: raw.daily.time[i],
            weekday: formatWeekday(raw.daily.time[i]),
            tempMax: raw.daily.temperature_2m_max[i],
            tempMin: raw.daily.temperature_2m_min[i],
            weatherCode: raw.daily.weather_code[i],
            rainSum: raw.daily.rain_sum[i] || 0
          });
        }
      }
      setDailyForecast(dailyList);

      // Trigger server-side AI integrations
      fetchServerAiData(city, parsedWeather);

    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Something went wrong fetching weather forecasts.");
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const fetchServerAiData = async (city: CitySuggestion, current: CurrentWeather) => {
    setIsAiLoading(true);
    let insightsFallback = false;
    let newsFallback = false;
    try {
      // 1. Fetch Tailored AI Metrics Insights Recommendations
      let insightsResult: any = null;
      try {
        const resInsights = await fetch("/api/weather/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: city.name,
            country: city.country,
            temp: current.temp,
            weatherCode: current.weatherCode,
            conditionText: current.conditionText,
            humidity: current.humidity,
            wind: current.windSpeed
          })
        });
        const contentType = resInsights.headers.get("content-type") || "";
        if (resInsights.ok && contentType.includes("application/json")) {
          insightsResult = await resInsights.json();
        } else {
          console.warn("Could not retrieve JSON from insights, status:", resInsights.status);
          insightsFallback = true;
        }
      } catch (e) {
        console.warn("Non-blocking insights query exception handled smoothly.");
        insightsFallback = true;
      }

      // 2. Fetch Localized Weather Stories Feed
      let newsResult: any = null;
      try {
        const resNews = await fetch("/api/weather/ai-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: city.name,
            country: city.country,
            temp: current.temp,
            conditionText: current.conditionText,
            currentLocalTime: new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })
          })
        });
        const contentType = resNews.headers.get("content-type") || "";
        if (resNews.ok && contentType.includes("application/json")) {
          newsResult = await resNews.json();
        } else {
          console.warn("Could not retrieve JSON from news bulletin, status:", resNews.status);
          newsFallback = true;
        }
      } catch (e) {
        console.warn("Non-blocking news bulletin query exception handled smoothly.");
        newsFallback = true;
      }

      if (insightsResult && !insightsResult.error) {
        setAiInsights(insightsResult);
        if (insightsResult._isFallback) insightsFallback = true;
      } else {
        insightsFallback = true;
        // Safe Client-Side fallback matching our premium model structure
        setAiInsights({
          brief: `Currently ${current.temp}°C and ${current.conditionText || 'Clear'} in ${city.name}. Refreshing and favorable air conditions are estimated.`,
          clothing: ["Layered comfort jacket", "Knit fleece coat", "Breathable daily jeans"],
          activities: [
            { name: "Outdoor Cardio & Running", rating: 88, status: "Ideal", tip: "Maintain comfortable paces, bring clean water, and stay active." },
            { name: "Eco Walk & Sightseeing", rating: 92, status: "Ideal", tip: "Excellent clear visibility makes it a stellar day to take snapshots." }
          ],
          healthAdvice: "Apply moisturizer, shelter your eyes, and choose shaded hiking paths."
        });
      }

      if (newsResult && newsResult.articles && !newsResult.error) {
        setAiNews(newsResult.articles);
        if (newsResult._isFallback) newsFallback = true;
      } else {
        newsFallback = true;
        // Safe Client-Side fallback articles matching our premium structure
        setAiNews([
          {
            id: "local-news-a",
            title: `Community Outing Patterns Rise in ${city.name}`,
            content: `Atmospheric measurements show comfortable ${current.temp}°C air today. Residents are taking advantage of pleasant skies for morning park runs and wellness strolls.`,
            category: "Community Feed",
            readTime: "1 min read",
            tag: "COMMUNITY"
          },
          {
            id: "grid-energy-b",
            title: `${city.name} Regional Energy Grid Remains Secure`,
            content: `Moderate air coordinates minimize high dynamic heating or cooling power spikes, assuring strong energy backup margins for residential areas.`,
            category: "Grid Balance",
            readTime: "2 min read",
            tag: "GRID SAFE"
          }
        ]);
      }

      setIsAiFallback(insightsFallback || newsFallback);

      // Initialize welcome chatbot message relative to this new city environment
      setChatMessages([
        {
          id: "welcome",
          role: "model",
          text: `Greetings! I have loaded the atmospheric parameters for **${city.name}, ${city.country}**. It is currently ${current.temp}°C with ${current.conditionText}. 

Do you want advice on travel itineraries, local microclimates, or outdoor activities? Ask me anything!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

    } catch (err) {
      console.warn("AI Generation pipeline fallback activated.");
      setIsAiFallback(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;

    const userMsgText = chatInput;
    setChatInput("");

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setIsChatTyping(true);

    try {
      const response = await fetch("/api/weather/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsgText,
          chatHistory: chatMessages.slice(-8), // Keep a small sliding conversation memory
          currentSystemContext: `User is viewing weather for: ${selectedCity.name}, ${selectedCity.country}. Current Metrics: Temp ${weatherData?.temp}°C, Feel ${weatherData?.apparentTemp}°C, Condition: ${weatherData?.conditionText}, Wind ${weatherData?.windSpeed} km/h, Humidity ${weatherData?.humidity}%`
        })
      });

      const data = await response.json();
      if (response.ok && data.response) {
        setChatMessages(prev => [...prev, {
          id: String(Date.now() + 1),
          role: "model",
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(data.error || "Failed companion lookup");
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        id: String(Date.now() + 1),
        role: "model",
        text: "I experienced a minor atmospheric interruption connecting to Gemini. Please try saying that again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const activeTheme = activeWeather ? getWeatherCondition(activeWeather.weatherCode) : getWeatherCondition(3);

  // Derive responsive style bindings for interactive color theme customization on-the-fly!
  const uiStyles = useMemo(() => {
    const primary = activeTheme.themeColor;
    if (primary === "amber-500") {
      return {
        bgApp: "bg-amber-50/25",
        accentBg: "bg-white border-amber-200/60 shadow-amber-900/5",
        accentText: "text-amber-600",
        accentButton: "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-200 shadow-amber-500/10",
        accentNavIconBg: "bg-amber-500/10 border border-amber-500/20",
        accentNavIcon: "text-amber-600",
        accentBadge: "bg-amber-100 text-amber-800 border border-amber-200/50",
        brandText: "text-amber-600",
        brandHighlight: "text-amber-500",
        indicatorDot: "bg-amber-500",
        tabActive: "bg-white text-amber-700 shadow-sm border border-amber-200/55",
        heading: "text-amber-950"
      };
    } else if (primary === "cyan-500") {
      return {
        bgApp: "bg-cyan-50/25",
        accentBg: "bg-white border-cyan-200/60 shadow-cyan-900/5",
        accentText: "text-cyan-600",
        accentButton: "bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-200 shadow-cyan-600/10",
        accentNavIconBg: "bg-cyan-50/80 border border-cyan-100",
        accentNavIcon: "text-cyan-600",
        accentBadge: "bg-cyan-100 text-cyan-800 border border-cyan-200/50",
        brandText: "text-cyan-600",
        brandHighlight: "text-cyan-500",
        indicatorDot: "bg-cyan-500",
        tabActive: "bg-white text-cyan-700 shadow-sm border border-cyan-200/55",
        heading: "text-cyan-950"
      };
    } else if (primary === "blue-500") {
      return {
        bgApp: "bg-blue-50/25",
        accentBg: "bg-white border-blue-200/60 shadow-blue-900/5",
        accentText: "text-blue-600",
        accentButton: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-200 shadow-blue-600/10",
        accentNavIconBg: "bg-blue-50 border border-blue-100/80",
        accentNavIcon: "text-blue-600",
        accentBadge: "bg-blue-100 text-blue-800 border border-blue-200/50",
        brandText: "text-blue-600",
        brandHighlight: "text-blue-500",
        indicatorDot: "bg-blue-500",
        tabActive: "bg-white text-blue-700 shadow-sm border border-blue-200/55",
        heading: "text-blue-950"
      };
    } else if (primary === "sky-300") {
      return {
        bgApp: "bg-sky-50/30",
        accentBg: "bg-white border-sky-200/60 shadow-sky-900/5",
        accentText: "text-sky-600",
        accentButton: "bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-200 shadow-sky-500/10",
        accentNavIconBg: "bg-sky-50/80 border border-sky-100",
        accentNavIcon: "text-sky-600",
        accentBadge: "bg-sky-100 text-sky-800 border border-sky-200/50",
        brandText: "text-sky-600",
        brandHighlight: "text-sky-500",
        indicatorDot: "bg-sky-400",
        tabActive: "bg-white text-sky-700 shadow-sm border border-sky-200/55",
        heading: "text-sky-950"
      };
    } else if (primary === "purple-500") {
      return {
        bgApp: "bg-purple-50/25",
        accentBg: "bg-white border-purple-200/60 shadow-purple-900/5",
        accentText: "text-purple-600",
        accentButton: "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-250 shadow-purple-600/10",
        accentNavIconBg: "bg-purple-50/80 border border-purple-100",
        accentNavIcon: "text-purple-600",
        accentBadge: "bg-purple-100 text-purple-800 border border-purple-200/50",
        brandText: "text-purple-600",
        brandHighlight: "text-purple-500",
        indicatorDot: "bg-purple-500",
        tabActive: "bg-white text-purple-700 shadow-sm border border-purple-200/55",
        heading: "text-purple-950"
      };
    } else if (primary === "zinc-400") {
      return {
        bgApp: "bg-zinc-100/40",
        accentBg: "bg-white border-zinc-200 shadow-zinc-900/5",
        accentText: "text-zinc-700",
        accentButton: "bg-zinc-700 hover:bg-zinc-800 text-white focus:ring-zinc-200 shadow-zinc-700/10",
        accentNavIconBg: "bg-zinc-100 border border-zinc-200",
        accentNavIcon: "text-zinc-500",
        accentBadge: "bg-zinc-100 text-zinc-800 border border-zinc-200/50",
        brandText: "text-zinc-650",
        brandHighlight: "text-zinc-500",
        indicatorDot: "bg-zinc-400",
        tabActive: "bg-white text-zinc-700 shadow-sm border border-zinc-300",
        heading: "text-zinc-900"
      };
    } else {
      return {
        bgApp: "bg-slate-50/60",
        accentBg: "bg-white border-[#e5e7eb] shadow-sm",
        accentText: "text-[#4f46e5]",
        accentButton: "bg-[#4f46e5] hover:bg-[#4338ca] text-white",
        accentNavIconBg: "bg-indigo-50 border border-indigo-100/80",
        accentNavIcon: "text-indigo-600",
        accentBadge: "bg-indigo-100 text-indigo-800 border border-indigo-200/50",
        brandText: "text-indigo-600",
        brandHighlight: "text-[#4f46e5]",
        indicatorDot: "bg-indigo-500",
        tabActive: "bg-white text-indigo-700 shadow-sm border border-indigo-100/50",
        heading: "text-slate-900"
      };
    }
  }, [activeTheme]);

  return (
    <div className={`min-h-screen ${uiStyles.bgApp} transition-all duration-500 text-[#1f2937] flex flex-col font-sans`} id="venture-app-root">
      
      {/* 1. Sleek Navigation Header */}
      <nav className="h-16 bg-white border-b border-[#e5e7eb] flex items-center justify-between px-6 shrink-0 shadow-sm" id="app-navbar">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${uiStyles.accentNavIconBg} rounded-xl transition-colors duration-500`}>
            <CloudSun className={`w-6 h-6 ${uiStyles.accentNavIcon} transition-colors duration-500`} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#1f2937]" id="logo-branding">
            Weather<span className={`${uiStyles.accentText} font-extrabold transition-colors duration-500 ml-1`}>Application</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
          <span className={`${uiStyles.accentText} ${uiStyles.accentNavIconBg} px-3 py-1 rounded-full text-xs font-bold font-mono transition-all duration-500`}>Dashboard</span>
          <span className="hover:text-slate-800 transition-colors cursor-pointer">Microclimates</span>
          <span className="hover:text-slate-800 transition-colors cursor-pointer">Travel Guides</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Temperature Unit Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-[#e5e7eb]" id="navbar-temp-toggle">
            <button
              onClick={() => setTempUnit("C")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tempUnit === "C"
                  ? `bg-white ${uiStyles.accentText} shadow-sm border border-slate-200/40`
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTempUnit("F")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tempUnit === "F"
                  ? `bg-white ${uiStyles.accentText} shadow-sm border border-slate-200/40`
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              °F
            </button>
          </div>

          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              METEOROLOGICAL ENGINE ACTIVE
            </div>
          </div>
          <div className={`w-8 h-8 rounded-full ${uiStyles.accentNavIconBg} flex items-center justify-center font-bold text-xs ${uiStyles.accentText} transition-all duration-500`}>
            {selectedCity.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* Main Core Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6" id="app-hero-panel">
        
        {/* Sleek Search Header Panel with title prompt matching custom preset instructions */}
        <div className="text-center my-4" id="banner-geocoder-search">
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#1f2937] tracking-tight mb-2">
            Where to next?
          </h1>
          <p className="text-[#6b7280] max-w-xl mx-auto text-sm md:text-base mb-6">
            Search live weather metrics and receive actionable, real-time meteorological insights for over 150,000 cities.
          </p>

          {/* Search Box Component */}
          <SearchCity 
            onSelectCity={(city) => setSelectedCity(city)} 
            isLoading={isWeatherLoading} 
          />
        </div>

        {apiError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 max-w-xl mx-auto shadow-sm" id="geocoder-api-error">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-xs font-semibold">{apiError}</p>
          </div>
        )}

        {/* Severe Weather Alert Toast Notification */}
        {activeAlert && dismissedAlert !== activeAlert.id && (
          <div 
            className={`p-5 rounded-2xl border ${activeAlert.colorClass} relative overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-top-4`}
            id="severe-weather-alert-toast"
          >
            {/* Blinking severe status corner element */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider font-mono opacity-80">
                {activeAlert.severity}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${activeAlert.iconClass}`}>
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="pr-12 md:pr-0">
                  <h3 className="text-sm font-black tracking-tight uppercase block leading-snug">
                    {activeAlert.title}
                  </h3>
                  <p className="text-xs opacity-90 mt-1 max-w-2xl leading-relaxed font-sans">
                    {activeAlert.message}
                  </p>
                  
                  {/* Action protective guidelines list */}
                  <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="bg-black/5 px-2.5 py-1 rounded border border-black/10 font-mono">
                      🛡️ SECURE ASSETS ACTIVE
                    </span>
                    <span className="bg-black/5 px-2.5 py-1 rounded border border-black/10 font-mono">
                      🏡 SAFETY PROTOCOLS ENGAGED
                    </span>
                  </div>
                </div>
              </div>

              {/* Toast Actions */}
              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <button
                  onClick={() => setDismissedAlert(activeAlert.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-sm cursor-pointer whitespace-nowrap ${activeAlert.actionBtn}`}
                  id="btn-acknowledge-alert"
                >
                  ACKNOWLEDGE WARNING
                </button>
              </div>
            </div>
          </div>
        )}

        {/* If alert is active but dismissed, provide a discrete reactivation trigger pill */}
        {activeAlert && dismissedAlert === activeAlert.id && (
          <div className="flex justify-end -mt-3" id="reactivate-alert-wrapper">
            <button
              onClick={() => setDismissedAlert(null)}
              className="text-[10px] bg-rose-50 border border-rose-250 text-rose-700 font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm hover:bg-rose-100 transition-all cursor-pointer"
              id="btn-restore-alert"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              ⚠️ 1 ACTIVE SEVERE WARNING DISMISSED (CLICK TO REVIEW)
            </button>
          </div>
        )}

        {/* Interactive Microclimate & Dynamic Theme Simulator Tray */}
        {weatherData && (
          <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] shadow-sm flex flex-col gap-3.5 transition-all duration-300 mt-2" id="microclimate-interactive-simulator">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 font-sans tracking-tight">
                  <Sparkles className={`w-4 h-4 ${uiStyles.accentText}`} />
                  Interactive Color, Style & Weather Controls
                </h3>
                <p className="text-[11px] text-slate-400">
                  Click a preset microclimate below to dynamically rewrite atmospheric variables and shift the dashboard's design aesthetics instantly.
                </p>
              </div>
              {simulatedCode !== null && (
                <button
                  onClick={() => setSimulatedCode(null)}
                  className="text-[11px] font-extrabold flex items-center gap-1 text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Reset to Live Station Feed
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {weatherSimulations.map((sim) => {
                const SimIcon = sim.icon;
                const isSelected = simulatedCode === sim.code;
                return (
                  <button
                    key={sim.label}
                    onClick={() => setSimulatedCode(sim.code)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all duration-300 cursor-pointer group ${
                      isSelected
                        ? `${uiStyles.accentNavIconBg} ${uiStyles.accentBadge} ring-2 ring-indigo-500/10`
                        : "bg-[#fafafa] border-slate-200/50 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? "bg-white text-indigo-600 shadow-sm" : "bg-slate-100 text-slate-500"
                    }`}>
                      <SimIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block text-slate-800 truncate leading-tight">
                        {sim.label}
                      </span>
                      <span className="text-[9px] text-slate-400 block truncate font-mono mt-0.5">
                        {sim.temp !== null ? `${sim.temp}°C / ${cToF(sim.temp)}°F` : "Auto Station"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic primary panels layout */}
        {activeWeather && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2" id="dashboard-mesh">
            
            {/* LEFT HALF columns (8) : Primary metrics, Hourly lists & Forecasts */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Premium Condition Hero Banner */}
              <div 
                className={`p-6 md:p-8 rounded-3xl bg-gradient-to-br ${activeTheme.gradientClass} text-white border border-white/5 relative overflow-hidden flex flex-col justify-between transition-all duration-1000 ${temperatureGlow.shadowClass} ${temperatureGlow.shadowHover}`}
                id="hero-condition-panel"
              >
                {/* Background ambient dynamic temperature glow effect */}
                <div 
                  className="absolute right-0 bottom-0 top-0 w-3/4 opacity-40 pointer-events-none rounded-3xl transition-all duration-1000 ease-in-out mix-blend-screen" 
                  style={{ 
                    backgroundImage: `radial-gradient(circle at 100% 50%, ${temperatureGlow.glowColor} 0%, ${temperatureGlow.blurColor} 45%, transparent 100%)`,
                    filter: 'blur(24px)'
                  }} 
                />
                
                {/* Secondary centering subtle glow behind the main temperature display */}
                <div 
                  className="absolute left-10 bottom-10 w-44 h-44 opacity-25 pointer-events-none rounded-full transition-all duration-1000 ease-in-out mix-blend-screen"
                  style={{ 
                    backgroundImage: `radial-gradient(circle, ${temperatureGlow.glowColor} 0%, transparent 65%)`,
                    filter: 'blur(30px)'
                  }}
                />
                
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <span className="px-3 py-1 text-[11px] font-bold tracking-wider uppercase bg-white/10 backdrop-blur-md rounded-full border border-white/20 inline-block mb-3">
                      Current Air Parameters
                    </span>
                    <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight uppercase">
                      <MapPin className="w-5 h-5 text-white/90" />
                      {selectedCity.name}
                    </h2>
                    <p className="text-white/80 text-xs font-medium tracking-wide mt-1">
                      {selectedCity.state ? `${selectedCity.state}, ` : ""}{selectedCity.country}
                    </p>

                    {/* Interactive Temperature Glow Indicator Badge */}
                    <div className={`mt-3 select-none flex items-center gap-1.5 text-[9px] font-black tracking-widest font-mono uppercase px-2.5 py-1 rounded-full border max-w-max transition-all duration-1000 ${temperatureGlow.indicatorStyle}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${temperatureGlow.pulseStyle}`} />
                      {temperatureGlow.indicatorText}
                    </div>
                  </div>
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <activeTheme.icon className="w-8 h-8 text-white scale-125 duration-1000" />
                  </div>
                </div>

                <div className="mt-8 flex items-baseline gap-4 relative z-10">
                  <span className="text-5xl md:text-7xl font-extrabold tracking-tighter">
                    {formatTemp(activeWeather.temp)}
                  </span>
                  <div>
                    <span className="text-lg font-bold block leading-6">
                      {activeTheme.text}
                    </span>
                    <span className="text-xs text-white/70 block mt-1 font-medium font-mono">
                      High: {formatTemp(activeWeather.tempMax)} • Low: {formatTemp(activeWeather.tempMin)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/95 relative z-10" id="time-stamp-line">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/70 animate-pulse" />
                    <span>Live measurements sync • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  {/* Share Current Weather button with copy indicator and interactive hover state */}
                  <button
                    onClick={handleShareWeather}
                    className="flex items-center justify-center gap-1.5 text-[10px] font-black tracking-widest uppercase font-mono px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/15 hover:border-white/30 transition-all cursor-pointer shadow-sm select-none"
                    id="btn-share-current-weather"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3px] animate-scale" />
                        <span className="text-emerald-300 font-extrabold">COPIED TO CLIPBOARD!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-white/80" />
                        <span>SHARE CURRENT SUMMARY</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hourly horizontal list forecast slider */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm" id="hourly-forecast-deck">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 border-b border-slate-100 pb-3" id="hourly-header-container">
                  <div className="flex items-center gap-1.5 text-xs text-slate-550 font-extrabold uppercase tracking-widest font-mono">
                    <Clock className="w-4 h-4 text-indigo-500 animate-pulse" /> HOURLY METRIC DYNAMICS (12H)
                  </div>
                  
                  {/* Segmented controls view mode selector */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start sm:self-auto" id="hourly-view-mode-selector">
                    <button
                      onClick={() => setHourlyViewMode("cards")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wide cursor-pointer transition-all duration-300 ${
                        hourlyViewMode === "cards" 
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/40" 
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                      id="toggle-hourly-cards"
                    >
                      GRID CARDS
                    </button>
                    <button
                      onClick={() => setHourlyViewMode("chart")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wide cursor-pointer transition-all duration-300 ${
                        hourlyViewMode === "chart" 
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/40" 
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                      id="toggle-hourly-chart"
                    >
                      INTERACTIVE PLOT
                    </button>
                  </div>
                </div>

                {hourlyViewMode === "cards" ? (
                  <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar" id="hourly-cards-slider">
                    {hourlyForecast.map((hour, idx) => {
                      const hTheme = getWeatherCondition(hour.weatherCode);
                      return (
                        <div 
                          key={`${hour.time}-${idx}`}
                          className="flex flex-col items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 min-w-[76px] text-center hover:bg-indigo-50/20 hover:border-indigo-100/60 transition-all focus-within:ring-2 focus-within:ring-indigo-150"
                        >
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            {formatTime(hour.time)}
                          </span>
                          <div className="my-2.5">
                            <hTheme.icon className="w-5 h-5 text-indigo-500" />
                          </div>
                          <span className="text-sm font-extrabold text-[#1f2937]">
                            {formatTemp(hour.temp, false)}
                          </span>
                          {hour.rainChance > 0 && (
                            <span className="text-[10px] text-indigo-500 font-bold mt-1.5 flex items-center justify-center gap-0.5">
                              <CloudRain className="w-2.5 h-2.5" />
                              {hour.rainChance}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {/* Zoom Control Panel near the chart wrapper */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 bg-slate-50 border border-slate-200/60 p-2 rounded-xl" id="hourly-chart-controls">
                      <div className="flex items-center gap-1.5 shrink-0" id="hourly-zoom-meta">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest font-mono">
                          TIME WINDOW PREFERENCE:
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2" id="hourly-zoom-actions">
                        {/* Now Marker Toggle */}
                        <button
                          onClick={() => setShowNowMarker(!showNowMarker)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black tracking-wider cursor-pointer border transition-all ${
                            showNowMarker 
                              ? "bg-indigo-50 border-indigo-200/50 text-indigo-700 hover:bg-indigo-100/40" 
                              : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                          }`}
                          id="btn-toggle-now-marker"
                          title="Click to toggle current-time indicator line on chart"
                        >
                          {showNowMarker ? (
                            <>
                              <Eye className="w-3 h-3 text-indigo-500" />
                              <span>NOW MARKER: ON</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-slate-400" />
                              <span>NOW MARKER: OFF</span>
                            </>
                          )}
                        </button>

                        <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-300/45" id="hourly-zoom-buttons">
                          <button
                            onClick={() => setHourlyZoom(6)}
                            className={`px-3 py-1 rounded-md text-[9px] font-black tracking-wider cursor-pointer transition-all ${
                              hourlyZoom === 6 
                                ? "bg-white text-indigo-700 shadow-sm font-extrabold border border-slate-200/10" 
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                            id="btn-zoom-6h"
                          >
                            6H WINDOW
                          </button>
                          <button
                            onClick={() => setHourlyZoom(12)}
                            className={`px-3 py-1 rounded-md text-[9px] font-black tracking-wider cursor-pointer transition-all ${
                              hourlyZoom === 12 
                                ? "bg-white text-indigo-700 shadow-sm font-extrabold border border-slate-200/10" 
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                            id="btn-zoom-12h"
                          >
                            12H WINDOW
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-[240px] mt-2" id="hourly-chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={hourlyChartData}
                        margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                        onMouseMove={(e) => {
                          if (e && e.activeTooltipIndex !== undefined && e.activeTooltipIndex !== null) {
                            setActiveHoverIndex(e.activeTooltipIndex);
                          } else {
                            setActiveHoverIndex(null);
                          }
                        }}
                        onMouseLeave={() => {
                          setActiveHoverIndex(null);
                        }}
                      >
                        <defs>
                          <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} stroke="#94a3b8" />
                        <XAxis 
                          dataKey="name" 
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#4f46e5', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                          domain={['auto', 'auto']}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#0ea5e9', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                          domain={[0, 100]}
                        />
                        <RechartsTooltip 
                          cursor={{
                            stroke: "rgba(99, 102, 241, 0.12)",
                            strokeWidth: 24,
                            strokeLinecap: "round"
                          }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const dataPoint = payload[0].payload;
                              return (
                                <div className="bg-slate-900/95 border border-slate-750 p-2.5 rounded-xl shadow-xl text-white font-mono text-[10px] backdrop-blur-md" id="custom-recharts-tooltip">
                                  <p className="font-extrabold text-slate-300 border-b border-white/10 pb-1 mb-1">{label}</p>
                                  {payload.map((item: any, i: number) => {
                                    const isTemp = item.dataKey === "temperature";
                                    return (
                                      <p key={i} className="flex items-center gap-1.5 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                                        <span className="text-white/70">{isTemp ? "Temperature" : "Rain Prob"}:</span>
                                        <span className={`font-black flex items-center gap-1 ${isTemp ? "text-amber-305 text-amber-300" : "text-sky-305 text-sky-400"}`}>
                                          {item.value}{isTemp ? `°${tempUnit}` : "%"}
                                          {isTemp && dataPoint.trend === "up" && (
                                            <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-0.5 ml-1 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                                              <TrendingUp className="w-2.5 h-2.5 stroke-[3px]" />
                                              +{dataPoint.trendDiff}°
                                            </span>
                                          )}
                                          {isTemp && dataPoint.trend === "down" && (
                                            <span className="text-rose-400 font-bold text-[9px] flex items-center gap-0.5 ml-1 bg-rose-500/15 px-1.5 py-0.5 rounded">
                                              <TrendingDown className="w-2.5 h-2.5 stroke-[3px]" />
                                              -{dataPoint.trendDiff}°
                                            </span>
                                          )}
                                        </span>
                                      </p>
                                    );
                                  })}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="temperature" 
                          stroke="#6366f1" 
                          strokeWidth={2.5}
                          strokeOpacity={activeHoverIndex !== null ? 0.45 : 1.0}
                          fillOpacity={activeHoverIndex !== null ? 0.35 : 1.0}
                          fill="url(#colorTemp)"
                          name="temperature"
                          isAnimationActive={true}
                          animationDuration={1200}
                          animationBegin={100}
                          animationEasing="ease-out"
                          activeDot={false}
                          dot={({ cx, cy, index }) => {
                            if (cx === undefined || cy === undefined) return null;
                            const isFocused = activeHoverIndex === index;
                            const hasFocus = activeHoverIndex !== null;
                            return (
                              <g key={`temp-dot-${index}`}>
                                {isFocused && (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={9}
                                    fill="#6366f1"
                                    opacity={0.3}
                                    className="animate-pulse"
                                  />
                                )}
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isFocused ? 6 : 3.5}
                                  fill={isFocused ? "#ffffff" : "#6366f1"}
                                  stroke={isFocused ? "#6366f1" : "#ffffff"}
                                  strokeWidth={2}
                                  opacity={hasFocus ? (isFocused ? 1.0 : 0.25) : 0.85}
                                  className="transition-all duration-250 ease-out"
                                />
                              </g>
                            );
                          }}
                        />
                        <Area 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="precipitation" 
                          stroke="#0ea5e9"
                          strokeDasharray="4 4" 
                          strokeWidth={1.5}
                          strokeOpacity={activeHoverIndex !== null ? 0.45 : 1.0}
                          fillOpacity={activeHoverIndex !== null ? 0.25 : 1.0}
                          fill="url(#colorRain)"
                          name="precipitation"
                          isAnimationActive={true}
                          animationDuration={1500}
                          animationBegin={250}
                          animationEasing="ease-out"
                          activeDot={false}
                          dot={({ cx, cy, index }) => {
                            if (cx === undefined || cy === undefined) return null;
                            const isFocused = activeHoverIndex === index;
                            const hasFocus = activeHoverIndex !== null;
                            return (
                              <g key={`rain-dot-${index}`}>
                                {isFocused && (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={9}
                                    fill="#0ea5e9"
                                    opacity={0.3}
                                    className="animate-pulse"
                                  />
                                )}
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isFocused ? 6 : 3.5}
                                  fill={isFocused ? "#ffffff" : "#0ea5e9"}
                                  stroke={isFocused ? "#0ea5e9" : "#ffffff"}
                                  strokeWidth={2}
                                  opacity={hasFocus ? (isFocused ? 1.0 : 0.25) : 0.85}
                                  className="transition-all duration-250 ease-out"
                                />
                              </g>
                            );
                          }}
                        />

                        {/* Dynamic focus markers highlighting the current hour */}
                        {showNowMarker && hourlyChartData[0] && (
                          <ReferenceLine 
                            x={hourlyChartData[0].name} 
                            stroke="#4f46e5" 
                            strokeWidth={2} 
                            strokeDasharray="4 3"
                            yAxisId="left"
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowNowMarker(false)}
                            label={{ 
                              value: "NOW ✕", 
                              position: "top", 
                              fill: "#4f46e5", 
                              fontSize: 8, 
                              fontWeight: "bold", 
                              fontFamily: "monospace",
                              offset: 10,
                              style: { cursor: "pointer" }
                            }}
                          />
                        )}
                        {showNowMarker && hourlyChartData[0] && (
                          <ReferenceDot
                            x={hourlyChartData[0].name}
                            y={hourlyChartData[0].temperature}
                            yAxisId="left"
                            r={5.5}
                            fill="#4f46e5"
                            stroke="#ffffff"
                            strokeWidth={2.5}
                            isFront={true}
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowNowMarker(false)}
                          />
                        )}
                        {showNowMarker && hourlyChartData[0] && (
                          <ReferenceDot
                            x={hourlyChartData[0].name}
                            y={hourlyChartData[0].precipitation}
                            yAxisId="right"
                            r={5.5}
                            fill="#0284c7"
                            stroke="#ffffff"
                            strokeWidth={2.5}
                            isFront={true}
                            style={{ cursor: "pointer" }}
                            onClick={() => setShowNowMarker(false)}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>)}
              </div>

              {/* Bento Grid layout for extra standard variables (Humidity, Wind...) */}
              <MetricBentoGrid weather={activeWeather} tempUnit={tempUnit} uiStyles={uiStyles} />

              {/* 7-Day weather agenda view list */}
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm" id="daily-deck">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
                    <Calendar className="w-4 h-4 text-indigo-500" /> 7-Day Dynamic Calendar Outlook
                  </div>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase">Open-Meteo Precision</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {dailyForecast.map((day, idx) => {
                    const dayTheme = getWeatherCondition(day.weatherCode);
                    const isToday = idx === 0;
                    return (
                      <div 
                        key={day.date} 
                        className={`py-3.5 flex items-center justify-between gap-4 transition-colors ${isToday ? 'bg-indigo-50/15 rounded-xl px-2' : ''}`}
                      >
                        <div className="w-24 sm:w-32 min-w-0">
                          <span className="font-bold text-sm text-slate-800 block">
                            {isToday ? "Today" : day.weekday}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {formatMonthAndDay(day.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 w-28">
                          <dayTheme.icon className="w-5 h-5 text-indigo-600/80" />
                          <span className="text-xs text-slate-500 font-medium truncate">
                            {dayTheme.text}
                          </span>
                        </div>
                        <div className="text-right flex items-center gap-4 justify-end">
                          {day.rainSum > 0 && (
                            <span className="text-[11px] font-mono text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/35 font-bold">
                              {day.rainSum.toFixed(1)} mm
                            </span>
                          )}
                          <div className="w-16">
                            <span className="text-sm font-extrabold text-slate-800 font-mono inline-block w-8 text-right">
                              {formatTemp(day.tempMax, false)}
                            </span>
                            <span className="text-xs text-slate-400 font-mono inline-block w-8 text-right">
                              {formatTemp(day.tempMin, false)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT HALF column (5) : AI Intelligence tab matrix (insights, local stories feed, companion chatbot) */}
            <div className="lg:col-span-5 flex flex-col gap-6" id="dashboard-ai-mesh">
              
              {/* Premium AI Selector Container */}
              <div className="bg-white border border-[#e5e7eb] rounded-3xl shadow-md overflow-hidden" id="interactive-ai-hub">
                
                {/* Header and selection tabs */}
                <div className="bg-slate-50 border-b border-slate-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider font-mono">
                      Meteorological Intelligence Hub
                    </h3>
                  </div>
                  
                  {/* Selector tabs */}
                  <div className="flex gap-1.5 p-1 bg-slate-100/90 rounded-xl" id="tab-nav-bar">
                    <button
                      onClick={() => setActiveTab("insights")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "insights"
                          ? `${uiStyles.tabActive} ${uiStyles.accentText}`
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Advice
                    </button>
                    <button
                      onClick={() => setActiveTab("bulletin")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "bulletin"
                          ? `${uiStyles.tabActive} ${uiStyles.accentText}`
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Newspaper className="w-3.5 h-3.5" />
                      Bulletin
                    </button>
                    <button
                      onClick={() => setActiveTab("chatbot")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "chatbot"
                          ? `${uiStyles.tabActive} ${uiStyles.accentText}`
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Interactive Concierge
                    </button>
                  </div>
                </div>

                {isAiFallback && (
                  <div className="bg-amber-500/5 border-b border-amber-200/20 px-4 py-2 flex items-center justify-between gap-3 text-[10px] text-amber-800 font-mono animate-in fade-in" id="ai-fallback-indicator-banner">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      <span className="font-bold truncate">SMART FALLBACK PREDICTIVE MODE ACTIVE</span>
                    </div>
                    <span className="bg-amber-100 border border-amber-200/50 px-1.5 py-0.5 rounded text-[8px] shrink-0 font-extrabold text-amber-900 leading-none">
                      HIGH DEMAND ACTIVE
                    </span>
                  </div>
                )}

                {/* Tab content 1: AI Insights and Activity advisor */}
                {activeTab === "insights" && (
                  <div className="p-6 flex flex-col gap-6" id="ai-insights-pane">
                    
                    {isAiLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                        <Sparkles className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-sm font-semibold text-slate-600">Analyzing local environmental advice...</span>
                      </div>
                    ) : aiInsights ? (
                      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                        
                        {/* Summary Block */}
                        <div className="p-4 bg-indigo-50/60 border border-indigo-150/40 rounded-2xl">
                          <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase font-mono block mb-1">
                            Atmospheric Summary Feel
                          </span>
                          <p className="text-sm font-medium text-indigo-900 leading-relaxed italic">
                            "{aiInsights.brief}"
                          </p>
                        </div>

                        {/* Clothes recommendations */}
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono block mb-3 flex items-center gap-1.5">
                            <Shirt className="w-4 h-4 text-indigo-500" /> Recommended Wear
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {aiInsights.clothing.map((cloth, idx) => (
                              <span 
                                key={idx}
                                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 inline-block"
                              >
                                {cloth}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Activity index tracker cards */}
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono block mb-3 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-indigo-500" /> Activity Advisory Score
                          </span>
                          <div className="grid grid-cols-1 gap-3">
                            {aiInsights.activities.map((act, idx) => {
                              const isRed = act.status.toLowerCase() === "not recommended" || act.rating < 40;
                              const isGreen = act.status.toLowerCase() === "ideal" || act.rating >= 75;
                              return (
                                <div 
                                  key={idx}
                                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/55 flex items-start gap-3 hover:bg-slate-50/80 transition-all"
                                >
                                  <div className="text-right">
                                    <div className={`text-sm font-extrabold w-10 h-10 rounded-xl flex items-center justify-center border font-mono ${
                                      isGreen ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                      isRed ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                      'bg-amber-50 border-amber-200 text-amber-700'
                                    }`}>
                                      {act.rating}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-extrabold text-slate-800 block truncate">{act.name}</span>
                                      <span className={`text-[9px] font-bold tracking-wider uppercase font-mono px-1.5 rounded ${
                                        isGreen ? 'bg-emerald-100/80 text-emerald-800' :
                                        isRed ? 'bg-rose-100/80 text-rose-800' :
                                        'bg-amber-100/80 text-amber-800'
                                      }`}>
                                        {act.status}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{act.tip}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Health & Hydration tip */}
                        <div className="pt-4 border-t border-slate-100 flex gap-3">
                          <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                            <Heart className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block uppercase tracking-wide">Health & Exposure Advisory</span>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{aiInsights.healthAdvice}</p>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Configure key API credentials to fetch premium targeted meteorological lifestyle intelligence.
                      </div>
                    )}

                  </div>
                )}

                {/* Tab content 2: AI Bulletin Feed (Localized environmental headlines) */}
                {activeTab === "bulletin" && (
                  <div className="p-5 flex flex-col gap-4" id="ai-bulletin-pane">
                    
                    {isAiLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                        <Newspaper className="w-8 h-8 text-indigo-500 animate-spin" />
                        <span className="text-sm font-semibold text-slate-600">Drafting current localized reports...</span>
                      </div>
                    ) : aiNews.length > 0 ? (
                      <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                        <div className="text-xs text-slate-400 font-bold tracking-wider mb-1 font-mono uppercase">
                          Local Meteorological Bulletin
                        </div>
                        {aiNews.map((article) => (
                          <div 
                            key={article.id} 
                            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all"
                          >
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wide font-mono px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100/50 text-indigo-700">
                                {article.tag}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {article.readTime}
                              </span>
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer leading-snug">
                              {article.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                              {article.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        No current bulletins generated. Please select a dynamic city range.
                      </div>
                    )}

                  </div>
                )}

                {/* Tab content 3: Interactive Companion Chatbot */}
                {activeTab === "chatbot" && (
                  <div className="flex flex-col h-[480px]" id="ai-chat-pane">
                    
                    {/* Instructions banner */}
                    <div className="p-3 bg-emerald-500/5 border-b border-emerald-500/10 flex items-center gap-2 text-[11px] text-emerald-800">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ask about local micro-climates, temperature history, physics or packing!</span>
                    </div>

                    {/* Messages flow panel */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                      {chatMessages.map((msg) => {
                        const isUser = msg.role === "user";
                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                          >
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isUser 
                                ? `${uiStyles.accentButton} rounded-tr-none shadow-sm` 
                                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
                            }`}>
                              {/* Simple paragraph/bold parser helper */}
                              <div className="space-y-1">
                                {msg.text.split('\n').map((para, pIdx) => (
                                  <p key={pIdx}>
                                    {para.split('**').map((chunk, cIdx) => 
                                      cIdx % 2 === 1 ? <strong key={cIdx} className="font-extrabold">{chunk}</strong> : chunk
                                    )}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">
                              {msg.timestamp}
                            </span>
                          </div>
                        );
                      })}
                      {isChatTyping && (
                        <div className="mr-auto max-w-[85%] items-start animate-pulse flex items-center gap-2 text-xs text-slate-400 bg-slate-100 p-3 rounded-2xl rounded-tl-none border border-slate-200/50">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                        </div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat input form */}
                    <form 
                      onSubmit={handleSendMessage}
                      className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2"
                      id="news-chat-input-form"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask weather-related advice here..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        id="chat-user-textbox"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatTyping}
                        className={`p-2 px-3 ${uiStyles.accentButton} disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                  </div>
                )}

              </div>

              {/* Quick Meteorologist FAQ Card */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-indigo-500/10" id="environmental-physics-panel">
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold uppercase tracking-wider font-mono mb-3">
                  <Info className="w-4 h-4" /> Microclimate Advisory
                </div>
                <h4 className="text-base font-bold text-white mb-2 leading-snug">
                  Weather physics & geographic variance
                </h4>
                <p className="text-xs text-[#a5b4fc]/80 leading-relaxed mb-4">
                  All predictive activity assessments, bulletins, and chat dialogs are synthesized on demand using Open-Meteo parameters passed dynamically to advanced meteorological engines.
                </p>
                <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 rounded-lg p-2.5 max-w-max border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Validated secure client API pipeline</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Dynamic Status Bar Footer matching prompt requirement specifications */}
      <footer className="h-10 bg-white border-t border-[#e5e7eb] text-slate-500 text-[11px] leading-loose flex items-center justify-between px-6 shrink-0 mt-8" id="app-footer-indicator">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Systems Status: Active</span>
        </div>
        <div className="font-mono text-[10px]">
          API Version 2.4.1 (Full Access Enabled)
        </div>
      </footer>

    </div>
  );
}
