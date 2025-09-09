"use client";

import React from "react";
import Link from "next/link";
import { LanguageProvider } from "@/components/context/LanguageContext";
import { StaticDataProvider } from "@/components/context/StaticDataContext";
import { TicketList } from "@/components/ticket/TicketList";
import { useLanguage } from "@/components/context/LanguageContext";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelIcon from '@mui/icons-material/Cancel';

function CancelledTicketsContent({ apiBase }: { apiBase?: string }) {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Header */}
      <div className="sticky top-0 z-50">
        <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50" style={{ boxShadow: '0px 4px 12px rgba(239, 241, 246, 0.6)' }}>
          <div className="mx-auto max-w-screen-xl px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
            <Link 
              href="/tickets"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#00A1FF] transition-colors"
            >
              <ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
              <span className="text-sm sm:text-base font-medium">{t("tickets")}</span>
            </Link>
          </div>
        </nav>
        
        {/* Cancelled Tickets Banner */}
        <div className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg">
          <div className="max-w-screen-xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <CancelIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
              <div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight">
                  {t("status.cancelled")}
                </h2>
                <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                  View all cancelled tickets
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tickets List */}
      <main className="py-2 sm:py-3 md:py-4 lg:py-6">
        <TicketList apiBase={apiBase || "/_api"} status="CANCELLED" />
      </main>
    </div>
  );
}

export default function CancelledTicketsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  
  return (
    <LanguageProvider>
      <StaticDataProvider apiBase={apiBase}>
        <CancelledTicketsContent apiBase={apiBase} />
      </StaticDataProvider>
    </LanguageProvider>
  );
}