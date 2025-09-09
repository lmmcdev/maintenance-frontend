"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
//import { createPortal } from "react-dom";
import { TicketStatus, Ticket } from "../types/ticket";
import { StatusBadge } from "./StatusBadge";
import { KebabMenu } from "./KebabMenu";
import CustomAudioPlayer from "../CustomAudioPlayer";
import { CategorySelector } from "./CategorySelector";
import { NotesDialog } from "./dialogs/NotesDialog";
import { PriorityRow } from "./PriorityRow";
import {
  patchTicket,
  patchStatus,
  cancelTicket,
  searchPersons,
} from "../api/ticketApi";
import { useLanguage } from "../context/LanguageContext";
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
  const { t: translate } = useLanguage();
  const { persons, peopleList: staticPeopleList } = useStaticData();
  const [busy, setBusy] = useState<
    "done" | "open" | "cancel" | "assign" | "category" | "priority" | null
  >(null);
  const [selectedAssigneeNames, setSelectedAssigneeNames] = useState<string[]>(
    []
  );
  const [showAssignConfirmation, setShowAssignConfirmation] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    names: string[];
    isReassign: boolean;
  }>({ names: [], isReassign: false });
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssignDropdownOpen(false);
      }
    }
    if (isAssignDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isAssignDropdownOpen]);

  const peopleList = staticPeopleList;

  const handlePersonToggle = (fullName: string) => {
    setSelectedAssigneeNames((prev) =>
      prev.includes(fullName)
        ? prev.filter((name) => name !== fullName)
        : [...prev, fullName]
    );
  };

  async function assignToNames(names: string[]) {
    setBusy("assign");
    try {
      // Validate ticket has required fields before attempting assignment
      console.log("Ticket validation check:", {
        ticketId: t.id,
        category: t.category,
        priority: t.priority,
        subcategory: t.subcategory,
        hasCategory: !!t.category,
        hasPriority: !!t.priority,
      });

      if (!t.category || !t.priority) {
        console.error("Validation failed - missing required fields");
        alert(translate("complete.category.priority"));
        return;
      }

      // Collect all assignee IDs first
      const assigneeIds: string[] = [];

      for (const fullName of names) {
        let match = persons.find(
          (p) =>
            `${p.firstName} ${p.lastName}`.toLowerCase() ===
            fullName.toLowerCase()
        );
        if (!match) {
          const res = await searchPersons(apiBase, fullName);
          match =
            res.find(
              (p) =>
                `${p.firstName} ${p.lastName}`.toLowerCase() ===
                fullName.toLowerCase()
            ) || res[0];
        }
        if (!match?.id) {
          alert(translate("assignee.not.found"));
          return;
        }
        assigneeIds.push(match.id);
      }

      // Send all IDs together in a single API call
      const patchData = {
        assigneeIds: assigneeIds,
        category: t.category,
        priority: t.priority,
        subcategory: t.subcategory,
      };

      console.log("Assigning ticket:", {
        ticketId: t.id,
        assigneeIds: assigneeIds,
        assigneeNames: names,
        category: t.category,
        priority: t.priority,
        currentStatus: t.status,
        patchData: JSON.stringify(patchData),
      });

      await patchTicket(apiBase, t.id, patchData);
      await patchStatus(apiBase, t.id, "OPEN");
      onChanged?.();

      // Debug: Log what the ticket data looks like after assignment
      console.log("Ticket data after assignment:", {
        ticketId: t.id,
        assignee: t.assignee,
        assigneeId: t.assigneeId,
        assignees: (t as any).assignees,
        assigneeIds: (t as any).assigneeIds,
        allTicketData: t,
      });
    } catch (e) {
      console.error("Assignment error:", e);
      alert((e as any)?.message ?? translate("error.assigning.ticket"));
    } finally {
      setBusy(null);
    }
  }

  async function markDone() {
    try {
      setBusy("done");
      await patchStatus(apiBase, t.id, "DONE");
      onChanged?.();
    } catch (e) {
      alert((e as any)?.message ?? translate("error.marking.done"));
    } finally {
      setBusy(null);
    }
  }

  async function reopen() {
    try {
      setBusy("open");
      await patchStatus(apiBase, t.id, "OPEN");
      onChanged?.();
    } catch (e) {
      alert((e as any)?.message ?? translate("error.reopening"));
    } finally {
      setBusy(null);
    }
  }

  const canAssign = useMemo(
    () => t.category && t.priority,
    [t.category, t.priority]
  );

  const handlePriorityChange = async (newPriority: Ticket["priority"]) => {
    try {
      setBusy("priority");
      await patchTicket(apiBase, t.id, { priority: newPriority });
      onChanged?.();
    } catch (e) {
      alert((e as any)?.message ?? translate("error.updating.priority"));
    } finally {
      setBusy(null);
    }
  };

  const handleAssignClick = () => {
    if (!canAssign) {
      alert(translate("complete.category.priority"));
      return;
    }
    if (selectedAssigneeNames.length === 0) return;

    const isReassign: boolean =
      t.status === "OPEN" && (t.assignee || t.assigneeId) ? true : false;
    setPendingAssignment({ names: selectedAssigneeNames, isReassign });
    setShowAssignConfirmation(true);
    setIsAssignDropdownOpen(false);
  };

  const handleConfirmAssignment = async () => {
    setShowAssignConfirmation(false);
    await assignToNames(pendingAssignment.names);
    setSelectedAssigneeNames([]);
  };

  const handleCancelAssignment = () => {
    setShowAssignConfirmation(false);
    setPendingAssignment({ names: [], isReassign: false });
  };

  const handleCancelTicket = async () => {
    if (!cancelNote.trim()) return;
    setShowCancelDialog(false);
    try {
      setBusy("cancel");
      await cancelTicket(apiBase, t.id, { reason: cancelNote.trim() });
      onChanged?.();
    } catch (e) {
      alert((e as any)?.message ?? "Error canceling");
    } finally {
      setBusy(null);
    }
    setCancelNote("");
  };

  return (
    <article
      className={`rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg sm:shadow-2xl transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] backdrop-blur-sm relative ${isAssignDropdownOpen || isCategoryDropdownOpen ? 'overflow-visible' : 'overflow-hidden'}`}
      style={{
        boxShadow:
          "0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)",
        zIndex: isAssignDropdownOpen || isCategoryDropdownOpen ? 40 : "auto",
      }}
    >
      {/* Header */}
      <header className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 pr-2">
          <div className="flex flex-col gap-2 mb-1 sm:mb-2">
            <div className="flex justify-start">
              <StatusBadge status={t.status} />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 leading-tight">
              {`${translate("ticket.reporter")} ${t.title}`}
            </h3>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium flex items-center gap-1 hover:text-gray-700 transition-colors cursor-pointer">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {t.phoneNumber && t.phoneNumber.length === 4
              ? `EXT ${t.phoneNumber}`
              : t.phoneNumber && t.phoneNumber.length === 10
              ? `(${t.phoneNumber.slice(0, 3)})-${t.phoneNumber.slice(
                  3,
                  6
                )}-${t.phoneNumber.slice(6)}`
              : t.phoneNumber}
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 ml-2">
          {/* Quick Action Buttons */}
          {t.status !== "CANCELLED" && (
            <>
              {t.status === "OPEN" && (
                <button
                  onClick={markDone}
                  disabled={!!busy}
                  className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 border border-green-200/60 rounded-md sm:rounded-lg hover:from-green-100 hover:to-green-200/50 hover:border-green-300/60 hover:text-green-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
                >
                  <svg
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">
                    {translate("mark.completed")}
                  </span>
                </button>
              )}
              {t.status === "DONE" && (
                <button
                  onClick={reopen}
                  disabled={!!busy}
                  className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 border border-blue-200/60 rounded-md sm:rounded-lg hover:from-blue-100 hover:to-blue-200/50 hover:border-blue-300/60 hover:text-blue-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
                >
                  <svg
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">
                    {translate("reopen.ticket")}
                  </span>
                </button>
              )}
              {t.status !== "DONE" && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={!!busy}
                  className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 border border-red-200/60 rounded-md sm:rounded-lg hover:from-red-100 hover:to-red-200/50 hover:border-red-300/60 hover:text-red-800 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
                >
                  <svg
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">
                    {translate("cancel.ticket.action")}
                  </span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setShowNotesDialog(true)}
            className="px-1 sm:px-2 md:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-700 border border-gray-200/60 rounded-md sm:rounded-lg hover:from-gray-100 hover:to-gray-200/50 hover:border-gray-300/60 hover:text-gray-800 transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
            title="View/Add Notes"
          >
            <svg
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">Notes</span>
          </button>
        </div>
      </header>

      {/* Description */}
      <div className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4 leading-relaxed">
        {truncate(t.description, 160)}
      </div>


      {/* Audio Section */}
      {(t.audio?.url || t.audioUrl) && (
        <div className="mb-4 sm:mb-5">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl border border-blue-200/60 p-2 sm:p-3 md:p-4 shadow-sm">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 mb-3">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
                <h4 className="font-bold text-[#00a1ff] text-sm sm:text-base">Audio</h4>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-xs sm:text-sm md:text-base">Created {fmtDate(t.createdAt)}</span>
              </div>
            </div>
            <div className="min-w-0">
              <CustomAudioPlayer src={t.audio?.url || t.audioUrl || null} />
            </div>
          </div>
        </div>
      )}

      {/* Assignee info */}
      {(t.assignee ||
        t.assigneeId ||
        (t as any).assignees ||
        (t as any).assigneeIds) && (
        <div className="mb-4 sm:mb-5 p-2 sm:p-3 md:p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl border border-blue-200/60 shadow-sm">
          <div className="text-xs sm:text-sm text-blue-600 font-semibold mb-1">
            {translate("assigned.to")}
          </div>
          <div className="text-xs sm:text-sm md:text-base font-bold text-blue-800">
            {t.assignee
              ? `${t.assignee.firstName} ${t.assignee.lastName}`
              : t.assigneeId
              ? t.assigneeId
              : (t as any).assignees && (t as any).assignees.length > 0
              ? (t as any).assignees
                  .map((a: any) => `${a.firstName} ${a.lastName}`)
                  .join(", ")
              : (t as any).assigneeIds && (t as any).assigneeIds.length > 0
              ? (t as any).assigneeIds.join(", ")
              : "Unknown assignee"}
          </div>
        </div>
      )}

      {/* Ticket Configuration */}
      <div className="mb-4 sm:mb-5">
        <div
          className={`bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 min-w-0 ${isAssignDropdownOpen || isCategoryDropdownOpen ? 'overflow-visible' : 'overflow-hidden'}`}
          style={{
            boxShadow:
              "0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)",
          }}
        >
          <div className="mb-2 sm:mb-3">
            <h4 className="font-bold text-gray-700 text-sm sm:text-base">
              {translate("ticket.configuration")}
            </h4>
          </div>

          <CategorySelector
            t={t}
            apiBase={apiBase}
            onChanged={onChanged}
            busy={busy === "category"}
            onOpenChange={setIsCategoryDropdownOpen}
          />

          <PriorityRow
            value={t.priority}
            onChange={handlePriorityChange}
            busy={busy === "priority"}
          />

          {/* Multi-Assignment Section */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-gray-600 text-xs sm:text-sm md:text-base min-w-[48px] sm:min-w-[64px] md:min-w-[72px] font-semibold">
                {translate("assign")}
              </span>
              <div className="flex-1 relative min-w-0">
                <button
                  onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}
                  disabled={!!busy}
                  className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between overflow-hidden"
                >
                  <span
                    className={`truncate mr-2 ${
                      selectedAssigneeNames.length === 0
                        ? "text-gray-500"
                        : "text-gray-900"
                    }`}
                  >
                    {selectedAssigneeNames.length === 0
                      ? translate("assign.to")
                      : selectedAssigneeNames.length === 1
                      ? selectedAssigneeNames[0]
                      : `${selectedAssigneeNames.length} ${translate(
                          "people.selected"
                        )}`}
                  </span>
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${
                      isAssignDropdownOpen ? "transform rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                {isAssignDropdownOpen && !busy && (
                  <div
                    className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-2xl overflow-visible"
                    style={{
                      boxShadow:
                        "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    {/* People list */}
                    <div className="max-h-60 sm:max-h-72 overflow-y-auto">
                      {peopleList.map((person) => (
                        <label
                          key={person}
                          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-blue-50 cursor-pointer transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAssigneeNames.includes(person)}
                            onChange={() => handlePersonToggle(person)}
                            className="w-4 h-4 text-[#00A1FF] border-gray-300 rounded focus:ring-[#00A1FF]/20 focus:ring-2"
                          />
                          <span className="text-xs sm:text-sm text-gray-700 flex-1 font-medium">
                            {person}
                          </span>
                          {selectedAssigneeNames.includes(person) && (
                            <svg
                              className="w-4 h-4 text-[#00A1FF]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="border-t-2 border-gray-100 p-2 sm:p-3 bg-gray-50">
                      <div className="flex gap-2 justify-between items-center">
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">
                          {selectedAssigneeNames.length > 0
                            ? `${selectedAssigneeNames.length} ${translate(
                                "people.selected"
                              )}`
                            : translate("assign.to")}
                        </div>
                        <div className="flex gap-2">
                          {selectedAssigneeNames.length > 0 && (
                            <button
                              onClick={() => {
                                setSelectedAssigneeNames([]);
                              }}
                              className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-white transition-colors"
                            >
                              {translate("clear")}
                            </button>
                          )}
                          <button
                            onClick={handleAssignClick}
                            disabled={selectedAssigneeNames.length === 0}
                            className="px-3 py-1.5 text-xs sm:text-sm bg-[#00A1FF] text-white rounded-md hover:bg-[#0081cc] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {t.assignee || t.assigneeId
                              ? translate("reassign.button")
                              : translate("assign.button")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning message */}
      {!canAssign && (
        <div className="text-xs sm:text-sm text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100/50 p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border border-amber-200/60 shadow-sm mt-2">
          <span className="inline-flex items-center gap-1 sm:gap-2">
            <span className="text-amber-500">⚠️</span>
            <span className="font-medium">
              {translate("complete.category.priority")}
            </span>
          </span>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full shadow-2xl mx-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              {translate("cancel.ticket")}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              {translate("cancel.ticket.reason")}
            </p>
            <textarea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              placeholder={translate("cancel.reason.placeholder")}
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
                {translate("cancel")}
              </button>
              <button
                onClick={handleCancelTicket}
                disabled={!cancelNote.trim()}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
              >
                {translate("cancel.ticket.action")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Confirmation Dialog */}
      {showAssignConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full shadow-2xl mx-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              {pendingAssignment.isReassign
                ? translate("reassign.ticket")
                : translate("assign.ticket")}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
              {pendingAssignment.isReassign
                ? `${translate("reassign.confirm")} ${
                    pendingAssignment.names.length === 1
                      ? pendingAssignment.names[0]
                      : `${pendingAssignment.names.length} ${translate(
                          "people"
                        )}`
                  }? ${translate("status.remain.open")}`
                : `${translate("assign.confirm")} ${
                    pendingAssignment.names.length === 1
                      ? pendingAssignment.names[0]
                      : `${pendingAssignment.names.length} ${translate(
                          "people"
                        )}`
                  }? ${translate("status.change.open")}`}
            </p>

            {/* Show selected people list if more than 1 */}
            {pendingAssignment.names.length > 1 && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {translate("selected.assignees")}
                </p>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  {pendingAssignment.names.map((name) => (
                    <li key={name} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end mt-3 sm:mt-4">
              <button
                onClick={handleCancelAssignment}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
              >
                {translate("cancel")}
              </button>
              <button
                onClick={handleConfirmAssignment}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#00A1FF] text-white rounded-lg hover:bg-[#0081cc] transition-colors order-1 sm:order-2"
              >
                {pendingAssignment.isReassign
                  ? translate("reassign.button")
                  : translate("assign.button")}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotesDialog
        show={showNotesDialog}
        ticketId={t.id}
        apiBase={apiBase}
        onClose={() => setShowNotesDialog(false)}
      />
    </article>
  );
}
