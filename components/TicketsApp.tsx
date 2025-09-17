"use client";

import React, { useState, useEffect } from "react";
import { TicketStatus } from "./types/ticket";
import { StickyTicketsHeader } from "./layout/StickyHeaders";
import { TicketList } from "./ticket/TicketList";
import { StaticDataProvider } from "./context/StaticDataContext";
import { useApiTokens } from "@/lib/hooks/useApiTokens";

export default function TicketsApp({ apiBase = "/_api", defaultStatus = "NEW" }: { apiBase?: string; defaultStatus?: TicketStatus }) {
  const [status, setStatus] = useState<TicketStatus>(defaultStatus);
  const { getMaintenanceToken, isLoading } = useApiTokens();
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
          <TicketList apiBase={apiBase} status={status} token={token || undefined} />
        </main>
      </div>
    </StaticDataProvider>
  );
}

// Export también el dashboard para mantener compatibilidad
export { TicketsDashboard } from "./dashboard/Dashboard";