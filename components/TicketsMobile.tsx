"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Types
export type TicketStatus = "NEW" | "IN_PROGRESS" | "DONE";

type Ticket = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  phoneNumber: string;
  description: string;
  status: TicketStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  subcategory?: string | null;
  assigneeId?: string | null;
  assignee?: Person | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
};

type ListResponse = {
  success: boolean;
  data: { items: Ticket[] };
};

// Helpers
function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}
function truncate(txt: string, max = 120) {
  return txt && txt.length > max ? txt.slice(0, max - 1) + "…" : txt;
}

// API actions
async function patchTicket(
  apiBase: string,
  id: string,
  body: Partial<{
    assigneeId: string;
    priority: Ticket["priority"];
    category: string;
    subcategory: {
      name: string;
      displayName: string;
    };
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

async function patchStatus(
  apiBase: string,
  id: string,
  status: "IN_PROGRESS" | "DONE"
) {
  const res = await fetch(`${apiBase}/api/v1/tickets/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Status change failed: HTTP ${res.status}`);
  return res.json();
}

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};
async function searchPersons(apiBase: string, q: string): Promise<Person[]> {
  const url = `${apiBase}/api/v1/persons?q=${encodeURIComponent(q)}&limit=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`People search failed: HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.items ?? [];
}

// Hook
function useTickets(apiBase: string, status: TicketStatus) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useMemo(() => {
    return async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${apiBase}/api/v1/tickets?status=${encodeURIComponent(
          status
        )}&limit=20&sortBy=createdAt&sortDir=desc`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ListResponse = await res.json();
        if (!json.success) throw new Error("API returned success=false");
        setItems(json.data.items || []);
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
  }, [apiBase, status]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}

// ---- Categories hook ----
type UICategory = {
  name: string;
  displayName: string;
  subcats: { name: string; displayName: string }[];
};
function normalizeCats(arr: any[]): UICategory[] {
  const active = (arr || []).filter((c: any) => c?.isActive !== false);
  return active.map((c: any) => {
    // API shape: { id, displayName, isActive, subcategories: [{ name, displayName, isActive, order }] }
    const name = c?.id ?? c?.name ?? "";
    const displayName = c?.displayName ?? name;
    const rawSubs: any[] = c?.subcategories ?? [];
    const subcats = rawSubs
      .filter((s: any) => s?.isActive !== false)
      .map((s: any) => ({
        name: s?.name ?? "",
        displayName: s?.displayName ?? s?.name ?? "",
      }));
    return { name, displayName, subcats } as UICategory;
  });
}

function useCategories(apiBase: string) {
  const [cats, setCats] = useState<UICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/api/v1/categories?limit=200`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = json?.data?.items ?? json?.items ?? [];
        const norm = normalizeCats(items);
        if (!abort) setCats(norm);
      } catch (e: any) {
        if (!abort) setError(e?.message || "Categories error");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [apiBase]);
  return { cats, loading, error };
}

// Components
function StatusBadge({ status }: { status: TicketStatus }) {
  const color = useMemo(() => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-amber-100 text-amber-800";
      case "DONE":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }, [status]);
  return (
    <span
      className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", color)}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function TicketCard({
  t,
  apiBase,
  onChanged,
}: {
  t: Ticket;
  apiBase: string;
  onChanged?: () => void;
}) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [query, setQuery] = useState("");

  async function doStatus(next: "IN_PROGRESS" | "DONE") {
    try {
      setBusy("status");
      await patchStatus(apiBase, t.id, next);
      onChanged?.();
    } catch (e) {
      alert((e as any)?.message ?? "Error changing status");
    } finally {
      setBusy(null);
    }
  }

  async function runSearch(q: string) {
    try {
      const items = await searchPersons(apiBase, q);
      setPersons(items);
    } catch (e) {
      alert((e as any)?.message ?? "Error searching persons");
    }
  }

  async function assignTo(personId: string) {
    try {
      setBusy("assign");
      await patchTicket(apiBase, t.id, { assigneeId: personId });
      await patchStatus(apiBase, t.id, "IN_PROGRESS");
      setAssignOpen(false);
      onChanged?.();
    } catch (e) {
      alert((e as any)?.message ?? "Error assigning ticket");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-tight line-clamp-2">
          {t.title}
        </h3>
        <StatusBadge status={t.status} />
      </header>
      <div className="mt-2 text-sm text-gray-600 line-clamp-3">
        {truncate(t.description, 160)}
      </div>

      {(t.assignee || t.assigneeId) && (
        <div className="mt-2 text-xs text-gray-700">
          Assigned to:{" "}
          <span className="font-medium">
            {t.assignee
              ? `${t.assignee.firstName} ${t.assignee.lastName}`
              : t.assigneeId}
          </span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setAssignOpen(true)}
          className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700"
          disabled={!!busy}
        >
          Assign
        </button>
        {t.status !== "IN_PROGRESS" && (
          <button
            onClick={() => doStatus("IN_PROGRESS")}
            className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-medium text-white"
            disabled={!!busy}
          >
            Mark In Progress
          </button>
        )}
        {t.status !== "DONE" && (
          <button
            onClick={() => doStatus("DONE")}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
            disabled={!!busy}
          >
            Mark Done
          </button>
        )}
      </div>

      {/* Priority & Category controls */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {/* Priority */}
        <label className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 min-w-[64px]">Priority</span>
          <select
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs"
            defaultValue={t.priority}
            disabled={!!busy}
            onChange={async (e) => {
              try {
                setBusy("priority");
                await patchTicket(apiBase, t.id, {
                  priority: e.target.value as Ticket["priority"],
                });
                onChanged?.();
              } catch (err: any) {
                alert(err?.message ?? "Error updating priority");
              } finally {
                setBusy(null);
              }
            }}
          >
            {(["LOW", "MEDIUM", "HIGH", "URGENT"] as Ticket["priority"][]).map(
              (p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              )
            )}
          </select>
        </label>

        {/* Category */}
        <CategorySelector
          t={t}
          apiBase={apiBase}
          onChanged={onChanged}
          busy={!!busy}
        />
      </div>

      {assignOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/30"
          onClick={() => setAssignOpen(false)}
        >
          <div
            className="rounded-t-2xl bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Assign to person</h4>
              <button
                className="text-xs text-gray-500"
                onClick={() => setAssignOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
                placeholder="Search by name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") runSearch(query);
                }}
              />
              <button
                onClick={() => runSearch(query)}
                className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white"
              >
                Search
              </button>
            </div>
            <ul className="mt-3 max-h-64 overflow-auto divide-y divide-gray-200">
              {persons.map((p) => (
                <li key={p.id} className="py-2">
                  <button
                    onClick={() => assignTo(p.id)}
                    className="w-full text-left"
                  >
                    <div className="text-sm font-medium">
                      {p.firstName} {p.lastName}
                    </div>
                    <div className="text-xs text-gray-600">{p.email}</div>
                  </button>
                </li>
              ))}
              {!persons.length && (
                <li className="py-6 text-center text-xs text-gray-500">
                  No results
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </article>
  );
}

// Ticket list
function TicketList({
  apiBase,
  status,
}: {
  apiBase: string;
  status: TicketStatus;
}) {
  const { items, loading, error, reload } = useTickets(apiBase, status);

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!items.length) return <div className="p-4 text-gray-600">No tickets</div>;

  return (
    <ul className="p-3 space-y-3">
      {items.map((t) => (
        <li key={t.id}>
          <TicketCard t={t} apiBase={apiBase} onChanged={reload} />
        </li>
      ))}
    </ul>
  );
}

// Tabs
const STATUSES: TicketStatus[] = ["NEW", "IN_PROGRESS", "DONE"];
function Tabs({
  value,
  onChange,
}: {
  value: TicketStatus;
  onChange: (s: TicketStatus) => void;
}) {
  return (
    <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
      <ul className="flex">
        {STATUSES.map((s) => (
          <li key={s} className="flex-1">
            <button
              className={clsx(
                "w-full px-4 py-3 text-sm font-medium",
                value === s
                  ? "text-emerald-700 border-b-2 border-emerald-600"
                  : "text-gray-600"
              )}
              onClick={() => onChange(s)}
            >
              {s.replace("_", " ")}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Category selector component
function CategorySelector({
  t,
  apiBase,
  onChanged,
  busy,
}: {
  t: Ticket;
  apiBase: string;
  onChanged?: () => void;
  busy: boolean;
}) {
  const { cats } = useCategories(apiBase);
  const [cat, setCat] = useState<string>(t.category);
  const selected = useMemo(
    () => cats.find((c) => c.name === cat) || null,
    [cats, cat]
  );

  useEffect(() => {
    setCat(t.category);
  }, [t.category]);

  return (
    <div className="sm:col-span-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500 min-w-[64px]">Category</span>
        <select
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs"
          value={cat}
          disabled={busy}
          onChange={async (e) => {
            const next = e.target.value;
            try {
              await patchTicket(apiBase, t.id, {
                category: next,
                subcategory:
                  typeof t.subcategory === "object" && t.subcategory !== null
                    ? {
                        name: (t.subcategory as any).name ?? "",
                        displayName: (t.subcategory as any).displayName ?? "",
                      }
                    : {
                        name:
                          typeof t.subcategory === "string"
                            ? t.subcategory
                            : "",
                        displayName:
                          typeof t.subcategory === "string"
                            ? t.subcategory
                            : "",
                      },
              });
              setCat(next);
              onChanged?.();
            } catch (err: any) {
              alert(err?.message ?? "Error updating category");
            }
          }}
        >
          {[...cats].map((c) => (
            <option key={c.name} value={c.name}>
              {c.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-gray-500 min-w-[64px]">Subcat</span>
        <select
          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs"
          value={t.subcategory ?? ""}
          disabled={busy || !(selected && selected.subcats.length)}
          onChange={async (e) => {
            const next = e.target.value || "";
            try {
              await patchTicket(apiBase, t.id, {
                subcategory: { name: next, displayName: next },
              });
              onChanged?.();
            } catch (err: any) {
              alert(err?.message ?? "Error updating subcategory");
            }
          }}
        >
          <option value="">-- none --</option>
          {(selected?.subcats ?? []).map((sc) => (
            <option key={sc.name} value={sc.name}>
              {sc.displayName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Dashboard
export function TicketsDashboard({
  apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "",
}: {
  apiBase?: string;
}) {
  const { items: newItems, loading: l1 } = useTickets(apiBase, "NEW");
  const { items: progItems, loading: l2 } = useTickets(apiBase, "IN_PROGRESS");
  const { items: doneItems, loading: l3 } = useTickets(apiBase, "DONE");
  const loading = l1 || l2 || l3;

  const counts = useMemo(
    () => ({
      NEW: newItems.length,
      IN_PROGRESS: progItems.length,
      DONE: doneItems.length,
    }),
    [newItems.length, progItems.length, doneItems.length]
  );

  const priorities = useMemo(() => {
    const all = [...newItems, ...progItems, ...doneItems];
    const acc = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 } as Record<
      Ticket["priority"],
      number
    >;
    all.forEach((t) => (acc[t.priority] = (acc[t.priority] || 0) + 1));
    return acc;
  }, [newItems, progItems, doneItems]);

  const total =
    priorities.LOW + priorities.MEDIUM + priorities.HIGH + priorities.URGENT ||
    1;

  return (
    <div className="mx-auto max-w-screen-sm min-h-dvh bg-gray-50">
      <header className="px-4 py-4">
        <h1 className="text-xl font-bold">Tickets Dashboard</h1>
        <p className="text-xs text-gray-600">Resumen básico</p>
      </header>
      {loading ? (
        <div className="p-4 animate-pulse space-y-3">
          <div className="h-24 rounded-2xl bg-gray-200" />
          <div className="h-24 rounded-2xl bg-gray-200" />
          <div className="h-40 rounded-2xl bg-gray-200" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">New</div>
              <div className="mt-1 text-2xl font-bold">{counts.NEW}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">In Progress</div>
              <div className="mt-1 text-2xl font-bold">
                {counts.IN_PROGRESS}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Done</div>
              <div className="mt-1 text-2xl font-bold">{counts.DONE}</div>
            </div>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold">Priority</h2>
            <div className="mt-3 space-y-3">
              {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
                const pct = Math.round(((priorities[p] || 0) / total) * 100);
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{p}</span>
                      <span>{priorities[p] || 0}</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="px-1 text-sm font-semibold text-gray-800">
              Últimos NEW
            </h2>
            <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
              {newItems.slice(0, 5).map((t) => (
                <li key={t.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                        {truncate(t.description, 120)}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div className="mt-1 text-[11px] text-gray-500">
                    {fmtDate(t.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

// App
export default function TicketsApp({
  apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "",
}: {
  apiBase?: string;
}) {
  const [status, setStatus] = useState<TicketStatus>("NEW");
  return (
    <div className="mx-auto max-w-screen-sm min-h-dvh bg-gray-50">
      <header className="px-4 py-4">
        <h1 className="text-xl font-bold">Maintenance Tickets</h1>
      </header>
      <Tabs value={status} onChange={setStatus} />
      <main>
        <TicketList apiBase={apiBase} status={status} />
      </main>
    </div>
  );
}
