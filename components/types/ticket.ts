export type TicketStatus = "NEW" | "OPEN" | "DONE";

export type Ticket = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  phoneNumber: string;
  description: string;
  status: TicketStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  subcategory?: string | { name: string; displayName: string } | null;
  assigneeId?: string | null;
  assignee?: Person | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  audioUrl?: string | null;
};

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};

export type ListResponse = {
  success: boolean;
  data: { items: Ticket[] };
};

export type UICategory = {
  name: string;
  displayName: string;
  subcats: { name: string; displayName: string }[];
};