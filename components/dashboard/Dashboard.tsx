"use client";

import React, { useState } from "react";
import { useDashboardData, DashboardFilters as DashboardFiltersType } from "../hooks/useDashboardData";
import { StickyDashboardHeader } from "../layout/StickyHeaders";
import { StatBoxes } from "./StatBoxes";
import { PriorityChart } from "./PriorityChart";
import { CategoryChart } from "./CategoryChart";
import { AssigneeChart } from "./AssigneeChart";
import { StaticDataProvider } from "../context/StaticDataContext";
import { DateFilters } from "../ticket/DateFilters";
import { DashboardFilters } from "./DashboardFilters";
import { FilteredTicketsList } from "./FilteredTicketsList";

export function TicketsDashboard({ apiBase = "/_api", token }: { apiBase?: string; token?: string }) {
  const [createdFrom, setCreatedFrom] = useState<Date | undefined>();
  const [createdTo, setCreatedTo] = useState<Date | undefined>();
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [subcategoryDisplayName, setSubcategoryDisplayName] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();

  const filters: DashboardFiltersType = {
    createdFrom,
    createdTo,
    assigneeId,
    subcategoryDisplayName,
    priority,
  };

  const { allTickets, counts, priorities, loading } = useDashboardData(apiBase, token, filters);

  const handleClearDateFilters = () => {
    setCreatedFrom(undefined);
    setCreatedTo(undefined);
  };

  const handleClearAdditionalFilters = () => {
    setAssigneeId(undefined);
    setSubcategoryDisplayName(undefined);
    setPriority(undefined);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setSubcategoryDisplayName(subcategory);
    // Scroll to filters
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAssigneeClick = (id: string) => {
    setAssigneeId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePriorityClick = (priorityValue: string) => {
    setPriority(priorityValue);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if there are any active filters
  const hasActiveFilters = Boolean(
    createdFrom || createdTo || assigneeId || subcategoryDisplayName || priority
  );

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
          <DateFilters
            createdFrom={createdFrom}
            createdTo={createdTo}
            onDateFromChange={setCreatedFrom}
            onDateToChange={setCreatedTo}
            onClear={handleClearDateFilters}
          />
          <DashboardFilters
            apiBase={apiBase}
            token={token}
            assigneeId={assigneeId}
            subcategoryDisplayName={subcategoryDisplayName}
            onAssigneeChange={setAssigneeId}
            onSubcategoryChange={setSubcategoryDisplayName}
            onClear={handleClearAdditionalFilters}
          />
          <StatBoxes counts={counts} />
          <CategoryChart tickets={allTickets} onSubcategoryClick={handleSubcategoryClick} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 md:gap-6">
            <PriorityChart priorities={priorities} onPriorityClick={handlePriorityClick} />
            <AssigneeChart tickets={allTickets} onAssigneeClick={handleAssigneeClick} />
          </div>
          <FilteredTicketsList tickets={allTickets} hasActiveFilters={hasActiveFilters} />
        </div>
      )}
    </div>
    </StaticDataProvider>
  );
}