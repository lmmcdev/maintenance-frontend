// lib/api/tickets.ts
// Punto único para llamadas HTTP relacionadas a Tickets/Categorías/Personas

// ===== Tipos compartidos =====
export type TicketStatus = "NEW" | "OPEN" | "DONE";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type PersonRole = "SUPERVISOR" | "TECHNICIAN";

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  email?: string;
  role?: PersonRole;
};

export type SubCategory = {
  name: string;
  displayName: string;
  isActive: boolean;
};

export type Category = {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  subcategories: SubCategory[];
};

export type Attachment = {
  id: string;
  filename: string;
  contentType: string;
  size?: number;
  url?: string;
  uploadedAt?: string;
};

export type Ticket = {
  id: string;
  title: string;
  phoneNumber: string;
  description: string;

  audio: Attachment | null;

  status: TicketStatus;
  priority: TicketPriority;
  category: Category | null;
  subcategory?: SubCategory | null;
  assigneeId?: string | null;
  assignee?: Person | null;
  resolvedAt?: string | null;
  closedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

export type ApiListResponse<T> = {
  success: boolean;
  data: { items: T[]; continuationToken?: string };
};

export type ApiItemResponse<T> = {
  success: boolean;
  data: T;
};

// ===== Helper HTTP genérico =====
async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText} ${text ? `- ${text}` : ""}`
    );
  }
  return res.json() as Promise<T>;
}

// ===== Config base =====
export type ApiClientOptions = {
  apiBase?: string; // por defecto "/_api"
};

function withBase(base: string | undefined, path: string) {
  const root = base ?? "/_api";
  return `${root}${path}`;
}

// ===== Tickets =====
export type ListTicketsParams = {
  status?: TicketStatus;
  limit?: number;
  continuationToken?: string;
  sortBy?: "createdAt" | "updatedAt" | "priority" | "status";
  sortDir?: "asc" | "desc";
};

export async function listTickets(
  opts: ApiClientOptions,
  params: ListTicketsParams
): Promise<ApiListResponse<Ticket>> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.continuationToken)
    qs.set("continuationToken", params.continuationToken);
  if (params.sortBy) qs.set("sortBy", params.sortBy);
  if (params.sortDir) qs.set("sortDir", params.sortDir);

  const url = withBase(opts.apiBase, `/api/v1/tickets?${qs.toString()}`);
  return fetchJson<ApiListResponse<Ticket>>(url, { cache: "no-store" });
}

export async function patchTicket(
  opts: ApiClientOptions,
  id: string,
  body: Partial<{
    assigneeId: string;
    priority: TicketPriority;
    category: string;
    subcategory: { name: string; displayName: string } | string | null;
  }>
): Promise<ApiItemResponse<Ticket>> {
  const url = withBase(opts.apiBase, `/api/v1/tickets/${id}`);
  return fetchJson<ApiItemResponse<Ticket>>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function patchTicketStatus(
  opts: ApiClientOptions,
  id: string,
  status: Extract<TicketStatus, "IN_PROGRESS" | "DONE">
): Promise<ApiItemResponse<Ticket>> {
  const url = withBase(opts.apiBase, `/api/v1/tickets/${id}/status`);
  return fetchJson<ApiItemResponse<Ticket>>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

// ===== Personas =====
export async function searchPersons(
  opts: ApiClientOptions,
  q: string,
  limit = 10
): Promise<Person[]> {
  const qs = new URLSearchParams({ q, limit: String(limit) });
  const url = withBase(opts.apiBase, `/api/v1/persons?${qs.toString()}`);
  const json = await fetchJson<{ data?: { items?: Person[] } }>(url);
  return json?.data?.items ?? [];
}

// ===== Categorías =====
export type UICategory = {
  name: string;
  displayName: string;
  subcats: { name: string; displayName: string }[];
};

export async function listCategories(
  opts: ApiClientOptions,
  limit = 200
): Promise<UICategory[]> {
  const url = withBase(opts.apiBase, `/api/v1/categories?limit=${limit}`);
  const json = await fetchJson<any>(url);
  const items: any[] = json?.data?.items ?? json?.items ?? [];

  // normalización UI-friendly
  const active = (items || []).filter((c: any) => c?.isActive !== false);
  return active.map((c: any) => {
    const name = c?.id ?? c?.name ?? "";
    const displayName = c?.displayName ?? name;
    const subcats = (c?.subcategories ?? [])
      .filter((s: any) => s?.isActive !== false)
      .map((s: any) => ({
        name: s?.name ?? "",
        displayName: s?.displayName ?? s?.name ?? "",
      }));
    return { name, displayName, subcats } as UICategory;
  });
}
