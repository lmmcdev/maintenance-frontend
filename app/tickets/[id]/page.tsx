"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ticket } from "@/components/types/ticket";
import { StatusBadge } from "@/components/ticket/StatusBadge";
import { CategorySelector } from "@/components/ticket/CategorySelector";
import { PriorityRow } from "@/components/ticket/PriorityRow";
import { AssignmentSelector } from "@/components/ticket/AssignmentSelector";
import { CancelDialog } from "@/components/ticket/dialogs/CancelDialog";
import { AssignmentDialog } from "@/components/ticket/dialogs/AssignmentDialog";
import { NotesDialog } from "@/components/ticket/dialogs/NotesDialog";
import CustomAudioPlayer from "@/components/CustomAudioPlayer";
import { patchTicket, patchTicketAssignees, patchStatus, cancelTicket, searchPersons } from "@/components/api/ticketApi";
import { useStaticData } from "@/components/context/StaticDataContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { LanguageProvider } from "@/components/context/LanguageContext";
import { StaticDataProvider } from "@/components/context/StaticDataContext";

function TicketDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedAssigneeNames, setSelectedAssigneeNames] = useState<string[]>([]);
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{names: string[], isReassign: boolean}>({names: [], isReassign: false});
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [showNotesDialog, setShowNotesDialog] = useState(false);

  const ticketId = params.id as string;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const { persons, peopleList } = useStaticData();
  const { t: translate } = useLanguage();

  useEffect(() => {
    if (!ticketId || !apiBase) return;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ticket: ${response.status}`);
        }
        
        const data = await response.json();
        setTicket(data.data || data);
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setError(err instanceof Error ? err.message : "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId, apiBase]);

  const reloadTicket = async () => {
    if (!ticketId || !apiBase) return;
    try {
      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data.data || data);
      }
    } catch (err) {
      console.error("Error reloading ticket:", err);
    }
  };

  async function assignByNames(fullNames: string[]) {
    if (!ticket) return;
    try {
      setBusy("assign");
      
      if (!ticket.category || !ticket.priority) {
        alert("Complete category and priority before assigning.");
        return;
      }
      
      const assigneeIds: string[] = [];
      
      for (const fullName of fullNames) {
        const match = persons.find(p => `${p.firstName} ${p.lastName}`.toLowerCase() === fullName.toLowerCase());
        if (match?.id) {
          assigneeIds.push(match.id);
        } else {
          const res = await searchPersons(apiBase!, fullName);
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
      
      await patchTicketAssignees(apiBase!, ticket.id, assigneeIds);
      await patchStatus(apiBase!, ticket.id, "OPEN");
      await reloadTicket();
    } catch (e) {
      console.error('Assignment error:', e);
      alert((e as any)?.message ?? "Error assigning ticket");
    } finally {
      setBusy(null);
    }
  }

  async function markDone() {
    if (!ticket) return;
    try { setBusy("done"); await patchStatus(apiBase!, ticket.id, "DONE"); await reloadTicket(); }
    catch (e) { alert((e as any)?.message ?? "Error marking done"); }
    finally { setBusy(null); }
  }

  async function reopen() {
    if (!ticket) return;
    try { setBusy("open"); await patchStatus(apiBase!, ticket.id, "OPEN"); await reloadTicket(); }
    catch (e) { alert((e as any)?.message ?? "Error reopening"); }
    finally { setBusy(null); }
  }

  const canAssign = useMemo(() => !!(ticket?.category && ticket?.priority), [ticket?.category, ticket?.priority]);

  const handleAssignmentChange = (names: string[]) => {
    setSelectedAssigneeNames(names);
  };

  const handleAssignmentRequest = (names: string[]) => {
    if (names.length === 0) return;
    if (!canAssign) { 
      alert("Complete category and priority before assigning."); 
      return; 
    }
    
    const isReassign: boolean = ticket!.status === "OPEN" && (ticket!.assignee || ticket!.assigneeId) ? true : false;
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
    if (!ticket) return;
    if (cancelNote.trim()) {
      setShowCancelDialog(false);
      try { 
        setBusy("cancel"); 
        await cancelTicket(apiBase!, ticket.id, { reason: cancelNote.trim() }); 
        await reloadTicket();
      }
      catch (e) { alert((e as any)?.message ?? "Error canceling"); }
      finally { setBusy(null); }
      setCancelNote("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#00A1FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base font-medium">{translate("loading.tickets")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{translate("error")}</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-[#00A1FF] text-white rounded-lg hover:bg-[#0091e6] transition-colors"
          >
            {translate("close")}
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h1>
          <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/tickets")}
            className="px-4 py-2 bg-[#00A1FF] text-white rounded-lg hover:bg-[#0091e6] transition-colors"
          >
            {translate("tickets")}
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return String(dateString);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {translate("close")}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00a1ff] rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{translate("ticket.details")}</h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Header Card with Actions */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-2xl" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={ticket.status} />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">{ticket.title}</h2>
                <p className="text-xs sm:text-sm text-gray-600">ID: {ticket.id}</p>
                {ticket.phoneNumber && (
                  <div className="text-xs sm:text-sm text-gray-500 font-medium flex items-center gap-1 mt-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {ticket.phoneNumber.length === 4
                      ? `EXT ${ticket.phoneNumber}`
                      : ticket.phoneNumber.length === 10
                      ? `(${ticket.phoneNumber.slice(0, 3)})-${ticket.phoneNumber.slice(3, 6)}-${ticket.phoneNumber.slice(6)}`
                      : ticket.phoneNumber}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {ticket.status !== "CANCELLED" && (
                  <>
                    {ticket.status === "OPEN" && (
                      <button
                        onClick={markDone}
                        disabled={!!busy}
                        className="px-3 py-2 bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 border border-green-200/60 rounded-lg hover:from-green-100 hover:to-green-200/50 hover:border-green-300/60 hover:text-green-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {translate("mark.completed")}
                      </button>
                    )}
                    {ticket.status === "DONE" && (
                      <button
                        onClick={reopen}
                        disabled={!!busy}
                        className="px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 border border-blue-200/60 rounded-lg hover:from-blue-100 hover:to-blue-200/50 hover:border-blue-300/60 hover:text-blue-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {translate("reopen.ticket")}
                      </button>
                    )}
                    {ticket.status !== "DONE" && (
                      <button
                        onClick={() => setShowCancelDialog(true)}
                        disabled={!!busy}
                        className="px-3 py-2 bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 border border-red-200/60 rounded-lg hover:from-red-100 hover:to-red-200/50 hover:border-red-300/60 hover:text-red-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {translate("cancel.ticket.action")}
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => setShowNotesDialog(true)}
                  className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-700 border border-gray-200/60 rounded-lg hover:from-gray-100 hover:to-gray-200/50 hover:border-gray-300/60 hover:text-gray-800 transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Notes
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{translate("description")}:</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Created Date */}
            <div className="text-xs sm:text-sm text-gray-500">
              <span className="font-medium">{translate("created")}</span> {formatDate(ticket.createdAt)}
            </div>
          </div>

          {/* Audio Section */}
          {(ticket.audioUrl || ticket.audio?.url) && (
            <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-2xl" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl border border-blue-200/60 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
                  <h3 className="font-bold text-[#00a1ff] text-base sm:text-lg">Audio</h3>
                </div>
                <div className="min-w-0">
                  <CustomAudioPlayer src={ticket.audioUrl || ticket.audio?.url || null} />
                </div>
              </div>
            </div>
          )}

          {/* Assignment Info */}
          {(ticket.assignee || ticket.assigneeId || (ticket as any).assignees || (ticket as any).assigneeIds) && (
            <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-2xl" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
              <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg sm:rounded-xl border border-green-200/60 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-green-500 rounded-full"></div>
                  <h3 className="font-bold text-green-700 text-base sm:text-lg">{translate("assigned.to")}</h3>
                </div>
                <div className="text-sm sm:text-base font-bold text-green-800">
                  {ticket.assignee
                    ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                    : ticket.assigneeId
                    ? ticket.assigneeId
                    : (ticket as any).assignees && (ticket as any).assignees.length > 0
                    ? (ticket as any).assignees
                        .map((a: any) => `${a.firstName} ${a.lastName}`)
                        .join(", ")
                    : (ticket as any).assigneeIds && (ticket as any).assigneeIds.length > 0
                    ? (ticket as any).assigneeIds.join(", ")
                    : "Unknown assignee"}
                </div>
              </div>
            </div>
          )}

          {/* Configuration */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-2xl" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
              <h3 className="font-bold text-[#00a1ff] text-base sm:text-lg">{translate("ticket.configuration")}</h3>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <CategorySelector t={ticket} apiBase={apiBase!} onChanged={reloadTicket} busy={!!busy} />

              <PriorityRow
                value={ticket.priority}
                busy={!!busy}
                onChange={async (p) => {
                  try {
                    setBusy("priority");
                    await patchTicket(apiBase!, ticket.id, { priority: p });
                    await reloadTicket();
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
                onAssign={handleAssignmentRequest}
                disabled={!!busy}
                canAssign={canAssign}
                isReassignment={ticket.status === "OPEN" && !!(ticket.assignee || ticket.assigneeId)}
                peopleList={peopleList}
              />

              {!canAssign && (
                <div className="text-sm text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100/50 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-amber-200/60">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-amber-500">⚠️</span>
                    <span className="font-medium">{translate("complete.category.priority")}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
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
          ticketId={ticket.id}
          apiBase={apiBase!}
          onClose={() => setShowNotesDialog(false)}
        />
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <LanguageProvider>
      <StaticDataProvider apiBase={process.env.NEXT_PUBLIC_API_BASE || ""}>
        <TicketDetailPageContent />
      </StaticDataProvider>
    </LanguageProvider>
  );
}