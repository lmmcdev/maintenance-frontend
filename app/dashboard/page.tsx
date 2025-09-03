"use client";
import { TicketsDashboard } from "@/components/TicketsMobile";
export default function DashboardPage() {
  return <TicketsDashboard apiBase={process.env.NEXT_PUBLIC_API_BASE || "http://localhost:7071"} />;
}
