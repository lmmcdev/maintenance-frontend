"use client";

import React from "react";
import { TicketStatus } from "../types/ticket";
import { useTickets } from "../hooks/useTickets";
import { TicketCard } from "./TicketCardSimple";
import { useLanguage } from "../context/LanguageContext";

type TicketListProps = {
  apiBase: string;
  status: TicketStatus;
  token?: string;
};

export function TicketList({ apiBase, status, token }: TicketListProps) {
  const { items, loading, error, reload } = useTickets(apiBase, status, token);
  const { t } = useLanguage();

  if (loading)
    return (
      <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#00A1FF] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm sm:text-base text-gray-600 font-medium">
            {t("loading.tickets")}
          </span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-4 sm:p-6 md:p-8 text-center">
        <div className="inline-flex items-center gap-1 sm:gap-2 text-red-600 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-red-200">
          <span className="text-red-500">⚠️</span>
          <span className="font-medium text-sm sm:text-base">
            {t("error")}: {error}
          </span>
        </div>
      </div>
    );

  if (!items.length)
    return (
      <div className="p-6 sm:p-8 md:p-12 text-center">
        <div className="text-gray-400 mb-3 sm:mb-4">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-600 font-medium text-sm sm:text-base">
          {t("no.tickets.found")}
        </p>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          {t("no.tickets.moment", { status: status.toLowerCase() })}
        </p>
      </div>
    );

  return (
    <ul className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 max-w-screen-xl mx-auto">
      {items.map((t) => (
        <li key={t.id}>
          <TicketCard t={t} apiBase={apiBase} token={token} onChanged={reload} />
        </li>
      ))}
    </ul>
  );
}
