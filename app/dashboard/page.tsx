"use client";
import { TicketsDashboard } from "@/components/TicketsMobile";
import { useApiTokens } from "@/lib/hooks/useApiTokens";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const { getMaintenanceToken } = useApiTokens();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getMaintenanceToken().then(setToken);
  }, [getMaintenanceToken]);

  return <TicketsDashboard apiBase={process.env.NEXT_PUBLIC_API_BASE} token={token || undefined} />;
}
