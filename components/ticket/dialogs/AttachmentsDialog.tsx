"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Attachment } from "../../types/ticket";
import { FilePreviewDialog } from "./FilePreviewDialog";

type AttachmentsDialogProps = {
  show: boolean;
  ticketId: string;
  apiBase: string;
  onClose: () => void;
  existingAttachments?: Attachment[]; // Email attachments from ticket data
};

export function AttachmentsDialog({
  show,
  ticketId,
  apiBase,
  onClose,
  existingAttachments = []
}: AttachmentsDialogProps) {
  const { t, language } = useLanguage();
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Combine existing email attachments with uploaded ones
  const allAttachments = [...existingAttachments, ...uploadedAttachments];

  useEffect(() => {
    if (show && ticketId) {
      loadUploadedAttachments();
    }
  }, [show, ticketId]);

  const loadUploadedAttachments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/attachments`);
      if (response.ok) {
        const result = await response.json();
        setUploadedAttachments(result.data?.attachments || []);
      }
    } catch (error) {
      console.error("Failed to load attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return "🖼️";
    } else if (contentType.includes('pdf')) {
      return "📄";
    } else if (contentType.includes('word') || contentType.includes('doc')) {
      return "📝";
    } else if (contentType.includes('excel') || contentType.includes('sheet')) {
      return "📊";
    } else if (contentType.includes('powerpoint') || contentType.includes('presentation')) {
      return "📽️";
    } else {
      return "📎";
    }
  };

  const getFileTypeLabel = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return language === "es" ? "Imagen" : "Image";
    } else if (contentType.includes('pdf')) {
      return "PDF";
    } else if (contentType.includes('word') || contentType.includes('doc')) {
      return language === "es" ? "Documento" : "Document";
    } else if (contentType.includes('excel') || contentType.includes('sheet')) {
      return language === "es" ? "Hoja de cálculo" : "Spreadsheet";
    } else if (contentType.includes('powerpoint') || contentType.includes('presentation')) {
      return language === "es" ? "Presentación" : "Presentation";
    } else {
      return language === "es" ? "Archivo" : "File";
    }
  };

  const formatFileSize = (size?: number) => {
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    
    if (newFiles.length + selectedFiles.length > 10) {
      alert(language === "es" ? "Máximo 10 archivos permitidos" : "Maximum 10 files allowed");
      return;
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Create preview URLs for images
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviewUrls(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      const formData = new FormData();
      
      selectedFiles.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await loadUploadedAttachments();
        setSelectedFiles([]);
        setPreviewUrls([]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(language === "es" ? "Error al subir archivos" : "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const openFilePreview = (attachment: Attachment) => {
    setPreviewAttachment(attachment);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewAttachment(null);
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewAttachment) return;
    
    const currentIndex = allAttachments.findIndex(att => att.id === previewAttachment.id);
    let newIndex: number;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : allAttachments.length - 1;
    } else {
      newIndex = currentIndex < allAttachments.length - 1 ? currentIndex + 1 : 0;
    }
    
    setPreviewAttachment(allAttachments[newIndex]);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {language === "es" ? "Archivos y Documentos" : "Files and Documents"}
            </h2>
            <button
              onClick={onClose}
              className="text-white/90 hover:text-white text-3xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-blue-50 mt-2 opacity-90">
            {language === "es" 
              ? "Ver archivos del email y subir nuevos documentos"
              : "View email files and upload new documents"
            }
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Email Attachments Section */}
          {existingAttachments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📧 {language === "es" ? "Archivos del Email" : "Email Attachments"}
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {existingAttachments.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {existingAttachments.map((attachment, index) => (
                  <div
                    key={`email-${attachment.id}`}
                    className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openFilePreview(attachment)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl flex-shrink-0">
                        {getFileIcon(attachment.contentType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {attachment.filename}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {getFileTypeLabel(attachment.contentType)}
                        </p>
                        {attachment.size && (
                          <p className="text-xs text-gray-400">
                            {formatFileSize(attachment.size)}
                          </p>
                        )}
                      </div>
                    </div>
                    {attachment.contentType.startsWith('image/') && attachment.url && (
                      <div className="mt-3">
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📎 {language === "es" ? "Subir Nuevos Archivos" : "Upload New Files"}
            </h3>
            
            {/* File Input */}
            <div className="mb-6">
              <label className="block w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  <div className="text-gray-600">
                    <p className="font-medium">
                      {language === "es" ? "Haz clic para seleccionar archivos" : "Click to select files"}
                    </p>
                    <p className="text-sm mt-1">
                      {language === "es" ? "Imágenes, PDFs, documentos, etc." : "Images, PDFs, documents, etc."}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">
                  {language === "es" ? "Archivos Seleccionados" : "Selected Files"}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative border rounded-lg p-3">
                      <button
                        onClick={() => removeSelectedFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                      <div className="text-center">
                        <div className="text-2xl mb-2">{getFileIcon(file.type)}</div>
                        <p className="text-xs truncate font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      {file.type.startsWith('image/') && previewUrls[index] && (
                        <img
                          src={previewUrls[index]}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded mt-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            {selectedFiles.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      {language === "es" ? "Subiendo..." : "Uploading..."}
                    </>
                  ) : (
                    <>
                      📤 {language === "es" ? "Subir Archivos" : "Upload Files"}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Uploaded Attachments */}
          {uploadedAttachments.length > 0 && (
            <div className="border-t pt-8 mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                ☁️ {language === "es" ? "Archivos Subidos" : "Uploaded Files"}
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  {uploadedAttachments.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedAttachments.map((attachment, index) => (
                  <div
                    key={`uploaded-${attachment.id}`}
                    className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openFilePreview(attachment)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl flex-shrink-0">
                        {getFileIcon(attachment.contentType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {attachment.filename}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {getFileTypeLabel(attachment.contentType)}
                        </p>
                        {attachment.size && (
                          <p className="text-xs text-gray-400">
                            {formatFileSize(attachment.size)}
                          </p>
                        )}
                        {attachment.uploadedByName && (
                          <p className="text-xs text-blue-600 mt-1">
                            {language === "es" ? "Por" : "By"} {attachment.uploadedByName}
                          </p>
                        )}
                      </div>
                    </div>
                    {attachment.contentType.startsWith('image/') && attachment.url && (
                      <div className="mt-3">
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Preview Dialog */}
      <FilePreviewDialog
        show={showPreview}
        attachment={previewAttachment}
        onClose={closePreview}
        onNavigate={allAttachments.length > 1 ? navigatePreview : undefined}
        showNavigation={allAttachments.length > 1}
      />
    </div>
  );
}