"use client";

// Main exports - using refactored components
export { default } from "./TicketsApp";
export { TicketsDashboard } from "./dashboard/Dashboard";

// Re-export types for backwards compatibility
export type { TicketStatus, Ticket, Person } from "./types/ticket";