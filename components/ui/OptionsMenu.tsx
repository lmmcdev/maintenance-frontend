"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CancelIcon from '@mui/icons-material/Cancel';

export function OptionsMenu() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCancelledClick = () => {
    setIsOpen(false);
    router.push("/tickets/cancelled");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl hover:bg-white/20 transition-all duration-300 text-white"
        aria-label={t("more.options")}
      >
        <MoreVertIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg sm:rounded-xl shadow-2xl border border-gray-200/60 py-2 min-w-[160px] sm:min-w-[180px] z-[70]">
          <button
            onClick={handleCancelledClick}
            className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 sm:gap-3"
          >
            <CancelIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "#6b7280" }} />
            <div>
              <div className="font-semibold text-gray-700">{t("status.cancelled")}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t("view.cancelled.tickets")}</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}