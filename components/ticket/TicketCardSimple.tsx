"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketStatus, Ticket } from "../types/ticket";
import { StatusBadge } from "./StatusBadge";
import { KebabMenu } from "./KebabMenu";
import { NotesDialog } from "./dialogs/NotesDialog";
import { patchStatus } from "../api/ticketApi";
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
  const [showNotesDialog, setShowNotesDialog] = useState(false);


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
        <div className="flex items-center gap-1 sm:gap-2 ml-2">
          {/* Details Button */}
          <button
            onClick={() => router.push(`/tickets/${t.id}`)}
            className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-[#00a1ff]/10 to-[#00a1ff]/20 text-[#00a1ff] border border-[#00a1ff]/30 rounded-md sm:rounded-lg hover:from-[#00a1ff]/20 hover:to-[#00a1ff]/30 hover:border-[#00a1ff]/50 transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-1 flex-shrink-0"
            title="View Details"
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
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
            <span className="hidden xs:inline text-[10px] sm:text-xs md:text-sm">{translate("details")}</span>
          </button>

          <button
            onClick={() => setShowNotesDialog(true)}
            className="px-1 sm:px-2 py-1 sm:py-1.5 bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-700 border border-gray-200/60 rounded-md sm:rounded-lg hover:from-gray-100 hover:to-gray-200/50 hover:border-gray-300/60 hover:text-gray-800 transition-all duration-300 text-[10px] sm:text-xs font-semibold shadow-sm hover:shadow-md flex items-center gap-0.5 sm:gap-1 flex-shrink-0"
            title="View/Add Notes"
          >
            <svg
              className="w-2.5 h-2.5 sm:w-3 sm:h-3"
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
            <span className="hidden xs:inline text-[10px] sm:text-xs">Notes</span>
          </button>

          <KebabMenu
            state={t.status}
            onMarkDone={markDone}
            onReopen={reopen}
            onCancel={() => {}}
            disabled={!!busy}
          />
        </div>
      </header>

      {/* Description */}
      <div className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4 leading-relaxed">
        {truncate(t.description, 160)}
      </div>

      {/* Audio Indicator */}
      {(t.audio?.url || t.audioUrl) && (
        <div className="mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 rounded-lg border border-blue-200/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 12h.01M9 16v-4a3 3 0 016 0v4" />
            </svg>
            <span className="text-sm font-semibold">Audio Available</span>
          </div>
        </div>
      )}

      {/* Assignee info */}
      {(t.assignee || t.assigneeId || (t as any).assignees || (t as any).assigneeIds) && (
        <div className="mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 rounded-lg border border-green-200/60">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-semibold">
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
            </span>
          </div>
        </div>
      )}

      {/* Quick Status Indicators */}
      <div className="flex flex-wrap gap-2 text-xs">
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


      <NotesDialog
        show={showNotesDialog}
        ticketId={t.id}
        apiBase={apiBase}
        onClose={() => setShowNotesDialog(false)}
      />
    </article>
    </>
  );
}
