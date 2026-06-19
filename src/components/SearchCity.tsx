import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, Navigation, Compass } from "lucide-react";
import { CitySuggestion } from "../types";

interface SearchCityProps {
  onSelectCity: (city: CitySuggestion) => void;
  isLoading: boolean;
}

export default function SearchCity({ onSelectCity, isLoading }: SearchCityProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick preset locations for premium user experience
  const presets: CitySuggestion[] = [
    { name: "New York", country: "United States", state: "New York", latitude: 40.7128, longitude: -74.006, country_code: "US" },
    { name: "Tokyo", country: "Japan", latitude: 35.6895, longitude: 139.6917, country_code: "JP" },
    { name: "London", country: "United Kingdom", state: "England", latitude: 51.5074, longitude: -0.1278, country_code: "GB" },
    { name: "Paris", country: "France", state: "Île-de-France", latitude: 48.8566, longitude: 2.3522, country_code: "FR" },
    { name: "Sydney", country: "Australia", state: "New South Wales", latitude: -33.8688, longitude: 151.2093, country_code: "AU" },
  ];

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setErrorStatus(null);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            query.trim()
          )}&count=6&language=en`
        );
        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          const formattedSuggestions = data.results.map((item: any) => ({
            name: item.name,
            country: item.country,
            state: item.admin1,
            latitude: item.latitude,
            longitude: item.longitude,
            country_code: item.country_code,
            timezone: item.timezone,
          }));
          setSuggestions(formattedSuggestions);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Geocoding API failed:", err);
        setErrorStatus("Failed to find cities.");
      } finally {
        setIsSearching(false);
      }
    }, 450); // 450ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Request user's device geolocation coordinate
  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser range.");
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode to get a readable address/city label
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const data = await revRes.json();
          
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Current Location";
          const countryName = data.address?.country || "Earth";
          const stateName = data.address?.state;

          const gpsCity: CitySuggestion = {
            name: cityName,
            country: countryName,
            state: stateName,
            latitude,
            longitude,
            country_code: data.address?.country_code?.toUpperCase(),
          };
          
          onSelectCity(gpsCity);
          setQuery("");
          setShowDropdown(false);
        } catch (err) {
          console.error("Reverse geocoding failed, falling back to basic GPS:", err);
          onSelectCity({
            name: "My Coordinates",
            country: `LAT: ${latitude.toFixed(2)}, LON: ${longitude.toFixed(2)}`,
            latitude,
            longitude,
          });
        } finally {
          setIsSearching(false);
        }
      },
      (error) => {
        setIsSearching(false);
        console.error("GPS error callback:", error);
        alert("GPS permissions declined or unavailable. Please type your city instead.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectSuggestion = (city: CitySuggestion) => {
    onSelectCity(city);
    setQuery("");
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto z-50 px-2" id="search-bar-container">
      <div className="relative flex items-center bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-lg shadow-black/30 group transition-all duration-300 focus-within:border-emerald-500/50 focus-within:shadow-emerald-500/10 focus-within:shadow-md">
        
        {/* Search icon */}
        <div className="pl-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors">
          {isLoading || isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>

        {/* Query Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          placeholder="Search location (e.g. Kyoto, Mumbai, San Francisco)..."
          className="w-full h-13 pl-3 pr-10 text-white placeholder-slate-400 text-sm focus:outline-none bg-transparent"
          id="location-search-input"
        />

        {/* Clean Pin and GPS */}
        <button
          onClick={handleGPSLocation}
          title="Use GPS current location"
          className="mr-3 p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80 transition-all cursor-pointer"
          id="btn-gps-locator"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Auto suggestions dropdown list */}
      {showDropdown && (suggestions.length > 0 || errorStatus) && (
        <div 
          ref={dropdownRef}
          className="absolute left-2 right-2 mt-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-xl shadow-black/80 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200"
          id="search-suggestions-dropdown"
        >
          {errorStatus ? (
            <div className="p-4 text-sm text-red-400" id="suggestion-error">{errorStatus}</div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {suggestions.map((city, idx) => (
                <li key={`${city.latitude}-${city.longitude}-${idx}`}>
                  <button
                    onClick={() => handleSelectSuggestion(city)}
                    className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-slate-800/80 hover:text-white text-slate-200 transition-colors cursor-pointer group"
                  >
                    <MapPin className="w-4 h-4 text-emerald-500 group-hover:scale-125 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block truncate">
                        {city.name}
                      </span>
                      <span className="text-xs text-slate-400 block truncate">
                        {city.state ? `${city.state}, ` : ""}{city.country}
                      </span>
                    </div>
                    {city.country_code && (
                      <span className="text-[10px] font-mono select-none px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                        {city.country_code}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Preset popular city chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4" id="presets-container">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Navigation className="w-3 h-3 text-emerald-500" /> Quick exploration:
        </span>
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => onSelectCity(p)}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-900/40 text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all cursor-pointer shadow-sm"
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
