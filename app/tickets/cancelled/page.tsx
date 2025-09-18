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
        <TicketList apiBase={apiBase || "/_api"} filters={{ status: "CANCELLED" }} token={token} />
      </main>
    </div>
  );
}

export default function CancelledTicketsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const { getMaintenanceToken, isLoading } = useApiTokens();
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        console.log('🚀 Initializing Cancelled Tickets token...');
        const newToken = await getMaintenanceToken();
        setToken(newToken);
        setIsInitialized(true);
        console.log('✅ Cancelled Tickets token initialized:', newToken ? 'Available' : 'Not available');
      } catch (error) {
        console.error('❌ Failed to initialize cancelled tickets token:', error);
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
          <p className="text-gray-600 font-medium">Inicializando tickets cancelados...</p>
        </div>
      </div>
    );
  }

  return (
    <StaticDataProvider apiBase={apiBase} token={token || undefined}>
      <CancelledTicketsContent apiBase={apiBase} token={token || undefined} />
    </StaticDataProvider>
  );
}