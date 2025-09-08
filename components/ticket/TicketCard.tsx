"use client";

import React, { useState, useMemo, useEffect } from "react";
import { TicketStatus, Ticket, Person } from "../types/ticket";
import { StatusBadge } from "./StatusBadge";
import { KebabMenu } from "./KebabMenu";
import { CategorySelector } from "./CategorySelector";
import { PriorityRow } from "./PriorityRow";
import { AssignmentSelector } from "./AssignmentSelector";
import { CancelDialog } from "./dialogs/CancelDialog";
import { AssignmentDialog } from "./dialogs/AssignmentDialog";
import CustomAudioPlayer from "../CustomAudioPlayer";
import { patchTicket, patchStatus, cancelTicket, searchPersons } from "../api/ticketApi";

function truncate(txt: string, max = 120) {
  return txt && txt.length > max ? txt.slice(0, max - 1) + "…" : txt;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

type TicketCardProps = {
  t: Ticket;
  apiBase: string;
  onChanged?: () => void;
};

export function TicketCard({ t, apiBase, onChanged }: TicketCardProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedAssigneeNames, setSelectedAssigneeNames] = useState<string[]>([]);
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{names: string[], isReassign: boolean}>({names: [], isReassign: false});
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

  async function assignByNames(fullNames: string[]) {
    try {
      setBusy("assign");
      // For now, assign to the first person selected (can be extended later)
      const fullName = fullNames[0];
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

  const handleAssignmentChange = (names: string[]) => {
    setSelectedAssigneeNames(names);
    if (names.length === 0) return;
    if (!canAssign) { 
      alert("Complete category and priority before assigning."); 
      return; 
    }
    
    const isReassign: boolean = t.status === "OPEN" && (t.assignee || t.assigneeId) ? true : false;
    setPendingAssignment({names, isReassign});
    setShowAssignConfirmation(true);
  };

  const handleConfirmAssignment = async () => {
    setShowAssignConfirmation(false);
    await assignByNames(pendingAssignment.names);
    setPendingAssignment({names: [], isReassign: false});
  };

  const handleCancelAssignment = () => {
    setShowAssignConfirmation(false);
    setSelectedAssigneeNames([]);
    setPendingAssignment({names: [], isReassign: false});
  };

  const handleCancelTicket = async () => {
    if (cancelNote.trim()) {
      setShowCancelDialog(false);
      await cancel();
      setCancelNote("");
    }
  };

  return (
    <article className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg sm:shadow-2xl transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] backdrop-blur-sm" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
      {/* Header */}
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

      {/* Description */}
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

      {/* Audio player */}
      <div className="mb-4 sm:mb-5">
        <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
          <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
            <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
            <h4 className="font-bold text-[#00a1ff] text-sm sm:text-base">Audio</h4>
          </div>
          <CustomAudioPlayer src={t.audioUrl || null} />
        </div>
      </div>

      {/* Assignee info */}
      {(t.assignee || t.assigneeId) && (
        <div className="mb-4 sm:mb-5 p-2 sm:p-3 md:p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl border border-blue-200/60 shadow-sm">
          <div className="text-xs sm:text-sm text-blue-600 font-semibold mb-1">Assigned to:</div>
          <div className="text-xs sm:text-sm md:text-base font-bold text-blue-800">
            {t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : t.assigneeId}
          </div>
        </div>
      )}

      {/* Configuration */}
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

        <AssignmentSelector
          selectedNames={selectedAssigneeNames}
          onChange={handleAssignmentChange}
          disabled={!!busy}
          canAssign={canAssign}
          isReassignment={t.status === "OPEN" && (t.assignee || t.assigneeId)}
          peopleList={peopleList}
        />

        {!canAssign && (
          <div className="text-xs sm:text-sm text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100/50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-amber-200/60 shadow-sm">
            <span className="inline-flex items-center gap-1 sm:gap-2">
              <span className="text-amber-500">⚠️</span>
              <span className="font-medium">Complete category and priority to enable assignment</span>
            </span>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CancelDialog
        show={showCancelDialog}
        note={cancelNote}
        onNoteChange={setCancelNote}
        onCancel={() => {
          setShowCancelDialog(false);
          setCancelNote("");
        }}
        onConfirm={handleCancelTicket}
      />

      <AssignmentDialog
        show={showAssignConfirmation}
        names={pendingAssignment.names}
        isReassign={pendingAssignment.isReassign}
        onCancel={handleCancelAssignment}
        onConfirm={handleConfirmAssignment}
      />
    </article>
  );
}