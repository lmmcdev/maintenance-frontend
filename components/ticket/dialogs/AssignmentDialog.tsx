"use client";

import React from "react";

type AssignmentDialogProps = {
  show: boolean;
  names: string[];
  isReassign: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AssignmentDialog({
  show,
  names,
  isReassign,
  onCancel,
  onConfirm
}: AssignmentDialogProps) {
  if (!show) return null;

  const personText = names.length === 1 
    ? names[0] 
    : `${names.length} people (${names.slice(0, 2).join(", ")}${names.length > 2 ? `, and ${names.length - 2} more` : ""})`;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-xs sm:max-w-md w-full shadow-2xl mx-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
          {isReassign ? "Reassign Ticket" : "Assign Ticket"}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
          {isReassign 
            ? `Are you sure you want to reassign this ticket to ${personText}? The ticket will remain in Open status.`
            : `Are you sure you want to assign this ticket to ${personText}? The status will change to Open.`
          }
        </p>
        
        {/* Show selected people list if more than 1 */}
        {names.length > 1 && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Selected assignees:</p>
            <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
              {names.map((name, index) => (
                <li key={name} className="flex items-center gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#00A1FF] text-white rounded-lg hover:bg-[#0081cc] transition-colors order-1 sm:order-2"
          >
            {isReassign ? "Reassign" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}