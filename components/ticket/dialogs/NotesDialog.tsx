"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

type TicketNote = {
  id: string;
  content: string;
  type: 'general' | 'cancellation' | 'status_change' | 'assignment' | 'resolution';
  createdAt: string;
  createdBy?: string;
  createdByName?: string;
};

type NotesDialogProps = {
  show: boolean;
  ticketId: string;
  apiBase: string;
  onClose: () => void;
};

export function NotesDialog({
  show,
  ticketId,
  apiBase,
  onClose
}: NotesDialogProps) {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (show && ticketId) {
      loadNotes();
    }
  }, [show, ticketId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/notes`);
      if (response.ok) {
        const result = await response.json();
        setNotes(result.data?.notes || []);
      }
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setAdding(true);
      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNote.trim(),
          type: "general"
        }),
      });
      
      if (response.ok) {
        setNewNote("");
        await loadNotes(); // Reload notes
      }
    } catch (error) {
      console.error("Failed to add note:", error);
      alert(t("notes.error.add"));
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cancellation': return 'bg-red-100 text-red-800';
      case 'status_change': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-green-100 text-green-800';
      case 'resolution': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl mx-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t("notes.title")}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notes List */}
        <div className="mb-4 max-h-80 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-4 text-gray-500">{t("notes.loading")}</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-4 text-gray-500">{t("notes.empty")}</div>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(note.type)}`}>
                    {note.type}
                  </span>
                  <div className="text-xs text-gray-500">
                    {note.createdByName && `${note.createdByName} • `}
                    {formatDate(note.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add New Note */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("notes.add.title")}
          </label>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={t("notes.add.placeholder")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10 outline-none transition-all duration-300 resize-none text-sm"
            rows={3}
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={addNote}
              disabled={!newNote.trim() || adding}
              className="px-4 py-2 bg-[#00A1FF] text-white rounded-lg hover:bg-[#0091e6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {adding ? t("notes.add.adding") : t("notes.add.button")}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {t("close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}