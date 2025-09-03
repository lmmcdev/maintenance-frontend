"use client";
import TicketsApp from "@/components/TicketsMobile";
export default function TicketsPage() {
  return <TicketsApp apiBase={process.env.NEXT_PUBLIC_API_BASE || "http://localhost:7071"} />;
}
