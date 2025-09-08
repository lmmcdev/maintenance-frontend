"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-0.5 sm:p-1 text-white">
      <button
        onClick={() => setLanguage("en")}
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg transition-all duration-300 text-xs sm:text-sm font-medium ${
          language === "en" 
            ? "bg-white text-[#00A1FF] shadow-sm" 
            : "hover:bg-white/10 text-white/80"
        }`}
      >
        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full overflow-hidden border border-white/30 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <defs>
              <clipPath id="us-circle">
                <circle cx="12" cy="12" r="12"/>
              </clipPath>
            </defs>
            <circle cx="12" cy="12" r="12" fill="#B22234"/>
            <g clipPath="url(#us-circle)">
              <path fill="#FFFFFF" d="M0 2h24v2H0zm0 4h24v2H0zm0 4h24v2H0zm0 4h24v2H0zm0 4h24v2H0zm0 4h24v2H0z"/>
              <rect fill="#3C3B6E" width="12" height="13"/>
              <g fill="#FFF">
                <circle cx="2" cy="2" r="0.5"/>
                <circle cx="4" cy="2" r="0.5"/>
                <circle cx="6" cy="2" r="0.5"/>
                <circle cx="8" cy="2" r="0.5"/>
                <circle cx="3" cy="4" r="0.5"/>
                <circle cx="5" cy="4" r="0.5"/>
                <circle cx="7" cy="4" r="0.5"/>
                <circle cx="2" cy="6" r="0.5"/>
                <circle cx="4" cy="6" r="0.5"/>
                <circle cx="6" cy="6" r="0.5"/>
                <circle cx="8" cy="6" r="0.5"/>
              </g>
            </g>
          </svg>
        </div>
        <span className="font-bold hidden xs:inline sm:inline">EN</span>
        <span className="font-bold xs:hidden sm:hidden text-[10px]">EN</span>
      </button>
      
      <button
        onClick={() => setLanguage("es")}
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md sm:rounded-lg transition-all duration-300 text-xs sm:text-sm font-medium ${
          language === "es" 
            ? "bg-white text-[#00A1FF] shadow-sm" 
            : "hover:bg-white/10 text-white/80"
        }`}
      >
        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full overflow-hidden border border-white/30 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <defs>
              <clipPath id="es-circle">
                <circle cx="12" cy="12" r="12"/>
              </clipPath>
            </defs>
            <circle cx="12" cy="12" r="12" fill="#AA151B"/>
            <g clipPath="url(#es-circle)">
              <rect x="0" y="6" width="24" height="12" fill="#F1BF00"/>
              <g transform="translate(12, 12)">
                <rect x="-2" y="-2" width="4" height="4" fill="#AA151B" rx="0.5"/>
                <rect x="-1.5" y="-1.5" width="3" height="3" fill="#F1BF00" rx="0.3"/>
              </g>
            </g>
          </svg>
        </div>
        <span className="font-bold hidden xs:inline sm:inline">ES</span>
        <span className="font-bold xs:hidden sm:hidden text-[10px]">ES</span>
      </button>
    </div>
  );
}