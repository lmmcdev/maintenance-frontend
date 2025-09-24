"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Person } from "../types/ticket";

type AssignmentSelectorProps = {
  selectedNames: string[];
  onChange: (names: string[]) => void;
  onAssign?: (names: string[]) => void;
  disabled: boolean;
  canAssign: boolean;
  isReassignment?: boolean;
  persons: Person[];
};

export function AssignmentSelector({
  selectedNames,
  onChange,
  onAssign,
  disabled,
  canAssign,
  isReassignment,
  persons
}: AssignmentSelectorProps) {
  const { t: translate, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredPeople = persons.filter(person => {
    const fullName = `${person.firstName} ${person.lastName}`;
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
           !selectedNames.includes(fullName); // Filter out already selected people
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePersonSelect = (person: Person) => {
    if (!canAssign) {
      alert("Complete category and priority before assigning.");
      return;
    }

    const fullName = `${person.firstName} ${person.lastName}`;
    // Add person to selection and trigger assignment immediately
    const newSelected = [...selectedNames, fullName];
    onChange(newSelected);

    // Trigger assignment process immediately
    if (onAssign) {
      onAssign(newSelected);
    }

    // Clear search and close dropdown after assignment
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleAssignClick = () => {
    // Since assignment is now automatic, this just closes the dropdown
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-gray-600 text-xs sm:text-sm min-w-[48px] sm:min-w-[64px] font-semibold">{translate("assign")}:</span>
      <div className="flex-1 relative" ref={containerRef}>
        {/* Main button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full rounded-lg sm:rounded-xl border-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium outline-none transition-all duration-300 bg-white hover:border-[#00A1FF]/30 focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10 shadow-sm hover:shadow-md focus:shadow-lg text-left flex items-center justify-between disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 border-gray-300 text-gray-700"
        >
          <span>
            {selectedNames.length === 0
              ? (isReassignment
                  ? (language === "es" ? "Reasignar a..." : "Reassign to...")
                  : (language === "es" ? "Seleccionar asignado(s)..." : "Select assignee(s)..."))
              : selectedNames.length === 1
                ? selectedNames[0]
                : (() => {
                    const joinedNames = selectedNames.join(", ");
                    if (joinedNames.length > 50) {
                      return `${selectedNames.length} ${language === "es" ? "personas seleccionadas" : "people selected"}`;
                    } else {
                      return joinedNames;
                    }
                  })()
            }
          </span>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-300' : 'text-gray-500'}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Selected people chips */}
        {selectedNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedNames.map((person, index) => (
              <div
                key={`${person}-${index}`}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
              >
                <span>{person}</span>
                <button
                  onClick={() => {
                    const newSelected = selectedNames.filter((_, i) => i !== index);
                    onChange(newSelected);

                    // Trigger assignment with updated list
                    if (onAssign) {
                      onAssign(newSelected);
                    }
                  }}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  disabled={disabled}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-[60] w-full bottom-full mb-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl overflow-visible">
            {/* Search box */}
            <div className="p-2 sm:p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder={language === "es" ? "Buscar personas..." : "Search people..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-[#00A1FF] focus:ring-1 focus:ring-[#00A1FF]/20 outline-none"
                autoFocus
              />
            </div>

            {/* People list */}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto">
              {filteredPeople.map((person) => (
                <button
                  key={person.id}
                  onClick={() => handlePersonSelect(person)}
                  className="w-full flex items-center px-2 sm:px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors duration-150 text-left"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-3 flex-shrink-0 bg-gray-200">
                    {person.profilePhoto?.url ? (
                      <img
                        src={person.profilePhoto.url}
                        alt={`${person.firstName} ${person.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Hide broken image and show placeholder
                          e.currentTarget.style.display = 'none';
                          const placeholder = e.currentTarget.nextElementSibling as HTMLDivElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${person.profilePhoto?.url ? 'hidden' : 'flex'}`}>
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 flex-1">
                    {person.firstName} {person.lastName}
                  </span>
                </button>
              ))}

              {filteredPeople.length === 0 && (
                <div className="px-2 sm:px-3 py-4 text-xs sm:text-sm text-gray-500 text-center">
                  {language === "es" ? "No se encontraron personas" : "No people found"}
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedNames.length > 0 && (
              <div className="border-t border-gray-100 p-2 sm:p-3 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    onChange([]);

                    // Trigger assignment with empty list (unassign)
                    if (onAssign) {
                      onAssign([]);
                    }

                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {language === "es" ? "Limpiar" : "Clear"}
                </button>
                <button
                  onClick={handleAssignClick}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  {language === "es" ? "Cerrar" : "Close"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}