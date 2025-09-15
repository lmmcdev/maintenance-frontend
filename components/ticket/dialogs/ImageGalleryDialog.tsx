"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

type ImageAttachment = {
  id: string;
  filename: string;
  contentType: string;
  size?: number;
  url?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  uploadedByName?: string;
};

type ImageGalleryDialogProps = {
  show: boolean;
  ticketId: string;
  apiBase: string;
  onClose: () => void;
  token?: string;
};

export function ImageGalleryDialog({
  show,
  ticketId,
  apiBase,
  onClose,
  token
}: ImageGalleryDialogProps) {
  const { t, language } = useLanguage();
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (show && ticketId) {
      loadImages();
    }
  }, [show, ticketId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(`${apiBase}/api/v1/tickets/${ticketId}/attachments`, { headers });
      if (response.ok) {
        const result = await response.json();
        const imageAttachments = (result.data?.attachments || []).filter(
          (att: any) => att.contentType.startsWith('image/')
        );
        setImages(imageAttachments);
      }
    } catch (error) {
      console.error("Failed to load images:", error);
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

    if (imageFiles.length + selectedImages.length > 10) {
      alert("Maximum 10 images allowed");
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

  const removePreviewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) return;

    const formData = new FormData();
    selectedImages.forEach((file) => {
      formData.append('images', file);
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
        setSelectedImages([]);
        setPreviewImages([]);
        await loadImages(); // Reload images
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Failed to upload images:", error);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative flex items-center justify-center min-h-full p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden mx-2 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#00a1ff] rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  {language === "es" ? "Imágenes del Ticket" : "Ticket Images"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  {language === "es" ? "Ver y subir imágenes relacionadas con este ticket" : "View and upload images related to this ticket"}
                </p>
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

          {/* Upload Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl sm:rounded-2xl border border-blue-200/60 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
                <h4 className="font-bold text-[#00a1ff] text-sm sm:text-base">
                  {language === "es" ? "Subir Imágenes" : "Upload Images"}
                </h4>
              </div>
              
              {/* File Input */}
              <label className="block w-full">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#00a1ff] hover:bg-blue-50/50 transition-all duration-300 cursor-pointer">
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    {language === "es" ? "Haz clic para seleccionar imágenes o arrastra aquí" : "Click to select images or drag here"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === "es" ? "Máximo 10 imágenes" : "Maximum 10 images"}
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {/* Preview Section */}
              {previewImages.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600 font-medium">
                      {language === "es" ? "Imágenes Seleccionadas" : "Selected Images"} ({previewImages.length}/10)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {previewImages.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 sm:h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => removePreviewImage(index)}
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
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={uploadImages}
                      disabled={uploading}
                      className="px-4 py-2 bg-[#00a1ff] text-white rounded-lg hover:bg-[#0091e6] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 text-sm font-medium flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          {language === "es" ? "Subiendo..." : "Uploading..."}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {language === "es" ? "Subir Imágenes" : "Upload Images"}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedImages([]);
                        setPreviewImages([]);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 text-sm font-medium"
                    >
                      {language === "es" ? "Limpiar" : "Clear"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Images Gallery */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl sm:rounded-2xl border border-gray-200/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 sm:w-2 h-4 sm:h-6 bg-[#00a1ff] rounded-full"></div>
              <h4 className="font-bold text-[#00a1ff] text-sm sm:text-base">
                {language === "es" ? "Galería de Imágenes" : "Image Gallery"}
              </h4>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-[#00a1ff] rounded-full animate-spin"></div>
                  <span className="text-sm">{language === "es" ? "Cargando imágenes..." : "Loading images..."}</span>
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">{language === "es" ? "No hay imágenes" : "No images yet"}</p>
                  <p className="text-xs text-gray-400 mt-1">{language === "es" ? "Sube la primera imagen para comenzar" : "Upload the first image to get started"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((image, index) => (
                    <div key={image.id} className="relative group cursor-pointer">
                      <img
                        src={image.url || `${apiBase}/api/v1/tickets/${ticketId}/attachments/${image.id}`}
                        alt={image.filename}
                        className="w-full h-24 sm:h-28 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200"
                        onClick={() => setSelectedImageIndex(index)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="truncate">{image.filename}</div>
                        {image.size && <div className="text-xs opacity-75">{formatFileSize(image.size)}</div>}
                        {image.uploadedAt && <div className="text-xs opacity-75">{formatDate(image.uploadedAt)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300 text-sm font-medium"
            >
              {language === "es" ? "Cerrar" : "Close"}
            </button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedImageIndex(null)}>
          <div className="relative max-w-4xl max-h-full">
            <img
              src={images[selectedImageIndex].url || `${apiBase}/api/v1/tickets/${ticketId}/attachments/${images[selectedImageIndex].id}`}
              alt={images[selectedImageIndex].filename}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200"
            >
              ×
            </button>
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1);
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0);
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all duration-200"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}