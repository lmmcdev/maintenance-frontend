"use client";

import React, { useMemo } from "react";
import { useTickets } from "../hooks/useTickets";
import { StickyDashboardHeader } from "../layout/StickyHeaders";
import { StatBoxes } from "./StatBoxes";
import { PriorityChart } from "./PriorityChart";
import { CategoryChart } from "./CategoryChart";
import { AssigneeChart } from "./AssigneeChart";
import { LanguageProvider } from "../context/LanguageContext";
import { StaticDataProvider } from "../context/StaticDataContext";

export function TicketsDashboard({ apiBase = "/_api" }: { apiBase?: string }) {
  const { items: newItems, loading: l1 } = useTickets(apiBase, "NEW");
  const { items: progItems, loading: l2 } = useTickets(apiBase, "OPEN");
  const { items: doneItems, loading: l3 } = useTickets(apiBase, "DONE");
  const loading = l1 || l2 || l3;

  const counts = useMemo(
    () => ({ NEW: newItems.length, OPEN: progItems.length, DONE: doneItems.length }),
    [newItems.length, progItems.length, doneItems.length]
  );

  const priorities = useMemo(() => {
    const all = [...newItems, ...progItems, ...doneItems];
    const acc = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 } as Record<string, number>;
    all.forEach((t) => (acc[t.priority] = (acc[t.priority] || 0) + 1));
    return acc;
  }, [newItems, progItems, doneItems]);

  return (
    <LanguageProvider>
      <StaticDataProvider apiBase={apiBase}>
        <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 relative">
          <StickyDashboardHeader />
          {loading ? (
          <div className="p-2 sm:p-4 md:p-6 lg:p-8 animate-pulse space-y-2 sm:space-y-3 md:space-y-4 max-w-screen-xl mx-auto">
            <div className="h-16 sm:h-20 md:h-24 rounded-xl sm:rounded-2xl bg-gray-200" />
            <div className="h-16 sm:h-20 md:h-24 rounded-xl sm:rounded-2xl bg-gray-200" />
            <div className="h-24 sm:h-32 md:h-40 rounded-xl sm:rounded-2xl bg-gray-200" />
          </div>
        ) : (
          <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-5 md:space-y-6 max-w-screen-xl mx-auto">
            <StatBoxes counts={counts} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 md:gap-6">
              <PriorityChart priorities={priorities} />
              <AssigneeChart tickets={[...newItems, ...progItems, ...doneItems]} />
            </div>
            <CategoryChart tickets={[...newItems, ...progItems, ...doneItems]} />
          </div>
        )}
      </div>
      </StaticDataProvider>
    </LanguageProvider>
  );
}