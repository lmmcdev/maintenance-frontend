"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

type PriorityChartProps = {
  priorities: Record<string, number>;
};

export function PriorityChart({ priorities }: PriorityChartProps) {
  const { t } = useLanguage();
  const total = priorities.LOW + priorities.MEDIUM + priorities.HIGH + priorities.URGENT || 1;

  return (
    <section className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-5 md:p-6" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
      <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1">{t("priority.distribution")}</h2>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">{t("priority.breakdown")}</p>
      <div className="space-y-3 sm:space-y-4">
        {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
          const pct = Math.round(((priorities[p] || 0) / total) * 100);
          const colors = { URGENT: "#DC2626", HIGH: "#EA580C", MEDIUM: "#F59E0B", LOW: "#10B981" };
          return (
            <div key={p} className="group">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                <span className="text-gray-700">{t(`priority.${p.toLowerCase()}`)}</span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-gray-900">{priorities[p] || 0}</span>
                  <span className="text-xs text-gray-500">({pct}%)</span>
                </div>
              </div>
              <div className="h-2 sm:h-3 w-full rounded-full bg-gray-200/80 overflow-hidden">
                <div 
                  className="h-2 sm:h-3 rounded-full transition-all duration-500 ease-out group-hover:opacity-80" 
                  style={{ 
                    width: `${pct}%`, 
                    backgroundColor: colors[p],
                    boxShadow: `0 2px 4px ${colors[p]}20`
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}