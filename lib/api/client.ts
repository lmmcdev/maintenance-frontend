// lib/api/client.ts
export type TicketStatus = "NEW" | "OPEN" | "DONE";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};

export type Ticket = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  phoneNumber: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  subcategory?: string | null | { name: string; displayName: string };
  assigneeId?: string | null;
  assignee?: Person | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
};

export type ApiListResponse<T> = {
  success: boolean;
  data: { items: T[]; continuationToken?: string };
};
export type ApiItemResponse<T> = { success: boolean; data: T };

export type ApiClientOptions = { apiBase?: string };

function withBase(base: string | undefined, path: string) {
  return `${base}${path}`;
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText}${txt ? ` - ${txt}` : ""}`
    );
  }
  return res.json() as Promise<T>;
}

/* ---------- Tickets ---------- */

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
  status: Extract<TicketStatus, "OPEN" | "DONE">
): Promise<ApiItemResponse<Ticket>> {
  const url = withBase(opts.apiBase, `/api/v1/tickets/${id}/status`);
  return fetchJson<ApiItemResponse<Ticket>>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

/* ---------- Personas ---------- */

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

export async function searchPersonsByDepartment(
  opts: ApiClientOptions,
  department: string,
  limit = 50
): Promise<Person[]> {
  const qs = new URLSearchParams({ department, limit: String(limit) });
  const url = withBase(opts.apiBase, `/api/v1/persons?${qs.toString()}`);
  const json = await fetchJson<{ data?: { items?: Person[] } }>(url);
  return json?.data?.items ?? [];
}

/* ---------- Categorías ---------- */

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
