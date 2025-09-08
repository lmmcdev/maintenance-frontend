"use client";

import React, { useMemo } from "react";
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { TicketStatus } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type StatusBadgeProps = {
  status: TicketStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage();
  
  const statusConfig = useMemo(() => {
    switch (status) {
      case "NEW":
        return { color: "bg-gradient-to-r from-pink-50 to-pink-100/50 text-pink-600 border border-pink-200/60", label: t("status.new"), icon: NewReleasesIcon };
      case "OPEN":
        return { color: "bg-gradient-to-r from-yellow-50 to-yellow-100/50 text-yellow-600 border border-yellow-200/60", label: t("status.open"), icon: FlashOnIcon };
      case "DONE":
        return { color: "bg-gradient-to-r from-teal-50 to-teal-100/50 text-teal-600 border border-teal-200/60", label: t("status.done"), icon: CheckCircleIcon };
      default:
        return { color: "bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-600 border border-gray-200/60", label: (status as string).replace("_", " "), icon: null };
    }
  }, [status, t]);
  
  const IconComponent = statusConfig.icon;
  
  return (
    <span className={clsx("inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold tracking-wide shadow-md hover:shadow-lg transition-all duration-300", statusConfig.color)}>
      {IconComponent && <IconComponent sx={{ fontSize: { xs: 12, sm: 14, md: 16 } }} />}
      <span className="hidden xs:inline sm:inline">{statusConfig.label}</span>
      <span className="xs:hidden sm:hidden">{statusConfig.label.slice(0, 3)}</span>
    </span>
  );
}