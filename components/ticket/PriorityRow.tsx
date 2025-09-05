"use client";

import React from "react";
import { Ticket } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type PriorityRowProps = {
  value: Ticket["priority"];
  onChange: (p: Ticket["priority"]) => void;
  busy: boolean;
};

export function PriorityRow({
  value,
  onChange,
  busy
}: PriorityRowProps) {
  const { t } = useLanguage();
  
  // Correct traffic light system: Red -> Orange -> Yellow -> Green
  const items: { key: Ticket["priority"]; label: string; color: string }[] = [
    { key: "URGENT", label: t("priority.urgent"), color: "#DC2626" }, // Red
    { key: "HIGH",   label: t("priority.high"),   color: "#EA580C" }, // Orange
    { key: "MEDIUM", label: t("priority.medium"), color: "#F59E0B" }, // Yellow
    { key: "LOW",    label: t("priority.low"),    color: "#10B981" }, // Green
  ];
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-gray-600 text-xs sm:text-sm min-w-[48px] sm:min-w-[64px] font-semibold">{t("priority")}</span>
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        {items.map(it => {
          const active = value === it.key;
          return (
            <button
              key={it.key}
              disabled={busy}
              onClick={() => onChange(it.key)}
              className={clsx(
                "px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border transition-all duration-300 shadow-sm hover:shadow-md",
                active ? "text-white transform scale-105" : "text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200"
              )}
              style={{ borderColor: active ? it.color : "#E5E7EB", backgroundColor: active ? it.color : undefined }}
            >
              <span className="hidden xs:inline sm:inline">{it.label}</span>
              <span className="xs:hidden sm:hidden">{it.label.slice(0, 1)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}