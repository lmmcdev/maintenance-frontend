"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

interface DateFiltersProps {
  createdFrom?: Date;
  createdTo?: Date;
  onDateFromChange: (date: Date | undefined) => void;
  onDateToChange: (date: Date | undefined) => void;
  onClear: () => void;
}

export function DateFilters({
  createdFrom,
  createdTo,
  onDateFromChange,
  onDateToChange,
  onClear,
}: DateFiltersProps) {
  const { language } = useLanguage();

  const formatDateForInput = (date?: Date) => {
    if (!date) return "";
    return date.toISOString().split('T')[0];
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      // Create date from YYYY-MM-DD input
      const date = new Date(value + 'T00:00:00');
      onDateFromChange(date);
    } else {
      onDateFromChange(undefined);
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      // Create date from YYYY-MM-DD input
      const date = new Date(value + 'T23:59:59');
      onDateToChange(date);
    } else {
      onDateToChange(undefined);
    }
  };

  const hasFilters = createdFrom || createdTo;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {language === "es" ? "Desde" : "From"}
          </label>
          <input
            type="date"
            value={formatDateForInput(createdFrom)}
            onChange={handleFromChange}
            className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {language === "es" ? "Hasta" : "To"}
          </label>
          <input
            type="date"
            value={formatDateForInput(createdTo)}
            onChange={handleToChange}
            className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          {hasFilters && (
            <button
              onClick={onClear}
              className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {language === "es" ? "Limpiar" : "Clear"}
            </button>
          )}

          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => {
                const today = new Date();
                const startOfDay = new Date(today);
                startOfDay.setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(today);
                endOfDay.setUTCHours(23, 59, 59, 999);
                onDateFromChange(startOfDay);
                onDateToChange(endOfDay);
              }}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
            >
              {language === "es" ? "Hoy" : "Today"}
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const endOfDay = new Date(today);
                endOfDay.setUTCHours(23, 59, 59, 999);

                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                weekAgo.setUTCHours(0, 0, 0, 0);

                onDateFromChange(weekAgo);
                onDateToChange(endOfDay);
              }}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
            >
              {language === "es" ? "7d" : "7d"}
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const endOfDay = new Date(today);
                endOfDay.setUTCHours(23, 59, 59, 999);

                const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                monthAgo.setUTCHours(0, 0, 0, 0);

                onDateFromChange(monthAgo);
                onDateToChange(endOfDay);
              }}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
            >
              {language === "es" ? "30d" : "30d"}
            </button>
          </div>
        </div>
      </div>

      {hasFilters && (
        <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
          <span className="block sm:inline mb-1 sm:mb-0">
            {language === "es" ? "Filtros activos: " : "Active filters: "}
          </span>
          <div className="flex flex-wrap gap-1 sm:gap-2 sm:inline">
            {createdFrom && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 sm:py-1 text-xs rounded">
                {language === "es" ? "Desde " : "From "}{createdFrom.toLocaleDateString()}
              </span>
            )}
            {createdTo && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 sm:py-1 text-xs rounded">
                {language === "es" ? "Hasta " : "To "}{createdTo.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}