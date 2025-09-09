"use client";

import React from "react";
import Link from "next/link";
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { TicketStatus } from "../types/ticket";
import { StatusTabs } from "./StatusTabs";
import { LanguageToggle } from "../ui/LanguageToggle";
import { useLanguage } from "../context/LanguageContext";

function FullWidthBanner({ title, subtitle, kind }: { title: string; subtitle: string; kind: "tickets" | "dashboard" }) {
  return (
    <div className="w-full bg-gradient-to-r from-[#00A1FF] to-[#0081cc] text-white shadow-lg">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {kind === "dashboard" ? <DashboardOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22, lg: 24 } }} /> : <AssignmentOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22, lg: 24 } }} />}
            <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight">{title}</h2>
          </div>
          <LanguageToggle />
        </div>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-90 mt-0.5 sm:mt-1 md:mt-2 font-medium leading-tight">{subtitle}</p>
      </div>
    </div>
  );
}

export function StickyTicketsHeader({ status, onChange }: { status: TicketStatus; onChange: (s: TicketStatus) => void }) {
  const { t } = useLanguage();
  
  return (
    <div className="sticky top-0 z-50">
      {/* Nav integrado */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50" style={{ boxShadow: '0px 4px 12px rgba(239, 241, 246, 0.6)' }}>
        <div className="mx-auto flex max-w-screen-xl">
          <div className="flex-1">
            <div className="relative block w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#00A1FF] bg-gradient-to-t from-blue-50 to-white">
              <div className="absolute inset-x-3 sm:inset-x-4 md:inset-x-6 lg:inset-x-8 bottom-0 h-0.5 sm:h-1 bg-[#00A1FF] rounded-t-sm"></div>
              {t("tickets")}
            </div>
          </div>
          <div className="flex-1">
            <Link href="/dashboard" className="relative block w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-600 hover:text-[#00A1FF] hover:bg-gray-50/50 transition-all duration-300">
              {t("dashboard")}
            </Link>
          </div>
        </div>
      </nav>
      <FullWidthBanner
        kind="tickets"
        title={t("tickets")}
        subtitle={t("tickets.subtitle")}
      />
      <StatusTabs value={status} onChange={onChange} />
    </div>
  );
}

export function StickyDashboardHeader() {
  const { t } = useLanguage();
  
  return (
    <div className="sticky top-0 z-50">
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50" style={{ boxShadow: '0px 4px 12px rgba(239, 241, 246, 0.6)' }}>
        <div className="mx-auto flex max-w-screen-xl">
          <div className="flex-1">
            <Link href="/tickets" className="relative block w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-600 hover:text-[#00A1FF] hover:bg-gray-50/50 transition-all duration-300">
              {t("tickets")}
            </Link>
          </div>
          <div className="flex-1">
            <div className="relative block w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#00A1FF] bg-gradient-to-t from-blue-50 to-white">
              <div className="absolute inset-x-3 sm:inset-x-4 md:inset-x-6 lg:inset-x-8 bottom-0 h-0.5 sm:h-1 bg-[#00A1FF] rounded-t-sm"></div>
              {t("dashboard")}
            </div>
          </div>
        </div>
      </nav>
      <FullWidthBanner
        kind="dashboard"
        title={t("dashboard")}
        subtitle={t("dashboard.subtitle")}
      />
    </div>
  );
}