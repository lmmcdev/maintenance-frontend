"use client";

import React, { useState, useMemo } from "react";
import { TicketStatus, Ticket } from "../types/ticket";
import { StatusBadge } from "./StatusBadge";
import { KebabMenu } from "./KebabMenu";
import { CategorySelector } from "./CategorySelector";
import { PriorityRow } from "./PriorityRow";
import { AssignmentSelector } from "./AssignmentSelector";
import { CancelDialog } from "./dialogs/CancelDialog";
import { AssignmentDialog } from "./dialogs/AssignmentDialog";
import { NotesDialog } from "./dialogs/NotesDialog";
import CustomAudioPlayer from "../CustomAudioPlayer";
import { patchTicket, patchTicketAssignees, patchStatus, cancelTicket, searchPersons } from "../api/ticketApi";
import { useStaticData } from "../context/StaticDataContext";

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
  const [selectedAssigneeNames, setSelectedAssigneeNames] = useState<string[]>([]);
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{names: string[], isReassign: boolean}>({names: [], isReassign: false});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  
  // Use static data from context
  const { persons, peopleList } = useStaticData();

  async function assignByNames(fullNames: string[]) {
    try {
      setBusy("assign");
      
      // Validate ticket has required fields before attempting assignment
      if (!t.category || !t.priority) {
        alert("Complete category and priority before assigning.");
        return;
      }
      
      // Collect all assignee IDs
      const assigneeIds: string[] = [];
      
      for (const fullName of fullNames) {
        const match = persons.find(p => `${p.firstName} ${p.lastName}`.toLowerCase() === fullName.toLowerCase());
        if (match?.id) {
          assigneeIds.push(match.id);
        } else {
          // Try searching if not in cached data
          const res = await searchPersons(apiBase, fullName);
          const searchMatch = res.find(p => `${p.firstName} ${p.lastName}`.toLowerCase() === fullName.toLowerCase()) || res[0];
          if (searchMatch?.id) {
            assigneeIds.push(searchMatch.id);
          } else {
            console.warn(`Assignee not found: ${fullName}`);
          }
        }
      }
      
      if (assigneeIds.length === 0) {
        alert("No valid assignees found in directory.");
        return;
      }
      
      console.log('Assigning ticket to multiple users:', {
        ticketId: t.id,
        assigneeIds,
        assigneeNames: fullNames,
        category: t.category,
        priority: t.priority,
        currentStatus: t.status
      });
      
      // Use the new patchTicketAssignees function for multiple assignees
      await patchTicketAssignees(apiBase, t.id, assigneeIds);
      await patchStatus(apiBase, t.id, "OPEN");
      onChanged?.();
    } catch (e) {
      console.error('Assignment error:', e);
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


  const canAssign = useMemo(() => !!(t.category && t.priority), [t.category, t.priority]);

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
      try { 
        setBusy("cancel"); 
        await cancelTicket(apiBase, t.id, { reason: cancelNote.trim() }); 
        onChanged?.(); 
      }
      catch (e) { alert((e as any)?.message ?? "Error canceling"); }
      finally { setBusy(null); }
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
          <button
            onClick={() => setShowNotesDialog(true)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            title="View/Add Notes"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-[#00A1FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
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
      
      {/* Creation date and Audio */}
      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200/60">
        <div className="flex items-center justify-between gap-4">
          {/* Audio info */}
          {(t.audioUrl) && (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
              <h4 className="font-bold text-[#00a1ff] text-xs sm:text-sm">Audio</h4>
            </div>
          )}
          
          {/* Created info */}
          <div className="flex items-center gap-2 sm:gap-3">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <span className="text-xs text-gray-500 font-medium">Created: </span>
              <span className="text-xs sm:text-sm text-gray-700 font-semibold">{fmtDate(t.createdAt)}</span>
            </div>
          </div>
        </div>
        
        {/* Audio player - more compact */}
        {(t.audioUrl) && (
          <div className="mt-1.5 sm:mt-2">
            <CustomAudioPlayer src={t.audioUrl || null} />
          </div>
        )}
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
          isReassignment={t.status === "OPEN" && !!(t.assignee || t.assigneeId)}
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
      
      <NotesDialog
        show={showNotesDialog}
        ticketId={t.id}
        apiBase={apiBase}
        onClose={() => setShowNotesDialog(false)}
      />
    </article>
  );
}