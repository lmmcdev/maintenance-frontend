"use client";

import React, { useState, useEffect } from "react";
import { TicketStatus } from "./types/ticket";
import { StickyTicketsHeader } from "./layout/StickyHeaders";
import { TicketList } from "./ticket/TicketList";
import { DateFilters } from "./ticket/DateFilters";
import { StaticDataProvider } from "./context/StaticDataContext";
import { useApiTokens } from "@/lib/hooks/useApiTokens";
import { TicketFilters } from "./hooks/useTickets";

export default function TicketsApp({ apiBase = "/_api", defaultStatus = "NEW" }: { apiBase?: string; defaultStatus?: TicketStatus }) {
  const [status, setStatus] = useState<TicketStatus>(defaultStatus);
  const { getMaintenanceToken, isLoading } = useApiTokens();
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Build filters object
  const filters: TicketFilters = {
    status,
    createdFrom: dateFrom,
    createdTo: dateTo,
  };

  const handleClearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  useEffect(() => {
    const initializeToken = async () => {
      try {
        console.log('🚀 Initializing TicketsApp token...');
        const newToken = await getMaintenanceToken();
        setToken(newToken);
        setIsInitialized(true);
        console.log('✅ TicketsApp token initialized:', newToken ? 'Available' : 'Not available');
      } catch (error) {
        console.error('❌ Failed to initialize token:', error);
        setIsInitialized(true); // Still allow the app to load
      }
    };

    initializeToken();
  }, [getMaintenanceToken]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00A1FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <StaticDataProvider apiBase={apiBase} token={token || undefined}>
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <StickyTicketsHeader status={status} onChange={setStatus} />
        <main className="py-2 sm:py-3 md:py-4 lg:py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <DateFilters
              createdFrom={dateFrom}
              createdTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onClear={handleClearDateFilters}
            />
            <TicketList apiBase={apiBase} filters={filters} token={token || undefined} />
          </div>
        </main>
      </div>
    </StaticDataProvider>
  );
}

// Export también el dashboard para mantener compatibilidad
export { TicketsDashboard } from "./dashboard/Dashboard";