"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Person, UICategory } from "../types/ticket";
import { searchPersons } from "../api/ticketApi";
import { useStaticData } from "../context/StaticDataContext";

interface DashboardFiltersProps {
  apiBase: string;
  token?: string;
  assigneeId?: string;
  subcategoryDisplayName?: string;
  onAssigneeChange: (assigneeId: string | undefined) => void;
  onSubcategoryChange: (subcategoryDisplayName: string | undefined) => void;
  onClear: () => void;
}

export function DashboardFilters({
  apiBase,
  token,
  assigneeId,
  subcategoryDisplayName,
  onAssigneeChange,
  onSubcategoryChange,
  onClear,
}: DashboardFiltersProps) {
  const { language } = useLanguage();
  const { categories } = useStaticData();
  const [personQuery, setPersonQuery] = useState("");
  const [personOptions, setPersonOptions] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  // Get all subcategories from all categories
  const allSubcategories = categories.flatMap((cat) =>
    cat.subcats.map((sub) => ({
      displayName: sub.displayName,
      categoryName: cat.displayName,
    }))
  );

  // Search persons when query changes
  useEffect(() => {
    if (personQuery.length < 2) {
      setPersonOptions([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      try {
        const results = await searchPersons(apiBase, personQuery, token);
        setPersonOptions(results);
        setShowPersonDropdown(true);
      } catch (error) {
        console.error("Error searching persons:", error);
        setPersonOptions([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [personQuery, apiBase, token]);

  const handlePersonSelect = (person: Person) => {
    setSelectedPerson(person);
    setPersonQuery(`${person.firstName} ${person.lastName}`);
    onAssigneeChange(person.id);
    setShowPersonDropdown(false);
  };

  const handleClearPerson = () => {
    setSelectedPerson(null);
    setPersonQuery("");
    onAssigneeChange(undefined);
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onSubcategoryChange(value || undefined);
  };

  const hasFilters = assigneeId || subcategoryDisplayName;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-end">
        {/* Assignee Filter */}
        <div className="flex-1 min-w-0 relative">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {language === "es" ? "Asignado a" : "Assigned to"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={personQuery}
              onChange={(e) => {
                setPersonQuery(e.target.value);
                if (!e.target.value) {
                  handleClearPerson();
                }
              }}
              onFocus={() => setShowPersonDropdown(true)}
              placeholder={
                language === "es" ? "Buscar persona..." : "Search person..."
              }
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {selectedPerson && (
              <button
                onClick={handleClearPerson}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            {showPersonDropdown && personOptions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {personOptions.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handlePersonSelect(person)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    {person.firstName} {person.lastName}
                    {person.email && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({person.email})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subcategory Filter */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {language === "es" ? "Subcategoría" : "Subcategory"}
          </label>
          <select
            value={subcategoryDisplayName || ""}
            onChange={handleSubcategoryChange}
            className="w-full px-2 py-1.5 sm:px-3 sm:py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">
              {language === "es"
                ? "Todas las subcategorías"
                : "All subcategories"}
            </option>
            {allSubcategories.map((sub, idx) => (
              <option key={`${sub.displayName}-${idx}`} value={sub.displayName}>
                {sub.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Button */}
        {hasFilters && (
          <div>
            <button
              onClick={onClear}
              className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {language === "es" ? "Limpiar" : "Clear"}
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
          <span className="block sm:inline mb-1 sm:mb-0">
            {language === "es" ? "Filtros activos: " : "Active filters: "}
          </span>
          <div className="flex flex-wrap gap-1 sm:gap-2 sm:inline">
            {selectedPerson && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 sm:py-1 text-xs rounded">
                {language === "es" ? "Asignado a: " : "Assigned to: "}
                {selectedPerson.firstName} {selectedPerson.lastName}
              </span>
            )}
            {subcategoryDisplayName && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 sm:py-1 text-xs rounded">
                {language === "es" ? "Subcategoría: " : "Subcategory: "}
                {subcategoryDisplayName}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
