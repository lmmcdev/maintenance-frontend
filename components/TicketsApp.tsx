"use client";

import React, { useState, useEffect } from "react";
import { TicketStatus } from "./types/ticket";
import { StickyTicketsHeader } from "./layout/StickyHeaders";
import { TicketList } from "./ticket/TicketList";
import { StaticDataProvider } from "./context/StaticDataContext";
import { useApiTokens } from "@/lib/hooks/useApiTokens";

export default function TicketsApp({ apiBase = "/_api", defaultStatus = "NEW" }: { apiBase?: string; defaultStatus?: TicketStatus }) {
  const [status, setStatus] = useState<TicketStatus>(defaultStatus);
  const { getMaintenanceToken } = useApiTokens();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getMaintenanceToken().then(setToken);
  }, [getMaintenanceToken]);
  
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