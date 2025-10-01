"use client";

import React from "react";
import { Ticket } from "../types/ticket";
import { useLanguage } from "../context/LanguageContext";
import Link from "next/link";

type FilteredTicketsListProps = {
  tickets: Ticket[];
  hasActiveFilters: boolean;
};

export function FilteredTicketsList({ tickets, hasActiveFilters }: FilteredTicketsListProps) {
  const { language } = useLanguage();

  // Don't show if no active filters
  if (!hasActiveFilters) {
    return null;
  }

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "OPEN":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DONE":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSubcategoryDisplay = (subcategory: Ticket["subcategory"]) => {
    if (!subcategory) return null;
    if (typeof subcategory === "object") {
      return subcategory.displayName || subcategory.name;
    }
    return subcategory;
  };

  return (
    <section className="mt-6">
      <div className="rounded-xl sm:rounded-2xl border border-gray-200/60 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
              {language === "es" ? "Tickets Filtrados" : "Filtered Tickets"}
            </h2>
            <span className="text-xs sm:text-sm font-bold text-blue-600 bg-blue-100 px-2 sm:px-3 py-1 rounded-full">
              {tickets.length} {language === "es" ? "resultados" : "results"}
            </span>
          </div>
        </div>

        {/* Tickets List */}
        <div className="divide-y divide-gray-100">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="font-medium">
                {language === "es" ? "No se encontraron tickets" : "No tickets found"}
              </p>
              <p className="text-sm mt-1">
                {language === "es"
                  ? "Intenta ajustar los filtros"
                  : "Try adjusting the filters"}
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block p-3 sm:p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  {/* Left side - Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
                        {ticket.title}
                      </h3>
                    </div>

                    {ticket.description && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Status */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>

                      {/* Priority */}
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>

                      {/* Category/Subcategory */}
                      {getSubcategoryDisplay(ticket.subcategory) && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                          {getSubcategoryDisplay(ticket.subcategory)}
                        </span>
                      )}

                      {/* Assignee */}
                      {ticket.assignee && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                          {ticket.assignee.firstName} {ticket.assignee.lastName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side - Date */}
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
