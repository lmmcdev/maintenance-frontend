"use client";

import React from "react";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type StyledSelectProps = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
  ariaLabel?: string;
};

export function StyledSelect({
  value,
  onChange,
  disabled,
  options,
  placeholder = "Select...",
  ariaLabel
}: StyledSelectProps) {
  return (
    <div className="relative w-full">
      <select
        aria-label={ariaLabel}
        className={clsx(
          "appearance-none w-full rounded-lg sm:rounded-xl border-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium outline-none transition-all duration-300 bg-white",
          "hover:border-[#00A1FF]/30 focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10",
          "shadow-sm hover:shadow-md focus:shadow-lg",
          disabled ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400" : "border-gray-300 text-gray-700"
        )}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          backgroundImage: 'none'
        }}
      >
        <option value="" className="text-gray-500">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} className="text-gray-700 py-2 hover:bg-blue-50">{o.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={disabled ? "text-gray-300" : "text-gray-500"}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}