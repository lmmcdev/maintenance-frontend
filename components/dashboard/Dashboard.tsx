"use client";

import React from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { StickyDashboardHeader } from "../layout/StickyHeaders";
import { StatBoxes } from "./StatBoxes";
import { PriorityChart } from "./PriorityChart";
import { CategoryChart } from "./CategoryChart";
import { AssigneeChart } from "./AssigneeChart";
import { StaticDataProvider } from "../context/StaticDataContext";

export function TicketsDashboard({ apiBase = "/_api", token }: { apiBase?: string; token?: string }) {
  const { allTickets, counts, priorities, loading } = useDashboardData(apiBase, token);

  return (
    <StaticDataProvider apiBase={apiBase} token={token}>
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
          <CategoryChart tickets={allTickets} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 md:gap-6">
            <PriorityChart priorities={priorities} />
            <AssigneeChart tickets={allTickets} />
          </div>
        </div>
      )}
    </div>
    </StaticDataProvider>
  );
}