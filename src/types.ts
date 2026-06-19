export interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  timezone?: string;
}

export interface CurrentWeather {
  temp: number;
  apparentTemp: number;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  conditionText: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  rainSum: number;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  weatherCode: number;
  rainChance: number;
}

export interface DailyForecast {
  date: string;
  weekday: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  rainSum: number;
}

export interface AIInsights {
  brief: string;
  clothing: string[];
  activities: {
    name: string;
    rating: number;
    status: string; // "Ideal" | "Feasible" | "Not Recommended"
    tip: string;
  }[];
  healthAdvice: string;
}

export interface AINewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  readTime: string;
  tag: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}
