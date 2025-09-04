"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import TicketAudio from "@/components/TicketAudio"; // <-- NUEVO: player MUI con tu estética
import CustomAudioPlayer from "@/components/CustomAudioPlayer";

export type TicketStatus = "NEW" | "OPEN" | "DONE";

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
  subcategory?: string | { name: string; displayName: string } | null;
  assigneeId?: string | null;
  assignee?: Person | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  audioUrl?: string | null; // para el reproductor
};

type ListResponse = {
  success: boolean;
  data: { items: Ticket[] };
};

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

async function patchTicket(
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

async function patchStatus(apiBase: string, id: string, status: "OPEN" | "DONE") {
  const res = await fetch(`${apiBase}/api/v1/tickets/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Status change failed: HTTP ${res.status}`);
  return res.json();
}

async function cancelTicket(apiBase: string, id: string) {
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

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
};
async function searchPersons(apiBase: string, q: string): Promise<Person[]> {
  const url = `${apiBase}/api/v1/persons?q=${encodeURIComponent(q)}&limit=50`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`People search failed: HTTP ${res.status}`);
  const json = await res.json();
  return json?.data?.items ?? [];
}

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

type UICategory = {
  name: string;
  displayName: string;
  subcats: { name: string; displayName: string }[];
};
function normalizeCats(arr: any[]): UICategory[] {
  const active = (arr || []).filter((c: any) => c?.isActive !== false);
  return active.map((c: any) => {
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

function StatusBadge({ status }: { status: TicketStatus }) {
  const statusConfig = useMemo(() => {
    switch (status) {
      case "NEW":
        return { color: "bg-gradient-to-r from-pink-50 to-pink-100/50 text-pink-600 border border-pink-200/60", label: "NEW", icon: NewReleasesIcon };
      case "OPEN":
        return { color: "bg-gradient-to-r from-yellow-50 to-yellow-100/50 text-yellow-600 border border-yellow-200/60", label: "OPEN", icon: FlashOnIcon };
      case "DONE":
        return { color: "bg-gradient-to-r from-teal-50 to-teal-100/50 text-teal-600 border border-teal-200/60", label: "DONE", icon: CheckCircleIcon };
      default:
        return { color: "bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-600 border border-gray-200/60", label: (status as string).replace("_", " "), icon: null };
    }
  }, [status]);
  const IconComponent = statusConfig.icon;
  return (
    <span className={clsx("inline-flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold tracking-wide shadow-md hover:shadow-lg transition-all duration-300", statusConfig.color)}>
      {IconComponent && <IconComponent sx={{ fontSize: { xs: 12, sm: 14, md: 16 } }} />}
      <span className="hidden xs:inline sm:inline">{statusConfig.label}</span>
      <span className="xs:hidden sm:hidden">{statusConfig.label.slice(0, 3)}</span>
    </span>
  );
}

/* ---------- BANNER FULL WIDTH STICKY ---------- */
function FullWidthBanner({ title, subtitle, kind }: { title: string; subtitle: string; kind: "tickets" | "dashboard" }) {
  return (
    <div className="w-full bg-gradient-to-r from-[#00A1FF] to-[#0081cc] text-white shadow-lg">
      <div className="max-w-screen-xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 lg:py-8">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {kind === "dashboard" ? <DashboardOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22, lg: 24 } }} /> : <AssignmentOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22, lg: 24 } }} />}
          <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight">{title}</h2>
        </div>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-90 mt-0.5 sm:mt-1 md:mt-2 font-medium leading-tight">{subtitle}</p>
      </div>
    </div>
  );
}

/* ---------- 3 DOTS MENU (vertical, sin círculo) ---------- */
function KebabMenu({
  state,
  onMarkDone,
  onReopen,
  onCancel,
  disabled
}: {
  state: TicketStatus;
  onMarkDone: () => void;
  onReopen: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-0.5 sm:p-1 hover:bg-gray-100 rounded"
        onClick={() => setOpen(v=>!v)}
        aria-label="Ticket actions"
        title="Actions"
      >
        {/* vertical dots */}
        <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="#333" />
          <circle cx="12" cy="12" r="2" fill="#333" />
          <circle cx="12" cy="19" r="2" fill="#333" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-6 sm:top-8 z-20 min-w-[180px] sm:min-w-[200px] bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl py-2">
          {state !== "DONE" ? (
            <>
              <button
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-green-50 hover:text-green-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3"
                onClick={() => { setOpen(false); onMarkDone(); }}
                disabled={disabled}
              >
                <CheckCircleIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: "#10B981" }} />
                <div>
                  <div className="font-semibold">Mark as Completed</div>
                  <div className="text-xs text-gray-500 hidden sm:block">Close this ticket</div>
                </div>
              </button>
              <div className="mx-2 my-1 h-px bg-gray-200"></div>
              <button
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-red-50 hover:text-red-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3"
                onClick={() => { setOpen(false); onCancel(); }}
                disabled={disabled}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <div className="font-semibold">Cancel Ticket</div>
                  <div className="text-xs text-gray-500 hidden sm:block">Archive without completion</div>
                </div>
              </button>
            </>
          ) : (
            <button
              className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 flex items-center gap-2 sm:gap-3"
              onClick={() => { setOpen(false); onReopen(); }}
              disabled={disabled}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <div className="font-semibold">Reopen Ticket</div>
                <div className="text-xs text-gray-500 hidden sm:block">Set status back to Open</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- PRIORITY ROW ---------- */
function PriorityRow({
  value,
  onChange,
  busy
}: {
  value: Ticket["priority"];
  onChange: (p: Ticket["priority"]) => void;
  busy: boolean;
}) {
  // Correct traffic light system: Red -> Orange -> Yellow -> Green
  const items: { key: Ticket["priority"]; label: string; color: string }[] = [
    { key: "URGENT", label: "URGENT", color: "#DC2626" }, // Red
    { key: "HIGH",   label: "HIGH",   color: "#EA580C" }, // Orange
    { key: "MEDIUM", label: "MEDIUM", color: "#F59E0B" }, // Yellow
    { key: "LOW",    label: "LOW",    color: "#10B981" }, // Green
  ];
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-gray-600 text-xs sm:text-sm min-w-[48px] sm:min-w-[64px] font-semibold">Priority:</span>
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        {items.map(it => {
          const active = value === it.key;
          return (
            <button
              key={it.key}
              disabled={busy}
              onClick={() => onChange(it.key)}
              className={clsx(
                "px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border transition-all duration-300 shadow-sm hover:shadow-md",
                active ? "text-white transform scale-105" : "text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200"
              )}
              style={{ borderColor: active ? it.color : "#E5E7EB", backgroundColor: active ? it.color : undefined }}
            >
              <span className="hidden xs:inline sm:inline">{it.label}</span>
              <span className="xs:hidden sm:hidden">{it.label.slice(0, 1)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- STYLED SELECT (chevron custom) ---------- */
function StyledSelect({
  value,
  onChange,
  disabled,
  options,
  placeholder = "Select...",
  ariaLabel
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="relative w-full">
      <select
        aria-label={ariaLabel}
        className={clsx(
          "appearance-none w-full rounded-lg sm:rounded-xl border-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium outline-none transition-all duration-300 bg-white",
          "hover:border-[#00A1FF]/30 focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10",
          "shadow-sm hover:shadow-md focus:shadow-lg",
          disabled ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400" : "border-gray-300 text-gray-700"
        )}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          backgroundImage: 'none'
        }}
      >
        <option value="" className="text-gray-500">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} className="text-gray-700 py-2 hover:bg-blue-50">{o.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={disabled ? "text-gray-300" : "text-gray-500"}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

/* ---------- Mapeo de estado API -> estado UI del player ---------- */
function mapStatusToUi(s: TicketStatus): "New" | "In Progress" | "Done" {
  switch (s) {
    case "NEW": return "New";
    case "OPEN": return "In Progress";
    case "DONE": return "Done";
  }
}

/* ---------- CARD ---------- */
function TicketCard({
  t,
  apiBase,
  onChanged,
}: {
  t: Ticket;
  apiBase: string;
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedAssigneeName, setSelectedAssigneeName] = useState("");
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{name: string, isReassign: boolean}>({name: "", isReassign: false});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState("");


  const peopleList = useMemo(() => {
    const exact = [
      "Juan Carlos Gonzalez",
      "Eugenio Suarez",
      "Elpidio Davila",
      "Roger Membreno",
      "Lino Munoz",
      "Ariel Caballero",
      "Ramon Aguilera",
      "Raul Garcia",
      "Carlos Pena",
    ];
    return [...exact].sort((a,b)=>a.localeCompare(b));
  }, []);

  useEffect(() => {
    (async () => {
      try { setPersons(await searchPersons(apiBase, "")); } catch { setPersons([]); }
    })();
  }, [apiBase]);

  async function assignByName(fullName: string) {
    try {
      setBusy("assign");
      let match = persons.find(p => `${p.firstName} ${p.lastName}`.toLowerCase() === fullName.toLowerCase());
      if (!match) {
        const res = await searchPersons(apiBase, fullName);
        match = res.find(p => `${p.firstName} ${p.lastName}`.toLowerCase() === fullName.toLowerCase()) || res[0];
      }
      if (!match?.id) { alert("Assignee not found in directory."); return; }
      await patchTicket(apiBase, t.id, { assigneeId: match.id });
      await patchStatus(apiBase, t.id, "OPEN");
      onChanged?.();
    } catch (e) {
      alert((e as any)?.message ?? "Error assigning ticket");
    } finally {
      setBusy(null);
    }
  }

  async function markDone() {
    try { setBusy("done"); await patchStatus(apiBase, t.id, "DONE"); onChanged?.(); }
    catch (e) { alert((e as any)?.message ?? "Error marking done"); }
    finally { setBusy(null); }
  }
  async function reopen() {
    try { setBusy("open"); await patchStatus(apiBase, t.id, "OPEN"); onChanged?.(); }
    catch (e) { alert((e as any)?.message ?? "Error reopening"); }
    finally { setBusy(null); }
  }
  async function cancel() {
    try { setBusy("cancel"); await cancelTicket(apiBase, t.id); onChanged?.(); }
    catch (e) { alert((e as any)?.message ?? "Error canceling"); }
    finally { setBusy(null); }
  }

  const canAssign = useMemo(() => t.category && t.priority, [t.category, t.priority]);

  return (
    <article className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg sm:shadow-2xl transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] backdrop-blur-sm" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-tight text-gray-900 order-2 sm:order-1">{t.title}</h3>
        <div className="flex items-center justify-between sm:justify-end gap-2 order-1 sm:order-2">
          <StatusBadge status={t.status} />
          <KebabMenu
            state={t.status}
            onMarkDone={markDone}
            onReopen={reopen}
            onCancel={() => setShowCancelDialog(true)}
            disabled={!!busy}
          />
        </div>
      </header>

      <div className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4 leading-relaxed">{truncate(t.description, 160)}</div>
      
      {/* Creation date */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200/60">
        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div>
          <div className="text-xs text-gray-500 font-medium">Created:</div>
          <div className="text-xs sm:text-sm text-gray-700 font-semibold">{fmtDate(t.createdAt)}</div>
        </div>
      </div>

      {/* audio player SIEMPRE visible – versión MUI con tu estética */}
      <div className="mb-4 sm:mb-5">
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
          <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
            <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
            <h4 className="font-bold text-[#00a1ff] text-sm sm:text-base">Audio</h4>
          </div>
          <CustomAudioPlayer src={t.audioUrl || null} />
        </div>
      </div>

      {(t.assignee || t.assigneeId) && (
        <div className="mb-4 sm:mb-5 p-2 sm:p-3 md:p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl border border-blue-200/60 shadow-sm">
          <div className="text-xs sm:text-sm text-blue-600 font-semibold mb-1">Assigned to:</div>
          <div className="text-xs sm:text-sm md:text-base font-bold text-blue-800">
            {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : t.assigneeId}
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-5">
        <div className="text-xs sm:text-sm md:text-base font-bold text-gray-800 pb-2 sm:pb-3">
          Ticket Configuration
        </div>

        <CategorySelector t={t} apiBase={apiBase} onChanged={onChanged} busy={!!busy} />

        <PriorityRow
          value={t.priority}
          busy={!!busy}
          onChange={async (p) => {
            try {
              setBusy("priority");
              await patchTicket(apiBase, t.id, { priority: p });
              onChanged?.();
            } catch (err: any) {
              alert(err?.message ?? "Error updating priority");
            } finally {
              setBusy(null);
            }
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-gray-600 text-xs sm:text-sm min-w-[48px] sm:min-w-[64px] font-semibold">Assign:</span>
          <div className="flex-1">
            <StyledSelect
              ariaLabel="Assign to"
              value={selectedAssigneeName}
              onChange={(name) => {
                setSelectedAssigneeName(name);
                if (!name) return;
                if (!canAssign) { alert("Complete category and priority before assigning."); return; }
                
                const isReassign: boolean = t.status === "OPEN" && (t.assignee || t.assigneeId) ? true : false;
                setPendingAssignment({name, isReassign});
                setShowAssignConfirmation(true);
              }}
              disabled={!!busy}
              placeholder={t.assignee || t.assigneeId ? "Reassign to..." : "Select assignee..."}
              options={peopleList.map(n => ({ value: n, label: n }))}
            />
          </div>
        </div>

        {!canAssign && (
          <div className="text-xs sm:text-sm text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100/50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-amber-200/60 shadow-sm">
            <span className="inline-flex items-center gap-1 sm:gap-2">
              <span className="text-amber-500">⚠️</span>
              <span className="font-medium">Complete category and priority to enable assignment</span>
            </span>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full shadow-2xl mx-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Cancel Ticket</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Please provide a reason for canceling this ticket:</p>
              <textarea
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="w-full p-2 sm:p-3 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10 outline-none transition-all duration-300 resize-none text-sm sm:text-base"
                rows={3}
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end mt-3 sm:mt-4">
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelNote("");
                  }}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (cancelNote.trim()) {
                      setShowCancelDialog(false);
                      await cancel();
                      setCancelNote("");
                    }
                  }}
                  disabled={!cancelNote.trim()}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
                >
                  Cancel Ticket
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showAssignConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full shadow-2xl mx-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                {pendingAssignment.isReassign ? "Reassign Ticket" : "Assign Ticket"}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                {pendingAssignment.isReassign 
                  ? `Are you sure you want to reassign this ticket to ${pendingAssignment.name}? The ticket will remain in Open status.`
                  : `Are you sure you want to assign this ticket to ${pendingAssignment.name}? The status will change to Open.`
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAssignConfirmation(false);
                    setSelectedAssigneeName("");
                    setPendingAssignment({name: "", isReassign: false});
                  }}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowAssignConfirmation(false);
                    await assignByName(pendingAssignment.name);
                    setPendingAssignment({name: "", isReassign: false});
                  }}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#00A1FF] text-white rounded-lg hover:bg-[#0081cc] transition-colors order-1 sm:order-2"
                >
                  {pendingAssignment.isReassign ? "Reassign" : "Assign"}
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Sin botones inferiores (Done se maneja en el menú) */}
    </article>
  );
}

/* ---------- LIST ---------- */
function TicketList({
  apiBase,
  status,
}: {
  apiBase: string;
  status: TicketStatus;
}) {
  const { items, loading, error, reload } = useTickets(apiBase, status);

  if (loading) return (
    <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#00A1FF] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm sm:text-base text-gray-600 font-medium">Loading tickets...</span>
      </div>
    </div>
  );
  if (error) return (
    <div className="p-4 sm:p-6 md:p-8 text-center">
      <div className="inline-flex items-center gap-1 sm:gap-2 text-red-600 bg-red-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-red-200">
        <span className="text-red-500">⚠️</span>
        <span className="font-medium text-sm sm:text-base">Error: {error}</span>
      </div>
    </div>
  );
  if (!items.length) return (
    <div className="p-6 sm:p-8 md:p-12 text-center">
      <div className="text-gray-400 mb-3 sm:mb-4">
        <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-gray-600 font-medium text-sm sm:text-base">No tickets found</p>
      <p className="text-gray-500 text-xs sm:text-sm mt-1">There are no {status.toLowerCase()} tickets at the moment.</p>
    </div>
  );

  return (
    <ul className="p-2 sm:p-3 md:p-4 lg:p-6 space-y-3 sm:space-y-4 md:space-y-6 max-w-screen-xl mx-auto">
      {items.map((t) => (
        <li key={t.id}>
          <TicketCard t={t} apiBase={apiBase} onChanged={reload} />
        </li>
      ))}
    </ul>
  );
}

/* ---------- TABS FULL WIDTH (más modernos, grid 3 col) ---------- */
const STATUSES: TicketStatus[] = ["NEW", "OPEN", "DONE"];
function Tabs({
  value,
  onChange,
}: {
  value: TicketStatus;
  onChange: (s: TicketStatus) => void;
}) {
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-1 sm:px-3 md:px-4 lg:px-6">
        <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
          {STATUSES.map((s) => {
            const active = value === s;
            return (
              <button
                key={s}
                onClick={() => onChange(s)}
                className={clsx(
                  "relative px-1 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base lg:text-lg font-bold transition-all duration-300",
                  "flex items-center justify-center",
                  active ? "text-[#00A1FF] bg-white border-b-2 sm:border-b-3 border-[#00A1FF]" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                <span className="inline-flex items-center gap-1 sm:gap-1.5 md:gap-2">
                  {s === "NEW" && <NewReleasesIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18, lg: 20 } }} />}
                  {s === "OPEN" && <FlashOnIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18, lg: 20 } }} />}
                  {s === "DONE" && <CheckCircleIcon sx={{ fontSize: { xs: 14, sm: 16, md: 18, lg: 20 } }} />}
                  <span className="font-extrabold tracking-wide hidden xs:inline sm:inline">{s}</span>
                  <span className="font-extrabold tracking-wide xs:hidden sm:hidden">{s.slice(0, 1)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ---------- CATEGORY SELECTOR ---------- */
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

  const allSubcategories = useMemo(() => {
    const subcats: { name: string; displayName: string }[] = [];
    cats.forEach(category => {
      category.subcats.forEach(subcat => {
        subcats.push({ name: subcat.name, displayName: subcat.displayName });
      });
    });
    return subcats;
  }, [cats]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-gray-600 text-xs sm:text-sm min-w-[48px] sm:min-w-[64px] font-semibold">Category:</span>
      <div className="flex-1">
        <StyledSelect
          ariaLabel="Category"
          value={
            typeof t.subcategory === 'object' && t.subcategory?.name 
              ? t.subcategory.name 
              : typeof t.subcategory === 'string' 
                ? t.subcategory 
                : t.category || ""
          }
          disabled={busy}
          placeholder="Select category..."
          options={allSubcategories.map(sc => ({ value: sc.name, label: sc.displayName }))}
          onChange={async (val) => {
            if (!val) return;
            try {
              // Find the subcategory object
              const subcategory = allSubcategories.find(sc => sc.name === val);
              if (subcategory) {
                await patchTicket(apiBase, t.id, { 
                  subcategory: { 
                    name: subcategory.name, 
                    displayName: subcategory.displayName 
                  } 
                });
                onChanged?.();
              }
            } catch (err: any) {
              console.error('Error updating subcategory:', err);
              alert(err?.message ?? "Error updating subcategory");
            }
          }}
        />
      </div>
    </div>
  );
}

/* ---------- STICKY DASHBOARD HEADER ---------- */
function StickyDashboardHeader() {
  return (
    <div className="sticky top-0 z-50">
      {/* Nav integrado */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50" style={{ boxShadow: '0px 4px 12px rgba(239, 241, 246, 0.6)' }}>
        <div className="mx-auto flex max-w-screen-xl">
          <div className="flex-1">
            <Link href="/tickets" className="relative block w-full px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-600 hover:text-[#00A1FF] hover:bg-gray-50/50 transition-all duration-300">
              Tickets
            </Link>
          </div>
          <div className="flex-1">
            <div className="relative block w-full px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#00A1FF] bg-gradient-to-t from-blue-50 to-white">
              <div className="absolute inset-x-2 sm:inset-x-4 md:inset-x-6 lg:inset-x-8 bottom-0 h-0.5 sm:h-1 bg-[#00A1FF] rounded-t-sm"></div>
              Dashboard
            </div>
          </div>
        </div>
      </nav>
      {/* Banner sin separación */}
      <FullWidthBanner
        kind="dashboard"
        title="Dashboard"
        subtitle="Quick overview of ticket counts and priorities."
      />
    </div>
  );
}

/* ---------- DASHBOARD ---------- */
export function TicketsDashboard({ apiBase = "/_api" }: { apiBase?: string }) {
  const { items: newItems, loading: l1 } = useTickets(apiBase, "NEW");
  const { items: progItems, loading: l2 } = useTickets(apiBase, "OPEN");
  const { items: doneItems, loading: l3 } = useTickets(apiBase, "DONE");
  const loading = l1 || l2 || l3;

  const counts = useMemo(
    () => ({ NEW: newItems.length, OPEN: progItems.length, DONE: doneItems.length }),
    [newItems.length, progItems.length, doneItems.length]
  );

  const priorities = useMemo(() => {
    const all = [...newItems, ...progItems, ...doneItems];
    const acc = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 } as Record<Ticket["priority"], number>;
    all.forEach((t) => (acc[t.priority] = (acc[t.priority] || 0) + 1));
    return acc;
  }, [newItems, progItems, doneItems]);

  const total = priorities.LOW + priorities.MEDIUM + priorities.HIGH + priorities.URGENT || 1;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <StickyDashboardHeader />
      {loading ? (
        <div className="p-2 sm:p-4 md:p-6 lg:p-8 animate-pulse space-y-2 sm:space-y-3 md:space-y-4 max-w-screen-xl mx-auto">
          <div className="h-16 sm:h-20 md:h-24 rounded-xl sm:rounded-2xl bg-gray-200" />
          <div className="h-16 sm:h-20 md:h-24 rounded-xl sm:rounded-2xl bg-gray-200" />
          <div className="h-24 sm:h-32 md:h-40 rounded-xl sm:rounded-2xl bg-gray-200" />
        </div>
      ) : (
        <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-5 md:space-y-6 max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-50 via-white to-pink-50/30 p-3 sm:p-4 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
              <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r from-pink-400 to-pink-600"></div>
              <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-pink-100/20 rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                  <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl sm:rounded-2xl shadow-lg">
                    <NewReleasesIcon sx={{ fontSize: { xs: 20, sm: 28, md: 32, lg: 36 }, color: "#FF6692" }} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm text-pink-600 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">New Tickets</div>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-black text-pink-700">{counts.NEW}</div>
                  </div>
                </div>
                <div className="text-xs text-pink-600/70 font-medium">Ready for assignment</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50/30 p-3 sm:p-4 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
              <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-amber-100/20 rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                  <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl sm:rounded-2xl shadow-lg">
                    <FlashOnIcon sx={{ fontSize: { xs: 20, sm: 28, md: 32, lg: 36 }, color: "#FFB900" }} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm text-amber-600 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Open Tickets</div>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-700">{counts.OPEN}</div>
                  </div>
                </div>
                <div className="text-xs text-amber-600/70 font-medium">In progress</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-50 via-white to-teal-50/30 p-3 sm:p-4 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl group" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
              <div className="absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r from-teal-400 to-teal-600"></div>
              <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 bg-teal-100/20 rounded-full opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                  <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl sm:rounded-2xl shadow-lg">
                    <CheckCircleIcon sx={{ fontSize: { xs: 20, sm: 28, md: 32, lg: 36 }, color: "#00B8A3" }} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs sm:text-sm text-teal-600 font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Done Tickets</div>
                    <div className="text-2xl sm:text-3xl md:text-4xl font-black text-teal-700">{counts.DONE}</div>
                  </div>
                </div>
                <div className="text-xs text-teal-600/70 font-medium">Completed</div>
              </div>
            </div>
          </div>

          <section className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-5 md:p-6" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1">Priority Distribution</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Breakdown of tickets by priority level</p>
            <div className="space-y-3 sm:space-y-4">
              {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
                const pct = Math.round(((priorities[p] || 0) / total) * 100);
                const colors = { URGENT: "#DC2626", HIGH: "#EA580C", MEDIUM: "#F59E0B", LOW: "#10B981" };
                return (
                  <div key={p} className="group">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-1 sm:mb-2">
                      <span className="text-gray-700">{p}</span>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-gray-900">{priorities[p] || 0}</span>
                        <span className="text-xs text-gray-500">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 sm:h-3 w-full rounded-full bg-gray-200/80 overflow-hidden">
                      <div 
                        className="h-2 sm:h-3 rounded-full transition-all duration-500 ease-out group-hover:opacity-80" 
                        style={{ 
                          width: `${pct}%`, 
                          backgroundColor: colors[p],
                          boxShadow: `0 2px 4px ${colors[p]}20`
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <NewReleasesIcon sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: "#FF6692" }} />
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Recent New Tickets</h2>
            </div>
            <ul className="divide-y divide-gray-100 rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white overflow-hidden" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
              {newItems.slice(0, 5).map((t, index) => (
                <li key={t.id} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 hover:bg-gray-50/50 transition-colors duration-200">
                  <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">
                          {index + 1}
                        </span>
                        <p className="text-xs sm:text-sm md:text-base font-bold text-gray-900 truncate">{t.title}</p>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {truncate(t.description, 120)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 font-medium">{fmtDate(t.createdAt)}</div>
                    <div className="text-xs text-gray-400">
                      Priority: <span className="font-semibold text-gray-600">{t.priority}</span>
                    </div>
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

/* ---------- STICKY HEADER COMPONENT ---------- */
function StickyTicketsHeader({ status, onChange }: { status: TicketStatus; onChange: (s: TicketStatus) => void }) {
  return (
    <div className="sticky top-0 z-50">
      {/* Nav integrado */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50" style={{ boxShadow: '0px 4px 12px rgba(239, 241, 246, 0.6)' }}>
        <div className="mx-auto flex max-w-screen-xl">
          <div className="flex-1">
            <div className="relative block w-full px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold text-[#00A1FF] bg-gradient-to-t from-blue-50 to-white">
              <div className="absolute inset-x-2 sm:inset-x-4 md:inset-x-6 lg:inset-x-8 bottom-0 h-0.5 sm:h-1 bg-[#00A1FF] rounded-t-sm"></div>
              Tickets
            </div>
          </div>
          <div className="flex-1">
            <Link href="/dashboard" className="relative block w-full px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4 text-center text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-600 hover:text-[#00A1FF] hover:bg-gray-50/50 transition-all duration-300">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>
      {/* Banner sin separación */}
      <FullWidthBanner
        kind="tickets"
        title="Tickets"
        subtitle="Create, categorize, prioritize, assign and follow up maintenance tickets."
      />
      {/* Tabs sin separación */}
      <Tabs value={status} onChange={onChange} />
    </div>
  );
}

/* ---------- APP ---------- */
export default function TicketsApp({ apiBase = "/_api" }: { apiBase?: string }) {
  const [status, setStatus] = useState<TicketStatus>("NEW");
  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <StickyTicketsHeader status={status} onChange={setStatus} />
      <main className="py-2 sm:py-3 md:py-4 lg:py-6">
        <TicketList apiBase={apiBase} status={status} />
      </main>
    </div>
  );
}
