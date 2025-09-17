"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ticket, TicketSource } from "@/components/types/ticket";
import { StatusBadge } from "@/components/ticket/StatusBadge";
import { CategorySelector } from "@/components/ticket/CategorySelector";
import { PriorityRow } from "@/components/ticket/PriorityRow";
import { AssignmentSelector } from "@/components/ticket/AssignmentSelector";
import { LocationSelector } from "@/components/ticket/LocationSelector";
import { CancelDialog } from "@/components/ticket/dialogs/CancelDialog";
import { AssignmentDialog } from "@/components/ticket/dialogs/AssignmentDialog";
import { NotesDialog } from "@/components/ticket/dialogs/NotesDialog";
import { AttachmentsDialog } from "@/components/ticket/dialogs/AttachmentsDialog";
import CustomAudioPlayer from "@/components/CustomAudioPlayer";
import { patchTicket, patchTicketStatus, cancelTicket, searchPersons } from "@/lib/api/client";
import { useStaticData } from "@/components/context/StaticDataContext";
import { useLanguage } from "@/components/context/LanguageContext";
import { StaticDataProvider } from "@/components/context/StaticDataContext";
import { Nav } from "@/app/(ui)/nav";
import { useApiTokens } from "@/lib/hooks/useApiTokens";

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
  const [showAttachments, setShowAttachments] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  const ticketId = params.id as string;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const { persons, peopleList } = useStaticData();
  const { t: translate, language } = useLanguage();
  const { getMaintenanceToken, tokens } = useApiTokens();

  useEffect(() => {
    if (!ticketId || !apiBase) return;

    const fetchTicket = async () => {
      try {
        setLoading(true);
        const token = await getMaintenanceToken();
        setCurrentToken(token);
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}`, { headers });

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
  }, [ticketId, apiBase, getMaintenanceToken]);

  const reloadTicket = async () => {
    if (!ticketId || !apiBase) return;
    try {
      const token = await getMaintenanceToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}`, { headers });
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

      const token = await getMaintenanceToken();
      const assigneeIds: string[] = [];

      for (const fullName of fullNames) {
        const match = persons.find(p => `${p.firstName} ${p.lastName}`.toLowerCase() === fullName.toLowerCase());
        if (match?.id) {
          assigneeIds.push(match.id);
        } else {
          const res = await searchPersons({ apiBase: apiBase!, token: token || undefined }, fullName);
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

      await patchTicket({ apiBase: apiBase!, token: token || undefined }, ticket.id, { assigneeIds });
      await patchTicketStatus({ apiBase: apiBase!, token: token || undefined }, ticket.id, "OPEN");
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
    try {
      setBusy("done");
      const token = await getMaintenanceToken();
      await patchTicketStatus({ apiBase: apiBase!, token: token || undefined }, ticket.id, "DONE");
      await reloadTicket();
    }
    catch (e) { alert((e as any)?.message ?? "Error marking done"); }
    finally { setBusy(null); }
  }

  async function reopen() {
    if (!ticket) return;
    try {
      setBusy("open");
      const token = await getMaintenanceToken();
      await patchTicketStatus({ apiBase: apiBase!, token: token || undefined }, ticket.id, "OPEN");
      await reloadTicket();
    }
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
        const token = await getMaintenanceToken();
        await cancelTicket({ apiBase: apiBase!, token: token || undefined }, ticket.id, { reason: cancelNote.trim() });
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

  const getSourceDisplay = (source?: TicketSource | null) => {
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

    const lang = language === "es" ? "es" : "en";

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
  };

  const getLocationDisplay = (locations?: Array<{ category: string; subLocation?: string; locationId?: string }> | { category: string; subLocation?: string } | null) => {
    // Handle both single location (legacy) and multiple locations
    const locationArray = Array.isArray(locations) ? locations : (locations ? [locations] : []);

    if (!locationArray || locationArray.length === 0) return null;

    const locationLabels = {
      "ADULT DAY CARE": language === "es" ? "Centro de Día" : "Adult Day Care",
      "MEDICAL CENTER": language === "es" ? "Centro Médico" : "Medical Center",
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

    if (locationArray.length === 1) {
      const location = locationArray[0];
      const categoryText = locationLabels[location.category as keyof typeof locationLabels] || location.category;
      const subLocationText = location.subLocation ? subLocationLabels[location.subLocation as keyof typeof subLocationLabels] || location.subLocation : null;

      return {
        text: subLocationText ? `${categoryText} - ${subLocationText}` : categoryText,
        icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
        color: "text-purple-600"
      };
    } else {
      // Multiple locations - show count and first few names
      const locationNames = locationArray.map(location => {
        const categoryText = locationLabels[location.category as keyof typeof locationLabels] || location.category;
        const subLocationText = location.subLocation ? subLocationLabels[location.subLocation as keyof typeof subLocationLabels] || location.subLocation : null;
        return subLocationText ? `${categoryText} - ${subLocationText}` : categoryText;
      });

      const displayText = locationNames.length > 2
        ? `${locationNames.slice(0, 2).join(", ")} +${locationNames.length - 2} ${language === "es" ? "más" : "more"}`
        : locationNames.join(", ");

      return {
        text: displayText,
        icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
        color: "text-purple-600"
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <Nav />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00a1ff] rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{translate("ticket.details")}</h1>
          </div>
          
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm border border-gray-300 hover:border-gray-400"
          >
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
                {/* Notes Button - Always visible */}
                <button
                  onClick={() => setShowNotesDialog(true)}
                  className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md active:shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 min-h-[36px]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="leading-none">{translate("button.notes")}</span>
                </button>

                {/* Attachments Button - Always visible */}
                <button
                  onClick={() => setShowAttachments(true)}
                  className="px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 text-xs sm:text-sm font-medium shadow-sm hover:shadow-md active:shadow-sm flex items-center justify-center gap-1.5 flex-shrink-0 min-h-[36px]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="leading-none">{language === "es" ? "Archivos" : "Files"}</span>
                  {ticket?.attachments && ticket.attachments.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full ml-1">
                      {ticket.attachments.length}
                    </span>
                  )}
                </button>

                {/* Status-based Action Buttons */}
                {ticket.status !== "CANCELLED" && (
                  <>
                    {(ticket.status === "NEW" || ticket.status === "OPEN") && (
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
                    {ticket.status === "DONE" && (
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
            </div>

            {/* Description */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{translate("description")}:</h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Created Date, Source & Location */}
            <div className="space-y-2 text-xs sm:text-sm">
              {/* Top row: Created date and Source */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-gray-500">
                  <span className="font-medium">{translate("created")}</span> {formatDate(ticket.createdAt)}
                </div>
                {/* Source */}
                {(() => {
                  const sourceInfo = getSourceDisplay(ticket.source);
                  return (
                    <div className={`flex items-center gap-1 font-medium ${sourceInfo.color}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sourceInfo.icon} />
                      </svg>
                      <span>{sourceInfo.text}</span>
                    </div>
                  );
                })()}
              </div>
              
              {/* Bottom row: Location (if exists) */}
              {(() => {
                // Handle the new ticket locations structure
                let displayLocations: any[] = [];

                if (ticket.locations && Array.isArray(ticket.locations)) {
                  displayLocations = ticket.locations.map(loc => ({
                    category: "API_LOCATIONS",
                    locationId: loc.id || loc.location?.id,
                    name: loc.location?.name || `Location ${loc.id}`,
                  }));
                } else if (ticket.location) {
                  displayLocations = [ticket.location];
                }

                if (displayLocations.length === 0) return null;

                // Show location names directly for API locations
                const locationNames = displayLocations.map(loc => loc.name || loc.category);
                const displayText = locationNames.length > 2
                  ? `${locationNames.slice(0, 2).join(", ")} +${locationNames.length - 2} ${language === "es" ? "más" : "more"}`
                  : locationNames.join(", ");

                return (
                  <div className="flex items-center gap-1 font-medium text-purple-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{displayText}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Audio Section */}
          {(ticket.audioUrl || 
            (Array.isArray(ticket.audio) ? ticket.audio?.[0]?.url : ticket.audio?.url) || 
            ticket.source === "RINGCENTRAL") && (
            <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-2xl" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg sm:rounded-xl border border-blue-200/60 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
                  <h3 className="font-bold text-[#00a1ff] text-base sm:text-lg">{language === "es" ? "Audio" : "Audio"}</h3>
                </div>
                <div className="min-w-0">
                  <CustomAudioPlayer 
                    src={ticket.audioUrl || 
                         (Array.isArray(ticket.audio) ? ticket.audio?.[0]?.url : ticket.audio?.url) || 
                         null} 
                    isCall={ticket.source === "RINGCENTRAL"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Assignment Info - Only show if there's a valid assignee */}
          {(() => {
            const hasValidAssignee = ticket.assignee?.firstName || 
              ticket.assigneeId || 
              ((ticket as any).assignees && (ticket as any).assignees.length > 0) ||
              ((ticket as any).assigneeIds && (ticket as any).assigneeIds.length > 0);
            
            if (!hasValidAssignee) return null;

            return (
              <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-2xl" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
                <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-lg sm:rounded-xl border border-green-200/60 p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-green-500 rounded-full"></div>
                    <h3 className="font-bold text-green-700 text-base sm:text-lg">{translate("assigned.to")}</h3>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-green-800">
                    {ticket.assignee?.firstName
                      ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                      : ticket.assigneeId
                      ? ticket.assigneeId
                      : (ticket as any).assignees && (ticket as any).assignees.length > 0
                      ? (ticket as any).assignees
                          .map((a: any) => `${a.firstName} ${a.lastName}`)
                          .join(", ")
                      : (ticket as any).assigneeIds.join(", ")}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Configuration */}
          <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white p-3 sm:p-4 md:p-6 shadow-lg sm:shadow-2xl" style={{ boxShadow: '0px 4px 16px rgba(239, 241, 246, 0.8), 0px 8px 24px rgba(239, 241, 246, 1)' }}>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
              <h3 className="font-bold text-[#00a1ff] text-base sm:text-lg">{translate("ticket.configuration")}</h3>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <PriorityRow
                value={ticket.priority}
                busy={!!busy}
                onChange={async (p) => {
                  try {
                    setBusy("priority");
                    const token = await getMaintenanceToken();
                    await patchTicket({ apiBase: apiBase!, token: token || undefined }, ticket.id, { priority: p });
                    await reloadTicket();
                  } catch (err: any) {
                    alert(err?.message ?? "Error updating priority");
                  } finally {
                    setBusy(null);
                  }
                }}
              />

              <CategorySelector t={ticket} apiBase={apiBase!} onChanged={reloadTicket} busy={!!busy} token={currentToken || undefined} />

              <LocationSelector
                value={(() => {
                  // Convert ticket locations to LocationSelector format
                  if (ticket.locations && Array.isArray(ticket.locations)) {
                    return ticket.locations.map(loc => ({
                      category: "API_LOCATIONS" as any,
                      subLocation: (loc.id || loc.location?.id) as any,
                      locationId: loc.id || loc.location?.id,
                      locationTypeId: loc.locationTypeId || loc.location?.locationTypeId,
                    }));
                  } else if (ticket.location) {
                    return [{
                      category: ticket.location.category,
                      subLocation: ticket.location.subLocation,
                      locationId: ticket.location.locationId,
                      locationTypeId: ticket.location.locationTypeId,
                    }];
                  }
                  return [];
                })()}
                onChange={async (locations) => {
                  // Allow clearing all locations
                  const validLocations = locations.filter(loc =>
                    loc.locationId && loc.locationTypeId
                  );

                  try {
                    setBusy("location");
                    const token = await getMaintenanceToken();
                    await patchTicket(
                      { apiBase: apiBase!, token: token || undefined },
                      ticket.id,
                      {
                        locationsIds: validLocations.map(loc => ({
                          locationTypeId: loc.locationTypeId!,
                          locationId: loc.locationId!
                        }))
                      }
                    );
                    await reloadTicket();
                  } catch (err: any) {
                    alert(err?.message ?? "Error updating locations");
                  } finally {
                    setBusy(null);
                  }
                }}
                disabled={!!busy}
                token={currentToken || undefined}
                apiBase={apiBase}
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
          token={currentToken || undefined}
        />

        <AttachmentsDialog
          show={showAttachments}
          ticketId={ticket.id}
          apiBase={apiBase!}
          onClose={() => setShowAttachments(false)}
          existingAttachments={ticket?.attachments || []}
          token={currentToken || undefined}
        />
      </div>
    </div>
  );
}

function TicketDetailPageWithToken() {
  const { getMaintenanceToken } = useApiTokens();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getMaintenanceToken().then(setToken);
  }, [getMaintenanceToken]);

  return (
    <StaticDataProvider apiBase={process.env.NEXT_PUBLIC_API_BASE || ""} token={token || undefined}>
      <TicketDetailPageContent />
    </StaticDataProvider>
  );
}

export default function TicketDetailPage() {
  return <TicketDetailPageWithToken />;
}