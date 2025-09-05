"use client";

import React from "react";
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useLanguage } from "../context/LanguageContext";

type StatBoxesProps = {
  counts: {
    NEW: number;
    OPEN: number;
    DONE: number;
  };
};

export function StatBoxes({ counts }: StatBoxesProps) {
  const { t } = useLanguage();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
      {/* New Tickets */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-50 via-white to-pink-50/30 p-3 sm:p-4 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
        <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r from-pink-400 to-pink-600"></div>
        <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-pink-100/20 rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
            <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl sm:rounded-2xl shadow-lg">
              <NewReleasesIcon sx={{ fontSize: { xs: 20, sm: 28, md: 32, lg: 36 }, color: "#FF6692" }} />
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm text-pink-600 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">{t("new.tickets")}</div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-pink-700">{counts.NEW}</div>
            </div>
          </div>
          <div className="text-xs text-pink-600/70 font-medium">{t("ready.assignment")}</div>
        </div>
      </div>

      {/* Open Tickets */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50/30 p-3 sm:p-4 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
        <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r from-amber-400 to-amber-600"></div>
        <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-amber-100/20 rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
            <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl sm:rounded-2xl shadow-lg">
              <FlashOnIcon sx={{ fontSize: { xs: 20, sm: 28, md: 32, lg: 36 }, color: "#FFB900" }} />
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm text-amber-600 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">{t("open.tickets")}</div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-700">{counts.OPEN}</div>
            </div>
          </div>
          <div className="text-xs text-amber-600/70 font-medium">{t("in.progress")}</div>
        </div>
      </div>

      {/* Done Tickets */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-50 via-white to-teal-50/30 p-3 sm:p-4 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
        <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r from-teal-400 to-teal-600"></div>
        <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-teal-100/20 rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
            <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl sm:rounded-2xl shadow-lg">
              <CheckCircleIcon sx={{ fontSize: { xs: 20, sm: 28, md: 32, lg: 36 }, color: "#00B8A3" }} />
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm text-teal-600 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">{t("done.tickets")}</div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-teal-700">{counts.DONE}</div>
            </div>
          </div>
          <div className="text-xs text-teal-600/70 font-medium">{t("completed")}</div>
        </div>
      </div>
    </div>
  );
}