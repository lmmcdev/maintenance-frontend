"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketStatus, Ticket } from "../types/ticket";
import { StatusBadge } from "./StatusBadge";
import { CancelDialog } from "./dialogs/CancelDialog";
import { patchStatus, cancelTicket } from "../api/ticketApi";
import { useLanguage } from "../context/LanguageContext";

function truncate(txt: string, max = 120) {
  return txt && txt.length > max ? txt.slice(0, max - 1) + "…" : txt;
}

type TicketCardProps = {
  t: Ticket;
  apiBase: string;
  onChanged?: () => void;
};

export function TicketCard({ t, apiBase, onChanged }: TicketCardProps) {
  const { t: translate } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState<"done" | "open" | "cancel" | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState("");


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

  async function handleCancelTicket(reason: string) {
    try {
      setBusy("cancel");
      await cancelTicket(apiBase, t.id, reason);
      onChanged?.();
      setShowCancelDialog(false);
      setCancelNote("");
    } catch (e) {
      alert((e as any)?.message ?? translate("error.cancelling"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
    <article
      className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 lg:p-8 shadow-lg sm:shadow-2xl transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] backdrop-blur-sm"
      style={{
        boxShadow:
          "0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)",
      }}
    >
      {/* Header */}
      <header className="flex flex-col gap-3 mb-3 sm:mb-4">
        {/* Title and Status Row */}
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <div className="flex flex-col gap-2 mb-1 sm:mb-2">
              <div className="flex justify-start">
                <StatusBadge status={t.status} />
              </div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                {`${translate("ticket.reporter")} ${t.title}`}
              </h3>
            </div>
            {t.phoneNumber && (
              <div className="text-xs sm:text-sm text-gray-500 font-medium flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {t.phoneNumber.length === 4
                  ? `EXT ${t.phoneNumber}`
                  : t.phoneNumber.length === 10
                  ? `(${t.phoneNumber.slice(0, 3)})-${t.phoneNumber.slice(
                      3,
                      6
                    )}-${t.phoneNumber.slice(6)}`
                  : t.phoneNumber}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Description */}
      <div className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4 leading-relaxed">
        {truncate(t.description, 160)}
      </div>


      {/* Assignee info - Only show if there's a valid assignee */}
      {(() => {
        const hasValidAssignee = t.assignee?.firstName || 
          t.assigneeId || 
          ((t as any).assignees && (t as any).assignees.length > 0) ||
          ((t as any).assigneeIds && (t as any).assigneeIds.length > 0);
        
        if (!hasValidAssignee) return null;

        return (
          <div className="mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 rounded-lg border border-green-200/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-semibold">
                {t.assignee?.firstName
                  ? `${t.assignee.firstName} ${t.assignee.lastName}`
                  : t.assigneeId
                  ? t.assigneeId
                  : (t as any).assignees && (t as any).assignees.length > 0
                  ? (t as any).assignees
                      .map((a: any) => `${a.firstName} ${a.lastName}`)
                      .join(", ")
                  : (t as any).assigneeIds.join(", ")}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Quick Status Indicators */}
      <div className="flex flex-wrap gap-2 text-xs mb-4 sm:mb-5">
        {t.category && (
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
            <span className="font-medium">Category:</span>
            <span className="ml-1">{t.category}</span>
          </span>
        )}
        {t.priority && (
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
            <span className="font-medium">Priority:</span>
            <span className="ml-1 capitalize">{t.priority}</span>
          </span>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-start">
        {/* Details Button - Always visible with text */}
        <button
          onClick={() => router.push(`/tickets/${t.id}`)}
          className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md active:shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 min-h-[36px]"
          title="View Details"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="leading-none">{translate("button.details")}</span>
        </button>


        {/* Action Buttons based on status */}
        {t.status !== "CANCELLED" && (
          <>
            {(t.status === "NEW" || t.status === "OPEN") && (
              <>
                <button
                  onClick={markDone}
                  disabled={!!busy}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md active:shadow-sm disabled:shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 min-h-[36px]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline leading-none">{translate("mark.completed")}</span>
                  <span className="sm:hidden leading-none">{translate("button.done")}</span>
                </button>
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={!!busy}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md active:shadow-sm disabled:shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 min-h-[36px]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline leading-none">{translate("cancel.ticket.action")}</span>
                  <span className="sm:hidden leading-none">{translate("button.cancel")}</span>
                </button>
              </>
            )}
            {t.status === "DONE" && (
              <button
                onClick={reopen}
                disabled={!!busy}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md active:shadow-sm disabled:shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 min-h-[36px]"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="leading-none">{translate("reopen.ticket")}</span>
              </button>
            )}
          </>
        )}
      </div>

      
      <CancelDialog
        show={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onCancel={handleCancelTicket}
      />
    </article>
    </>
  );
}
