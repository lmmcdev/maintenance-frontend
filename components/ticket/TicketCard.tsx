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
import { useLanguage } from "../context/LanguageContext";

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
  const { t: translate } = useLanguage();

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
        <div className="flex flex-col gap-2 order-2 sm:order-1">
          <div className="flex justify-start">
            <StatusBadge status={t.status} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-tight text-gray-900">{t.title}</h3>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 order-1 sm:order-2">
          {/* Quick Action Buttons */}
          {t.status !== "CANCELLED" && (
            <>
              {t.status === "OPEN" && (
                <button
                  onClick={markDone}
                  disabled={!!busy}
                  className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 border border-green-200/60 rounded-md sm:rounded-lg hover:from-green-100 hover:to-green-200/50 hover:border-green-300/60 hover:text-green-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
                >
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">{translate("mark.completed")}</span>
                </button>
              )}
              {t.status === "DONE" && (
                <button
                  onClick={reopen}
                  disabled={!!busy}
                  className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 border border-blue-200/60 rounded-md sm:rounded-lg hover:from-blue-100 hover:to-blue-200/50 hover:border-blue-300/60 hover:text-blue-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
                >
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">{translate("reopen.ticket")}</span>
                </button>
              )}
              {t.status !== "DONE" && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={!!busy}
                  className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 border border-red-200/60 rounded-md sm:rounded-lg hover:from-red-100 hover:to-red-200/50 hover:border-red-300/60 hover:text-red-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
                >
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">{translate("cancel.ticket.action")}</span>
                </button>
              )}
            </>
          )}
          
          <button
            onClick={() => setShowNotesDialog(true)}
            className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-700 border border-gray-200/60 rounded-md sm:rounded-lg hover:from-gray-100 hover:to-gray-200/50 hover:border-gray-300/60 hover:text-gray-800 transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
            title="View/Add Notes"
          >
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">Notes</span>
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
      

      {/* Audio Section */}
      {(t.audioUrl) && (
        <div className="mb-4 sm:mb-5">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl border border-blue-200/60 p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 mb-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 12h.01M9 16v-4a3 3 0 016 0v4" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Created {fmtDate(t.createdAt)}</span>
                </div>
              </div>
            </div>
            <div>
              <CustomAudioPlayer src={t.audioUrl || null} />
            </div>
          </div>
        </div>
      )}

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