"use client";

import React, { useState } from "react";
import { TicketStatus } from "./types/ticket";
import { StickyTicketsHeader } from "./layout/StickyHeaders";
import { TicketList } from "./ticket/TicketList";
import { LanguageProvider } from "./context/LanguageContext";

export default function TicketsApp({ apiBase = "/_api", defaultStatus = "NEW" }: { apiBase?: string; defaultStatus?: TicketStatus }) {
  const [status, setStatus] = useState<TicketStatus>(defaultStatus);
  
  return (
    <LanguageProvider>
      <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <StickyTicketsHeader status={status} onChange={setStatus} />
        <main className="py-2 sm:py-3 md:py-4 lg:py-6">
          <TicketList apiBase={apiBase} status={status} />
        </main>
      </div>
    </LanguageProvider>
  );
}

// Export también el dashboard para mantener compatibilidad
export { TicketsDashboard } from "./dashboard/Dashboard";