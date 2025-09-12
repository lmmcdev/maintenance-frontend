"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "es";

type Translations = {
  en: Record<string, string>;
  es: Record<string, string>;
};

const translations: Translations = {
  en: {
    // Header
    tickets: "Tickets",
    "ticket.reporter": "Reported by: ",
    dashboard: "Dashboard",
    "tickets.subtitle":
      "Create, categorize, prioritize, assign and follow up maintenance tickets.",
    "dashboard.subtitle": "Quick overview of ticket counts and priorities.",

    // Status
    "status.new": "NEW",
    "status.open": "OPEN",
    "status.done": "DONE",
    "status.cancelled": "CANCELLED",

    // Priority
    "priority.urgent": "URGENT",
    "priority.high": "HIGH",
    "priority.medium": "MEDIUM",
    "priority.low": "LOW",
    priority: "Priority:",

    // Assignment
    assign: "Assign",
    "assign.to": "Select assignee(s)...",
    "reassign.to": "Reassign to...",
    "people.selected": "people selected",
    people: "people",
    "categories.selected": "categories selected",
    "search.people": "Search people...",
    "search.categories": "Search categories...",
    "no.people.found": "No people found",
    "no.categories.found": "No categories found",
    clear: "Clear",
    "assign.button": "Assign",
    "reassign.button": "Reassign",
    "assignee.not.found": "Assignee not found in directory.",

    // Category
    category: "Category:",
    "category.select": "Select category...",

    // Dialogs
    "cancel.ticket": "Cancel Ticket",
    "cancel.ticket.reason":
      "Please provide a reason for canceling this ticket:",
    "cancel.reason.placeholder": "Enter cancellation reason...",
    "assign.ticket": "Assign Ticket",
    "reassign.ticket": "Reassign Ticket",
    "assign.confirm": "Are you sure you want to assign this ticket to",
    "reassign.confirm": "Are you sure you want to reassign this ticket to",
    "status.change.open": "The status will change to Open.",
    "status.remain.open": "The ticket will remain in Open status.",
    "selected.assignees": "Selected assignees:",
    cancel: "Cancel",

    // Actions
    "mark.completed": "Mark as Completed",
    "close.ticket": "Close this ticket",
    "cancel.ticket.action": "Cancel Ticket",
    "archive.without.completion": "Archive without completion",
    "reopen.ticket": "Reopen Ticket",
    "set.status.open": "Set status back to Open",

    // Messages
    "complete.category.priority":
      "Complete category and priority to enable assignment",
    "loading.tickets": "Loading tickets...",
    error: "Error",
    "error.assigning.ticket": "Error assigning ticket",
    "error.marking.done": "Error marking done",
    "error.reopening": "Error reopening",
    "error.canceling": "Error canceling",
    "error.updating.subcategory": "Error updating subcategory",
    "error.updating.priority": "Error updating priority",
    "no.tickets.found": "No tickets found",
    "no.tickets.moment": "There are no {status} tickets at the moment.",
    created: "Created:",
    "assigned.to": "Assigned to:",
    audio: "Audio",
    "no.audio.file": "No audio file available",
    "audio.invalid": "Audio file unavailable",

    // Confirmations

    // Status descriptions
    "ready.assignment": "Ready for assignment",
    "in.progress": "In progress",
    completed: "Completed",

    // Actions

    // Dashboard
    "new.tickets": "New Tickets",
    "open.tickets": "Open Tickets",
    "done.tickets": "Done Tickets",
    "priority.distribution": "Priority Distribution",
    "priority.breakdown": "Breakdown of tickets by priority level",
    "category.distribution": "Category Distribution",
    "category.breakdown": "Breakdown of tickets by category",
    "categories.total": "Categories",
    "avg.per.category": "Avg per Category",
    "most.common": "Most Common",
    "assignee.distribution": "Assignee Distribution",
    "assignee.breakdown": "Breakdown of tickets by assignee",
    "assignees.total": "Assignees",
    "avg.per.assignee": "Avg per Assignee",
    "top.assignee": "Top Assignee",
    "no.assignees.found": "No assignees found",

    // Configuration
    "ticket.configuration": "Ticket Configuration",

    // Actions menu
    "ticket.actions": "Ticket actions",
    actions: "Actions",

    // Button labels
    "button.done": "Done",
    "button.cancel": "Cancel",
    "button.details": "Details", 
    "button.notes": "Notes",

    // Notes
    "notes.title": "Ticket Notes",
    "notes.subtitle": "View and manage ticket notes",
    "notes.history": "Notes History",
    "notes.loading": "Loading notes...",
    "notes.empty": "No notes yet",
    "notes.empty.subtitle": "Add your first note below",
    "notes.add.title": "Add New Note",
    "notes.add.placeholder": "Enter your note...",
    "notes.add.button": "Add Note",
    "notes.add.adding": "Adding...",
    "notes.error.add": "Failed to add note",
    "more.options": "More options",
    "view.cancelled.tickets": "View cancelled tickets",
    close: "Close",
    
    // Details
    details: "Details",
    "ticket.details": "Ticket Details",
    "ticket.information": "Ticket Information",
    description: "Description",
    phone: "Phone",
  },
  es: {
    // Header
    tickets: "Tickets",
    "ticket.reporter": "Reportado por: ",
    dashboard: "Tablero",
    "tickets.subtitle":
      "Crear, categorizar, priorizar, asignar y dar seguimiento a tickets de mantenimiento.",
    "dashboard.subtitle": "Vista rápida del conteo de tickets y prioridades.",

    // Status
    "status.new": "NUEVO",
    "status.open": "ABIERTO",
    "status.done": "TERMINADO",
    "status.cancelled": "CANCELADO",

    // Priority
    "priority.urgent": "URGENTE",
    "priority.high": "ALTO",
    "priority.medium": "MEDIO",
    "priority.low": "BAJO",
    priority: "Prioridad:",

    // Assignment
    assign: "Asignar",
    "assign.to": "Seleccionar asignado(s)...",
    "reassign.to": "Reasignar a...",
    "people.selected": "personas seleccionadas",
    people: "personas",
    "categories.selected": "categorías seleccionadas",
    "search.people": "Buscar personas...",
    "search.categories": "Buscar categorías...",
    "no.people.found": "No se encontraron personas",
    "no.categories.found": "No se encontraron categorías",
    clear: "Limpiar",
    "assign.button": "Asignar",
    "reassign.button": "Reasignar",
    "assignee.not.found": "Asignado no encontrado en el directorio.",

    // Category
    category: "Categoría:",
    "category.select": "Seleccionar categoría...",

    // Dialogs
    // "cancel.ticket": "Cancelar Ticket",
    "cancel.ticket.reason":
      "Por favor proporciona una razón para cancelar este ticket:",
    "cancel.reason.placeholder": "Ingresa la razón de cancelación...",
    "assign.ticket": "Asignar Ticket",
    "reassign.ticket": "Reasignar Ticket",
    "assign.confirm": "¿Estás seguro que quieres asignar este ticket a",
    "reassign.confirm": "¿Estás seguro que quieres reasignar este ticket a",
    "status.change.open": "El estado cambiará a Abierto.",
    "status.remain.open": "El ticket permanecerá en estado Abierto.",
    "selected.assignees": "Asignados seleccionados:",
    cancel: "Cancelar",

    // Actions
    "mark.completed": "Marcar como Completado",
    "close.ticket": "Cerrar este ticket",
    "cancel.ticket.action": "Cancelar Ticket",
    "archive.without.completion": "Archivar sin completar",
    "reopen.ticket": "Reabrir Ticket",
    "set.status.open": "Cambiar estado a Abierto",

    // Messages
    "complete.category.priority":
      "Completa categoría y prioridad para habilitar asignación",
    "loading.tickets": "Cargando tickets...",
    error: "Error",
    "error.assigning.ticket": "Error asignando ticket",
    "error.marking.done": "Error marcando como terminado",
    "error.reopening": "Error reabriendo",
    "error.canceling": "Error cancelando",
    "error.updating.subcategory": "Error actualizando subcategoría",
    "error.updating.priority": "Error actualizando prioridad",
    "no.tickets.found": "No se encontraron tickets",
    "no.tickets.moment": "No hay tickets {status} en este momento.",
    created: "Creado:",
    "assigned.to": "Asignado a:",
    audio: "Audio",
    "no.audio.file": "No hay archivo de audio disponible",
    "audio.invalid": "Archivo de audio no disponible",

    // Confirmations
    "cancel.ticket": "Cancelar Ticket",

    // Status descriptions
    "ready.assignment": "Listos para asignar",
    "in.progress": "En progreso",
    completed: "Completados",

    // Actions

    // Dashboard
    "new.tickets": "Tickets Nuevos",
    "open.tickets": "Tickets Abiertos",
    "done.tickets": "Tickets Terminados",
    "priority.distribution": "Distribución de Prioridades",
    "priority.breakdown": "Desglose de tickets por nivel de prioridad",
    "category.distribution": "Distribución de Categorías",
    "category.breakdown": "Desglose de tickets por categoría",
    "categories.total": "Categorías",
    "avg.per.category": "Promedio por Categoría",
    "most.common": "Más Común",
    "assignee.distribution": "Distribución de Asignados",
    "assignee.breakdown": "Desglose de tickets por asignado",
    "assignees.total": "Asignados",
    "avg.per.assignee": "Promedio por Asignado",
    "top.assignee": "Top Asignado",
    "no.assignees.found": "No se encontraron asignados",

    // Configuration
    "ticket.configuration": "Configuración del Ticket",

    // Actions menu
    "ticket.actions": "Acciones del ticket",
    actions: "Acciones",

    // Button labels
    "button.done": "Terminado",
    "button.cancel": "Cancelar", 
    "button.details": "Detalles",
    "button.notes": "Notas",

    // Notes
    "notes.title": "Notas del Ticket",
    "notes.subtitle": "Ver y gestionar notas del ticket",
    "notes.history": "Historial de Notas",
    "notes.loading": "Cargando notas...",
    "notes.empty": "Sin notas aún",
    "notes.empty.subtitle": "Agrega tu primera nota abajo",
    "notes.add.title": "Agregar Nueva Nota",
    "notes.add.placeholder": "Ingresa tu nota...",
    "notes.add.button": "Agregar Nota",
    "notes.add.adding": "Agregando...",
    "notes.error.add": "Error al agregar nota",
    "more.options": "Más opciones",
    "view.cancelled.tickets": "Ver tickets cancelados",
    close: "Cerrar",
    
    // Details
    details: "Detalles",
    "ticket.details": "Detalles del Ticket",
    "ticket.information": "Información del Ticket",
    description: "Descripción",
    phone: "Teléfono",
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  // Load language from URL params or localStorage
  useEffect(() => {
    // Check URL params first
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get("lang") as Language;
      if (urlLang && (urlLang === "en" || urlLang === "es")) {
        setLanguage(urlLang);
        return;
      }
    }
    
    // Fallback to localStorage
    const savedLang = localStorage.getItem("language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "es")) {
      setLanguage(savedLang);
    }
  }, []);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string, vars?: Record<string, string>) => {
    let translation =
      translations[language][key] || translations["en"][key] || key;

    // Replace variables in translation
    if (vars) {
      Object.entries(vars).forEach(([varKey, varValue]) => {
        translation = translation.replace(`{${varKey}}`, varValue);
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
