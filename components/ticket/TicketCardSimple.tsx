"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketStatus, Ticket, TicketSource } from "../types/ticket";
import { StatusBadge } from "./StatusBadge";
import { CancelDialog } from "./dialogs/CancelDialog";
import { patchTicketStatus, cancelTicket } from "@/lib/api/client";
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

function getSourceDisplay(source?: TicketSource | null, currentLanguage?: string) {
  const texts = {
    en: {
      EMAIL: "Email",
      RINGCENTRAL: "Call", 
      MANUAL: "Manual",
      UNKNOWN: "Unknown"
    },
    es: {
      EMAIL: "Email",
      RINGCENTRAL: "Llamada",
      MANUAL: "Manual", 
      UNKNOWN: "Desconocido"
    }
  };

  const lang = currentLanguage === "es" ? "es" : "en";

  switch (source) {
    case "EMAIL":
      return { text: texts[lang].EMAIL, icon: "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "text-blue-600" };
    case "RINGCENTRAL":
      return { text: texts[lang].RINGCENTRAL, icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", color: "text-green-600" };
    case "MANUAL":
      return { text: texts[lang].MANUAL, icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z", color: "text-gray-600" };
    default:
      return { text: texts[lang].UNKNOWN, icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-gray-500" };
  }
}

function getLocationDisplay(location?: { category: string; subLocation?: string } | null, currentLanguage?: string) {
  if (!location) return null;

  const locationLabels = {
    "ADULT DAY CARE": currentLanguage === "es" ? "Centro de Día" : "Adult Day Care",
    "MEDICAL CENTER": currentLanguage === "es" ? "Centro Médico" : "Medical Center", 
    "Pharmacy": "Pharmacy",
    "OTC": "OTC",
    "Research": "Research",
    "Corporate": "Corporate"
  };

  const subLocationLabels = {
    // Adult Day Care locations
    ADC_HIALEAH_WEST: "ADC Hialeah West",
    ADC_HIALEAH_EAST: "ADC Hialeah East",
    ADC_BIRD_ROAD: "ADC Bird Road",
    ADC_CUTLER_BAY: "ADC Cutler Bay",
    ADC_HIALEAH: "ADC Hialeah",
    ADC_HIATUS: "ADC Hiatus",
    ADC_HOLLYWOOD: "ADC Hollywood",
    ADC_HOMESTEAD: "ADC Homestead",
    ADC_KENDALL: "ADC Kendall",
    ADC_MARLINS_PARK: "ADC Marlins Park",
    ADC_MIAMI_27TH: "ADC Miami 27th",
    ADC_MIAMI_37TH: "ADC Miami 37th",
    ADC_MIAMI_GARDENS: "ADC Miami Gardens",
    ADC_MIAMI_LAKES: "ADC Miami Lakes",
    ADC_NORTH_MIAMI: "ADC North Miami",
    ADC_NORTH_MIAMI_BEACH: "ADC North Miami Beach",
    ADC_PEMBROKE_PINES: "ADC Pembroke Pines",
    ADC_PLANTATION: "ADC Plantation",
    ADC_TAMARAC: "ADC Tamarac",
    ADC_WEST_PALM_BEACH: "ADC West Palm Beach",
    ADC_WESTCHESTER: "ADC Westchester",
    
    // Medical Center locations
    HIALEAH_MC: "Hialeah MC",
    HIALEAH_WEST_MC: "Hialeah West MC",
    HIALEAH_EAST_MC: "Hialeah East MC",
    BIRD_ROAD_MC: "Bird Road MC",
    HIATUS_MC: "Hiatus MC",
    PEMBROKE_PINES_MC: "Pembroke Pines MC",
    PLANTATION_MC: "Plantation MC",
    WEST_PALM_BEACH_MC: "West Palm Beach MC",
    HOLLYWOOD_MC: "Hollywood MC",
    KENDALL_MC: "Kendall MC",
    HOMESTEAD_MC: "Homestead MC",
    CUTLER_RIDGE_MC: "Cutler Ridge MC",
    TAMARAC_MC: "Tamarac MC",
    WESTCHESTER_MC: "Westchester MC",
    NORTH_MIAMI_BEACH_MC: "North Miami Beach MC",
    MIAMI_GARDENS_MC: "Miami Gardens MC",
    MARLINS_PARK_MC: "Marlins Park MC",
    MIAMI_27TH_MC: "Miami 27th MC",
    HIALEAH_GARDENS_SPECIALIST: "Hialeah Gardens Specialist",
    BIRD_ROAD_SPECIALIST: "Bird Road Specialist"
  };

  const categoryText = locationLabels[location.category as keyof typeof locationLabels] || location.category;
  const subLocationText = location.subLocation ? subLocationLabels[location.subLocation as keyof typeof subLocationLabels] || location.subLocation : null;

  return {
    text: subLocationText ? `${categoryText} - ${subLocationText}` : categoryText,
    icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    color: "text-purple-600"
  };
}

type TicketCardProps = {
  t: Ticket;
  apiBase: string;
  token?: string;
  onChanged?: () => void;
};

export function TicketCard({ t, apiBase, token, onChanged }: TicketCardProps) {
  const { t: translate, language } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState<"done" | "open" | "cancel" | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelNote, setCancelNote] = useState("");


  async function markDone() {
    try {
      setBusy("done");
      await patchTicketStatus({ apiBase, token }, t.id, "DONE");
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
      await patchTicketStatus({ apiBase, token }, t.id, "OPEN");
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
      await cancelTicket({ apiBase, token }, t.id, { reason });
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
              <div className="text-xs sm:text-sm text-gray-500 font-medium flex items-center gap-1 mb-1">
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
      <div className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4 leading-relaxed break-words overflow-wrap-anywhere">
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
            <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 rounded-lg border border-green-200/60">
              <span className="text-sm font-semibold">{translate("assigned.to.label")}</span>

              {/* Multiple assignees with photos */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Single assignee */}
                {t.assignee?.firstName && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                      {t.assignee?.profilePhoto?.url ? (
                        <img
                          src={t.assignee.profilePhoto.url}
                          alt={`${t.assignee.firstName} ${t.assignee.lastName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling as HTMLDivElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${t.assignee?.profilePhoto?.url ? 'hidden' : 'flex'}`}>
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{t.assignee.firstName} {t.assignee.lastName}</span>
                  </div>
                )}

                {/* Multiple assignees */}
                {(t as any).assignees && (t as any).assignees.length > 0 && (t as any).assignees.map((assignee: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                      {assignee?.profilePhoto?.url ? (
                        <img
                          src={assignee.profilePhoto.url}
                          alt={`${assignee.firstName} ${assignee.lastName}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling as HTMLDivElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${assignee?.profilePhoto?.url ? 'hidden' : 'flex'}`}>
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{assignee.firstName} {assignee.lastName}</span>
                    {index < (t as any).assignees.length - 1 && <span className="text-sm">,</span>}
                  </div>
                ))}

                {/* Fallback for assigneeId or assigneeIds */}
                {!t.assignee?.firstName && !(t as any).assignees?.length && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {t.assigneeId || ((t as any).assigneeIds && (t as any).assigneeIds.join(", "))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Status Indicators */}
      <div className="flex flex-wrap gap-2 text-xs mb-4 sm:mb-5">
        {t.priority && (
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
            <span className="font-medium">{translate("priority")}</span>
            <span className="ml-1 capitalize">{t.priority}</span>
          </span>
        )}
        {(t.subcategory || t.category) && (
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
            <span className="font-medium">{translate("category")}</span>
            <span className="ml-1">
              {typeof t.subcategory === "object" && t.subcategory?.displayName
                ? t.subcategory.displayName
                : typeof t.subcategory === "string"
                ? t.subcategory
                : t.category}
            </span>
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
            {t.status === "OPEN" && (
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
            {t.status === "NEW" && (
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

      {/* Creation Date, Location & Source */}
      <div className="space-y-2 mt-3 pt-2 border-t border-gray-100">
        {/* Top row: Created date and Source */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs sm:text-sm text-gray-500 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {translate("created")} {t.createdAt ? fmtDate(t.createdAt) : 'N/A'}
          </div>
          {/* Source */}
          {(() => {
            const sourceInfo = getSourceDisplay(t.source, language);
            return (
              <div className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${sourceInfo.color}`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sourceInfo.icon} />
                </svg>
                {sourceInfo.text}
              </div>
            );
          })()}
        </div>
        
        {/* Bottom row: Location (if exists) */}
        {(() => {
          const locationInfo = getLocationDisplay(t.location, language);
          if (!locationInfo) return null;
          
          return (
            <div className={`text-xs sm:text-sm font-medium flex items-center gap-1 ${locationInfo.color}`}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locationInfo.icon} />
              </svg>
              {locationInfo.text}
            </div>
          );
        })()}
      </div>

      
      <CancelDialog
        show={showCancelDialog}
        note={cancelNote}
        onNoteChange={setCancelNote}
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={() => handleCancelTicket(cancelNote)}
      />
    </article>
    </>
  );
}
