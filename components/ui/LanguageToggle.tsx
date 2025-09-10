"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

interface LanguageToggleProps {
  variant?: 'navbar' | 'light';
}

export function LanguageToggle({ variant = 'navbar' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const isLight = variant === 'light';

  return (
    <div className={`relative inline-flex items-center rounded-full p-0.5 ${
      isLight 
        ? 'bg-slate-200/80 border border-slate-300/50' 
        : 'bg-white/10 backdrop-blur-sm border border-white/20'
    }`}>
      {/* Background slider */}
      <div 
        className={`absolute top-0.5 bottom-0.5 w-7 rounded-full shadow-sm transition-transform duration-300 ease-in-out ${
          language === "es" ? "translate-x-7" : "translate-x-0"
        } ${isLight ? 'bg-slate-600' : 'bg-white'}`}
      />
      
      {/* EN Button */}
      <button
        onClick={() => setLanguage("en")}
        className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300"
        title="English"
      >
        <div className="w-4 h-4 rounded-full overflow-hidden border border-white/30 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <defs>
              <clipPath id="us-circle-small">
                <circle cx="12" cy="12" r="12"/>
              </clipPath>
            </defs>
            <circle cx="12" cy="12" r="12" fill="#B22234"/>
            <g clipPath="url(#us-circle-small)">
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
      </button>
      
      {/* ES Button */}
      <button
        onClick={() => setLanguage("es")}
        className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300"
        title="Español"
      >
        <div className="w-4 h-4 rounded-full overflow-hidden border border-white/30 shadow-sm">
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <defs>
              <clipPath id="es-circle-small">
                <circle cx="12" cy="12" r="12"/>
              </clipPath>
            </defs>
            <circle cx="12" cy="12" r="12" fill="#AA151B"/>
            <g clipPath="url(#es-circle-small)">
              <rect x="0" y="6" width="24" height="12" fill="#F1BF00"/>
              <g transform="translate(12, 12)">
                <rect x="-2" y="-2" width="4" height="4" fill="#AA151B" rx="0.5"/>
                <rect x="-1.5" y="-1.5" width="3" height="3" fill="#F1BF00" rx="0.3"/>
              </g>
            </g>
          </svg>
        </div>
      </button>
    </div>
  );
}