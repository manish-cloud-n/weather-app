import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning,
  LucideIcon
} from "lucide-react";

export interface WeatherCondition {
  text: string;
  icon: LucideIcon;
  gradientClass: string; // Gradient style for premium backgrounds
  themeColor: string; // Tailwinds primary colors
  accentColor: string;
}

export function getWeatherCondition(code: number): WeatherCondition {
  // Clear Sky
  if (code === 0) {
    return {
      text: "Clear Sky",
      icon: Sun,
      gradientClass: "from-amber-400 via-orange-500 to-sky-600",
      themeColor: "amber-500",
      accentColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    };
  }
  
  // Mainly clear, partly cloudy, overcast
  if ([1, 2, 3].includes(code)) {
    return {
      text: code === 1 ? "Mainly Clear" : code === 2 ? "Partly Cloudy" : "Overcast",
      icon: CloudSun,
      gradientClass: "from-blue-400 via-indigo-500 to-slate-700",
      themeColor: "indigo-400",
      accentColor: "text-blue-300 border-blue-500/30 bg-blue-500/10",
    };
  }

  // Fog & Rime Fog
  if ([45, 48].includes(code)) {
    return {
      text: "Foggy Weather",
      icon: CloudFog,
      gradientClass: "from-zinc-400 via-slate-500 to-zinc-700",
      themeColor: "zinc-400",
      accentColor: "text-zinc-300 border-zinc-500/30 bg-zinc-500/10",
    };
  }

  // Drizzle variations and freezing drizzle
  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      text: "Misty Drizzle",
      icon: CloudDrizzle,
      gradientClass: "from-teal-400 via-cyan-600 to-slate-800",
      themeColor: "cyan-500",
      accentColor: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
    };
  }

  // Rain: slight, moderate, heavy, freezing rain, showers
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      text: "Rain Showers",
      icon: CloudRain,
      gradientClass: "from-blue-500 via-slate-700 to-neutral-900",
      themeColor: "blue-500",
      accentColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    };
  }

  // Snow, grains, snow showers
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      text: "Slight Snowfall",
      icon: CloudSnow,
      gradientClass: "from-sky-300 via-sky-600 to-emerald-950",
      themeColor: "sky-300",
      accentColor: "text-sky-200 border-sky-300/30 bg-sky-300/10",
    };
  }

  // Thunderstorms & Hail
  if ([95, 96, 99].includes(code)) {
    return {
      text: "Thunderstorm",
      icon: CloudLightning,
      gradientClass: "from-purple-600 via-slate-800 to-stone-950",
      themeColor: "purple-500",
      accentColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    };
  }

  // Fallback
  return {
    text: "Moderate Weather",
    icon: Cloud,
    gradientClass: "from-slate-500 via-slate-600 to-slate-800",
    themeColor: "slate-400",
    accentColor: "text-slate-300 border-slate-500/30 bg-slate-500/10",
  };
}

// Convert temperature Celsius to Fahrenheit if needed
export function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

// Format ISO date string into a nice dynamic header string or weekday label
export function formatWeekday(isoString: string): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function formatMonthAndDay(isoString: string): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(timeStr: string): string {
  // Parses a string like "2026-06-18T23:00" and outputs e.g. "11:00 PM"
  if (!timeStr) return "-";
  try {
    const parts = timeStr.split("T");
    if (parts.length < 2) return timeStr;
    const timeOnly = parts[1];
    const [hourStr, minStr] = timeOnly.split(":");
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${minStr} ${ampm}`;
  } catch (err) {
    return timeStr;
  }
}
