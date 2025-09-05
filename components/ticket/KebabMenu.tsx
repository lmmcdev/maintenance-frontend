"use client";

import React, { useState, useRef, useEffect } from "react";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { TicketStatus } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";

type KebabMenuProps = {
  state: TicketStatus;
  onMarkDone: () => void;
  onReopen: () => void;
  onCancel: () => void;
  disabled?: boolean;
};

export function KebabMenu({
  state,
  onMarkDone,
  onReopen,
  onCancel,
  disabled
}: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-0.5 sm:p-1 hover:bg-gray-100 rounded"
        onClick={() => setOpen(v=>!v)}
        aria-label={t("ticket.actions")}
        title={t("actions")}
      >
        {/* vertical dots */}
        <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="#333" />
          <circle cx="12" cy="12" r="2" fill="#333" />
          <circle cx="12" cy="19" r="2" fill="#333" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-6 sm:top-8 z-20 min-w-[180px] sm:min-w-[200px] bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl py-2">
          {state !== "DONE" ? (
            <>
              <button
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-green-50 hover:text-green-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3"
                onClick={() => { setOpen(false); onMarkDone(); }}
                disabled={disabled}
              >
                <CheckCircleIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: "#10B981" }} />
                <div>
                  <div className="font-semibold">{t("mark.completed")}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">{t("close.ticket")}</div>
                </div>
              </button>
              <div className="mx-2 my-1 h-px bg-gray-200"></div>
              <button
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-red-50 hover:text-red-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3"
                onClick={() => { setOpen(false); onCancel(); }}
                disabled={disabled}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <div className="font-semibold">{t("cancel.ticket.action")}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">{t("archive.without.completion")}</div>
                </div>
              </button>
            </>
          ) : (
            <button
              className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3"
              onClick={() => { setOpen(false); onReopen(); }}
              disabled={disabled}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <div className="font-semibold">{t("reopen.ticket")}</div>
                <div className="text-xs text-gray-500 hidden sm:block">{t("set.status.open")}</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}