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
  attachments?: {
    id: string;
    filename: string;
    contentType: string;
    size?: number;
    url?: string;
  }[];
};

type NotesDialogProps = {
  show: boolean;
  ticketId: string;
  apiBase: string;
  onClose: () => void;
  token?: string;
};

export function NotesDialog({
  show,
  ticketId,
  apiBase,
  onClose,
  token
}: NotesDialogProps) {
  const { t } = useLanguage();
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  useEffect(() => {
    if (show && ticketId) {
      loadNotes();
    }
  }, [show, ticketId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/notes`, { headers });
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length + selectedImages.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setSelectedImages(prev => [...prev, ...imageFiles]);

    // Create preview URLs
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImages(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    const formData = new FormData();
    selectedImages.forEach((file, index) => {
      formData.append(`images`, file);
    });

    try {
      setUploading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/attachments`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.data?.attachmentIds || [];
      }
      throw new Error("Upload failed");
    } catch (error) {
      console.error("Failed to upload images:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() && selectedImages.length === 0) return;
    
    try {
      setAdding(true);
      
      // Upload images first if any
      let attachmentIds: string[] = [];
      if (selectedImages.length > 0) {
        attachmentIds = await uploadImages();
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: newNote.trim() || "Image attachment",
          type: "general",
          attachmentIds
        }),
      });
      
      if (response.ok) {
        setNewNote("");
        setSelectedImages([]);
        setPreviewImages([]);
        await loadNotes(); // Reload notes
      }
    } catch (error) {
      console.error("Failed to add note:", error);
      alert("Failed to add note with images");
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cancellation': return 'bg-gradient-to-r from-red-50 to-red-100/50 text-red-700 border border-red-200/60';
      case 'status_change': return 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 border border-blue-200/60';
      case 'assignment': return 'bg-gradient-to-r from-green-50 to-green-100/50 text-green-700 border border-green-200/60';
      case 'resolution': return 'bg-gradient-to-r from-purple-50 to-purple-100/50 text-purple-700 border border-purple-200/60';
      default: return 'bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-700 border border-gray-200/60';
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative flex items-center justify-center min-h-full p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-hidden mx-2 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00a1ff] rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t("notes.title")}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">{t("notes.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notes List */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl sm:rounded-2xl border border-gray-200/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
              <h4 className="font-bold text-[#00a1ff] text-sm sm:text-base">{t("notes.history")}</h4>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {loading ? (
                <div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-[#00a1ff] rounded-full animate-spin"></div>
                  <span className="text-sm">{t("notes.loading")}</span>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium">{t("notes.empty")}</p>
                  <p className="text-xs text-gray-400 mt-1">{t("notes.empty.subtitle")}</p>
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getTypeColor(note.type)} shadow-sm`}>
                        {note.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <div className="text-xs text-gray-500 font-medium text-right">
                        {note.createdByName && (
                          <div className="text-gray-700 font-semibold">{note.createdByName}</div>
                        )}
                        <div className="mt-0.5">{formatDate(note.createdAt)}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    
                    {/* Image attachments */}
                    {note.attachments && note.attachments.length > 0 && (
                      <div className="mt-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {note.attachments.filter(att => att.contentType.startsWith('image/')).map((attachment) => (
                            <div key={attachment.id} className="relative group">
                              <img
                                src={attachment.url || `${apiBase}/api/v1/tickets/${ticketId}/attachments/${attachment.id}`}
                                alt={attachment.filename}
                                className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200"
                                onClick={() => {
                                  // Open in modal/lightbox
                                  window.open(attachment.url || `${apiBase}/api/v1/tickets/${ticketId}/attachments/${attachment.id}`, '_blank');
                                }}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="truncate">{attachment.filename}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add New Note */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl sm:rounded-2xl border border-blue-200/60 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
            <h4 className="font-bold text-[#00a1ff] text-sm sm:text-base">{t("notes.add.title")}</h4>
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={t("notes.add.placeholder")}
            className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-xl focus:border-[#00A1FF] focus:ring-2 focus:ring-[#00A1FF]/10 outline-none transition-all duration-300 resize-none text-sm bg-white shadow-sm hover:shadow-md"
            rows={3}
          />
          
          {/* Image Preview Section */}
          {previewImages.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600 font-medium">Selected Images ({previewImages.length}/5)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {previewImages.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-16 sm:h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg">
                      <div className="truncate">{selectedImages[index]?.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
            {/* Image Upload Button */}
            <label className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-1 cursor-pointer">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add Images
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={adding || uploading}
              />
            </label>

            <button
              onClick={addNote}
              disabled={(!newNote.trim() && selectedImages.length === 0) || adding || uploading}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-[#00a1ff] text-white border border-[#00a1ff] rounded-lg hover:bg-[#0091e6] hover:border-[#0091e6] disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-1"
            >
              {adding ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t("notes.add.adding")}</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{t("notes.add.button")}</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-200 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-300 hover:border-gray-400 hover:text-gray-800 transition-all duration-300 text-xs font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{t("close")}</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}