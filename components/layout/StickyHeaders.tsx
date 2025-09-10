"use client";

import React from "react";
import Link from "next/link";
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { TicketStatus } from "../types/ticket";
import { StatusTabs } from "./StatusTabs";
import { OptionsMenu } from "../ui/OptionsMenu";
import { useLanguage } from "../context/LanguageContext";
import { Nav } from "../../app/(ui)/nav";

function FullWidthBanner({ title, subtitle, kind }: { title: string; subtitle: string; kind: "tickets" | "dashboard" }) {
  return (
    <div className="w-full bg-blue-50 text-[#00A1FF] shadow-md border-b border-blue-200">
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {kind === "dashboard" ? <DashboardOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22, lg: 24 } }} /> : <AssignmentOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22, lg: 24 } }} />}
            <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight">{title}</h2>
          </div>
          {kind === "tickets" && (
            <div className="flex items-center gap-2 sm:gap-3">
              <OptionsMenu />
            </div>
          )}
        </div>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-90 mt-0.5 sm:mt-1 md:mt-2 font-medium leading-tight">{subtitle}</p>
      </div>
    </div>
  );
}

export function StickyTicketsHeader({ status, onChange }: { status: TicketStatus; onChange: (s: TicketStatus) => void }) {
  const { t } = useLanguage();
  
  return (
    <div className="sticky top-0 z-40">
      <Nav />
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
    <div className="sticky top-0 z-40">
      <Nav />
      <FullWidthBanner
        kind="dashboard"
        title={t("dashboard")}
        subtitle={t("dashboard.subtitle")}
      />
    </div>
  );
}