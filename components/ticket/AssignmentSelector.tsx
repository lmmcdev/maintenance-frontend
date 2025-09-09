"use client";

import React, { useState, useRef, useEffect } from "react";

type AssignmentSelectorProps = {
  selectedNames: string[];
  onChange: (names: string[]) => void;
  disabled: boolean;
  canAssign: boolean;
  isReassignment?: boolean;
  peopleList: string[];
};

export function AssignmentSelector({
  selectedNames,
  onChange,
  disabled,
  canAssign,
  isReassignment,
  peopleList
}: AssignmentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredPeople = peopleList.filter(person =>
    person.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handlePersonToggle = (person: string) => {
    const newSelected = selectedNames.includes(person)
      ? selectedNames.filter(name => name !== person)
      : [...selectedNames, person];
    
    onChange(newSelected);
  };

  const handleAssignClick = () => {
    if (!canAssign) {
      alert("Complete category and priority before assigning.");
      return;
    }
    if (selectedNames.length === 0) return;
    
    // Trigger assignment process
    onChange(selectedNames);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="text-gray-600 text-xs sm:text-sm min-w-[48px] sm:min-w-[64px] font-semibold">Assign:</span>
      <div className="flex-1 relative" ref={containerRef}>
        {/* Main button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full rounded-lg sm:rounded-xl border-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm font-medium outline-none transition-all duration-300 bg-white hover:border-[#00A1FF]/30 focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10 shadow-sm hover:shadow-md focus:shadow-lg text-left flex items-center justify-between disabled:bg-gray-50 disabled:border-gray-200 disabled:cursor-not-allowed disabled:text-gray-400 border-gray-300 text-gray-700"
        >
          <span>
            {selectedNames.length === 0 
              ? (isReassignment ? "Reassign to..." : "Select assignee(s)...") 
              : selectedNames.length === 1 
                ? selectedNames[0]
                : `${selectedNames.length} people selected`
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

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl overflow-visible">
            {/* Search box */}
            <div className="p-2 sm:p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:border-[#00A1FF] focus:ring-1 focus:ring-[#00A1FF]/20 outline-none"
                autoFocus
              />
            </div>

            {/* People list */}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto">
              {filteredPeople.map((person, index) => (
                <div
                  key={person}
                  onClick={() => handlePersonToggle(person)}
                  className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 cursor-pointer transition-colors duration-150 ${
                    selectedNames.includes(person) ? 'bg-[#00A1FF]/10 hover:bg-[#00A1FF]/20' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedNames.includes(person)}
                    onChange={() => handlePersonToggle(person)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-[#00A1FF] border-gray-300 rounded focus:ring-[#00A1FF]/20 focus:ring-2"
                  />
                  <span className={`text-xs sm:text-sm flex-1 ${
                    selectedNames.includes(person) ? 'text-[#00A1FF] font-medium' : 'text-gray-700'
                  }`}>{person}</span>
                </div>
              ))}
              
              {filteredPeople.length === 0 && (
                <div className="px-2 sm:px-3 py-4 text-xs sm:text-sm text-gray-500 text-center">
                  No people found
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedNames.length > 0 && (
              <div className="border-t border-gray-100 p-2 sm:p-3 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    onChange([]);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs sm:text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleAssignClick}
                  className="px-3 py-1.5 text-xs sm:text-sm bg-[#00A1FF] text-white rounded-md hover:bg-[#0081cc] transition-colors"
                >
                  {isReassignment ? 'Reassign' : 'Assign'} ({selectedNames.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}