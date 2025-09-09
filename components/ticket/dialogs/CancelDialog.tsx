"use client";

import React from "react";

type CancelDialogProps = {
  show: boolean;
  note: string;
  onNoteChange: (note: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CancelDialog({
  show,
  note,
  onNoteChange,
  onCancel,
  onConfirm
}: CancelDialogProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg sm:max-w-2xl w-full shadow-2xl mx-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Cancel Ticket</h3>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex-1">
            <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">Please provide a reason for canceling this ticket:</p>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full p-2 sm:p-3 border-2 border-gray-300 rounded-lg sm:rounded-xl focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10 outline-none transition-all duration-300 resize-none text-sm sm:text-base"
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 justify-end sm:min-w-[120px]">
            <button
              onClick={onConfirm}
              disabled={!note.trim()}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Cancel Ticket
            </button>
            <button
              onClick={onCancel}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}