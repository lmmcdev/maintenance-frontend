"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StaticDataProvider } from "@/components/context/StaticDataContext";
import { TicketList } from "@/components/ticket/TicketList";
import { useLanguage } from "@/components/context/LanguageContext";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';
import { Nav } from "@/app/(ui)/nav";
import { useApiTokens } from "@/lib/hooks/useApiTokens";

function CancelledTicketsContent({ apiBase, token }: { apiBase?: string; token?: string }) {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Header */}
      <div className="sticky top-0 z-40">
        <Nav />
        <nav className="bg-blue-50 text-[#00A1FF] shadow-md border-b border-blue-200">
          <div className="mx-auto max-w-screen-xl px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
            <Link 
              href="/tickets"
              className="inline-flex items-center gap-2 text-[#00A1FF] hover:text-[#0081CC] transition-colors"
            >
              <ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              <span className="text-sm sm:text-base font-medium">{t("tickets")}</span>
            </Link>
          </div>
        </nav>
      </div>
      
      {/* Tickets List */}
      <main className="py-2 sm:py-3 md:py-4 lg:py-6">
        <TicketList apiBase={apiBase || "/_api"} status="CANCELLED" token={token} />
      </main>
    </div>
  );
}

export default function CancelledTicketsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const { getMaintenanceToken } = useApiTokens();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getMaintenanceToken().then(setToken);
  }, [getMaintenanceToken]);

  return (
    <StaticDataProvider apiBase={apiBase} token={token || undefined}>
      <CancelledTicketsContent apiBase={apiBase} token={token || undefined} />
    </StaticDataProvider>
  );
}