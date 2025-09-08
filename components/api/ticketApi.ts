import { Ticket, Person } from "../types/ticket";

export async function patchTicket(
  apiBase: string,
  id: string,
  body: Partial<{
    assigneeId: string;
    priority: Ticket["priority"];
    category: string;
    subcategory: { name: string; displayName: string };
  }>
) {
  const res = await fetch(`${apiBase}/api/v1/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Update failed: HTTP ${res.status}`);
  return res.json();
}

export async function patchStatus(apiBase: string, id: string, status: "OPEN" | "DONE") {
  const res = await fetch(`${apiBase}/api/v1/tickets/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Status change failed: HTTP ${res.status}`);
  return res.json();
}

export async function cancelTicket(apiBase: string, id: string) {
  const res = await fetch(`${apiBase}/api/v1/tickets/${id}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    // fallback: si tu backend no tiene cancel, lo marcamos DONE como placeholder
    await patchStatus(apiBase, id, "DONE");
  }
  return true;
}

export async function searchPersons(apiBase: string, q: string): Promise<Person[]> {
  const url = `${apiBase}/api/v1/persons?q=${encodeURIComponent(q)}&limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`People search failed: HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.items ?? [];
}