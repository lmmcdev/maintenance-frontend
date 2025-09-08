"use client";

import React from "react";
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import { Ticket } from "../types/ticket";
import { StatusBadge } from "../ticket/StatusBadge";
import { useLanguage } from "../context/LanguageContext";

function truncate(txt: string, max = 120) {
  return txt && txt.length > max ? txt.slice(0, max - 1) + "…" : txt;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

type RecentTicketsProps = {
  tickets: Ticket[];
};

export function RecentTickets({ tickets }: RecentTicketsProps) {
  const { t: translate } = useLanguage();
  
  return (
    <section className="space-y-2 sm:space-y-3">
      <div className="flex items-center gap-1 sm:gap-2">
        <NewReleasesIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: "#FF6692" }} />
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">{translate("recent.new.tickets")}</h2>
      </div>
      <ul className="divide-y divide-gray-100 rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white overflow-hidden" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
        {tickets.slice(0, 5).map((t, index) => (
          <li key={t.id} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 hover:bg-gray-50/50 transition-colors duration-200">
            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  <p className="text-xs sm:text-sm md:text-base font-bold text-gray-900 truncate">{t.title}</p>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {truncate(t.description, 120)}
                </p>
              </div>
              <div className="flex-shrink-0">
                <StatusBadge status={t.status} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 font-medium">{fmtDate(t.createdAt)}</div>
              <div className="text-xs text-gray-400">
{translate("priority")}: <span className="font-semibold text-gray-600">{translate(`priority.${t.priority.toLowerCase()}`)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}