import React from "react";
import { 
  Wind, 
  Droplets, 
  Sunrise, 
  Sunset, 
  Sun, 
  Eye, 
  Gauge, 
  Compass, 
  ArrowUp, 
  ArrowDown 
} from "lucide-react";
import { CurrentWeather } from "../types";
import { cToF } from "../utils/weatherUtils";

interface MetricBentoGridProps {
  weather: CurrentWeather;
  tempUnit?: "C" | "F";
  uiStyles?: {
    bgApp: string;
    accentBg: string;
    accentText: string;
    accentButton: string;
    accentNavIconBg: string;
    accentNavIcon: string;
    accentBadge: string;
    brandText: string;
    brandHighlight: string;
    indicatorDot: string;
    tabActive: string;
    heading: string;
  };
}

export default function MetricBentoGrid({ weather, tempUnit = "C", uiStyles }: MetricBentoGridProps) {
  const { 
    humidity, 
    windSpeed, 
    pressure, 
    uvIndex, 
    visibility, 
    sunrise, 
    sunset, 
    apparentTemp 
  } = weather;

  // Retrieve wind description based on standard wind speed limits
  const getWindDescription = (speed: number) => {
    if (speed < 5) return "Calm breeze";
    if (speed < 12) return "Gentle breeze";
    if (speed < 20) return "Moderate windflow";
    if (speed < 38) return "Fresh breeze";
    return "Strong gale warning";
  };

  // Retrieve humidity comfort level description
  const getHumidityDescription = (hum: number) => {
    if (hum < 30) return "Dry & crisp air";
    if (hum <= 60) return "Optimal dry comfort";
    if (hum <= 80) return "Sticky moisture";
    return "Heavy tropical atmosphere";
  };

  // Retrieve UV danger levels
  const getUVStatus = (uv: number) => {
    if (uv <= 2) return { text: "Low (Safe)", color: "text-emerald-800 bg-emerald-100 border-emerald-300" };
    if (uv <= 5) return { text: "Moderate Harm", color: "text-amber-800 bg-amber-100 border-amber-300" };
    if (uv <= 7) return { text: "High Hazard", color: "text-orange-850 bg-orange-100 border-orange-300" };
    if (uv <= 10) return { text: "Very High Risk", color: "text-red-850 bg-red-100 border-red-300" };
    return { text: "Extreme Radiation", color: "text-purple-850 bg-purple-100 border-purple-300" };
  };

  const uvDetails = getUVStatus(uvIndex);

  // Retrieve visibility range descriptions
  const getVisibilityDescription = (visKm: number) => {
    if (visKm >= 10) return "Perfect clear sight";
    if (visKm >= 5) return "Mild environmental haze";
    if (visKm >= 2) return "Moderate fog cover";
    return "Severe dense smog";
  };

  // Simple sunrise/sunset time formatter
  const formatSunTime = (isoStr: string) => {
    if (!isoStr) return "-:--";
    try {
      const date = new Date(isoStr);
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: true 
      });
    } catch {
      return isoStr.substring(11, 16);
    }
  };

  // Custom styling for card container based on interactive active theme context
  const cardClassName = uiStyles?.accentBg 
    ? `border p-5 rounded-2xl shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1 flex flex-col justify-between group h-full ${uiStyles.accentBg}`
    : "bg-white border border-[#e5e7eb] shadow-sm rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group h-full";

  const brandTextClass = uiStyles?.brandText ? uiStyles.brandText : "text-indigo-600";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" id="metric-bento-grid">
      
      {/* 1. Apparent Feel Heat index */}
      <div className={cardClassName} id="card-feel">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-extrabold font-mono text-slate-800">REALFEEL THERMAL</span>
          <div className="p-1.5 rounded-lg bg-orange-100/80 border border-orange-300 text-orange-600">
            <Sun className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <div className="my-3">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {tempUnit === "F" ? cToF(apparentTemp) : Math.round(apparentTemp)}°{tempUnit}
          </div>
        </div>
        <div className="text-xs text-slate-700 font-bold leading-relaxed">
          Feels {apparentTemp > weather.temp ? "warmer" : "colder"} than current air temperature.
        </div>
      </div>

      {/* 2. Wind Index */}
      <div className={cardClassName} id="card-wind">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-extrabold font-mono text-slate-800">WINDFLOW STRENGTH</span>
          <div className="p-1.5 rounded-lg bg-cyan-100/80 border border-cyan-300 text-cyan-600">
            <Wind className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          </div>
        </div>
        <div className="my-3 font-mono">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{windSpeed} <span className="text-xs font-semibold text-slate-500">km/h</span></div>
        </div>
        <div className={`text-xs ${brandTextClass} font-extrabold flex items-center gap-1.5`}>
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping shrink-0"></span>
          {getWindDescription(windSpeed)}
        </div>
      </div>

      {/* 3. Humidity Moisture Card */}
      <div className={cardClassName} id="card-humidity">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-extrabold font-mono text-slate-800">HUMIDITY INDEX</span>
          <div className="p-1.5 rounded-lg bg-sky-100/80 border border-sky-300 text-sky-600">
            <Droplets className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
        </div>
        <div className="my-3 font-mono">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{humidity}%</div>
        </div>
        <div className="text-xs text-slate-700 font-semibold">
          {getHumidityDescription(humidity)}
        </div>
      </div>

      {/* 4. UV Card */}
      <div className={cardClassName} id="card-uv-index">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-extrabold font-mono text-slate-800">UV RADIATION LEVEL</span>
          <div className="p-1.5 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-600">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3 font-mono">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{uvIndex}</div>
        </div>
        <div className={`text-[10px] font-extrabold tracking-wider font-mono px-2.5 py-1 rounded inline-block max-w-max border ${uvDetails.color}`}>
          {uvDetails.text}
        </div>
      </div>

      {/* 5. Visibility Card */}
      <div className={cardClassName} id="card-visibility">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-extrabold font-mono text-slate-800">SIGHT VISIBILITY</span>
          <div className="p-1.5 rounded-lg bg-indigo-100/80 border border-indigo-300 text-indigo-600">
            <Eye className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <div className="my-3 font-mono">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{Math.round(visibility)} <span className="text-xs font-semibold text-slate-500">km</span></div>
        </div>
        <div className="text-xs text-slate-700 font-semibold">
          {getVisibilityDescription(visibility)}
        </div>
      </div>

      {/* 6. Pressure Card */}
      <div className={cardClassName} id="card-pressure">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-extrabold font-mono text-slate-800">BAROMETRIC PRESSURE</span>
          <div className="p-1.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-600">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="my-3 font-mono">
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{Math.round(pressure)} <span className="text-xs font-semibold text-slate-500">hPa</span></div>
        </div>
        <div className="text-xs text-slate-700 font-semibold">
          {pressure > 1013 ? "High pressure ridge active" : "Low pressure system warning"}
        </div>
      </div>

      {/* 7. Full-span Solar Cycle Details Info */}
      <div className={`${uiStyles?.accentBg ? `border p-5 rounded-2xl shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1 col-span-2 lg:col-span-3 ${uiStyles.accentBg}` : "col-span-2 lg:col-span-3 bg-white border border-[#e5e7eb] shadow-sm rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1"}`} id="card-solar">
        <div className="text-xs uppercase tracking-wider font-extrabold font-mono text-slate-800 mb-4">SOLAR DAYLIGHT CYCLE DETECTOR</div>
        <div className="grid grid-cols-2 gap-8 text-center sm:text-left">
          
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl border border-amber-300 text-amber-700">
              <Sunrise className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-extrabold font-mono uppercase">SUNRISE TIME</div>
              <div className="text-lg font-bold text-slate-800 font-mono mt-0.5">{formatSunTime(sunrise)}</div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl border border-indigo-300 text-indigo-700">
              <Sunset className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-extrabold font-mono uppercase">SUNSET TIME</div>
              <div className="text-lg font-bold text-slate-800 font-mono mt-0.5">{formatSunTime(sunset)}</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
