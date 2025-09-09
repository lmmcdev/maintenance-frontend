"use client";
import TicketsApp from "@/components/TicketsMobile";

export default function DoneTicketsPage() {
  return <TicketsApp apiBase={process.env.NEXT_PUBLIC_API_BASE} defaultStatus="DONE" />;
}