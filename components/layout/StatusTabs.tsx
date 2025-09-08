"use client";

import React from "react";
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { TicketStatus } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const STATUSES: TicketStatus[] = ["NEW", "OPEN", "DONE"];

type StatusTabsProps = {
  value: TicketStatus;
  onChange: (s: TicketStatus) => void;
};

export function StatusTabs({ value, onChange }: StatusTabsProps) {
  const { t } = useLanguage();
  
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-1 sm:px-3 md:px-4 lg:px-6">
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
          {STATUSES.map((s) => {
            const active = value === s;
            return (
              <button
                key={s}
                onClick={() => onChange(s)}
                className={clsx(
                  "relative px-1 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base lg:text-lg font-bold transition-all duration-300",
                  "flex items-center justify-center",
                  active ? "text-[#00A1FF] bg-white border-b-2 sm:border-b-3 border-[#00A1FF]" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                <span className="inline-flex items-center gap-1 sm:gap-1.5 md:gap-2">
                  {s === "NEW" && <NewReleasesIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18, lg: 20 } }} />}
                  {s === "OPEN" && <FlashOnIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18, lg: 20 } }} />}
                  {s === "DONE" && <CheckCircleIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18, lg: 20 } }} />}
                  <span className="font-extrabold tracking-wide">{t(`status.${s.toLowerCase()}`)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}