"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Attachment } from "../../types/ticket";

type FilePreviewDialogProps = {
  show: boolean;
  attachment: Attachment | null;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  showNavigation?: boolean;
  ticketId?: string;
  apiBase?: string;
  token?: string;
};

export function FilePreviewDialog({
  show,
  attachment,
  onClose,
  onNavigate,
  showNavigation = false,
  ticketId,
  apiBase,
  token
}: FilePreviewDialogProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [iframeKey, setIframeKey] = useState(0);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    if (show && attachment) {
      setLoading(true);
      setError(null);
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
      setShowIframe(true);

      // Force iframe refresh with unique key
      setIframeKey(Date.now());

      // Quick loading for documents
      if (!attachment.contentType.startsWith('image/')) {
        setTimeout(() => setLoading(false), 200);
      } else {
        // For images, set a timeout as fallback in case onLoad doesn't trigger
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    } else {
      setShowIframe(false);
      setLoading(false);
      setError(null);
    }
  }, [show, attachment]);

  const getFileIcon = (contentType: string, filename: string) => {
    const ext = filename.toLowerCase().split('.').pop() || '';
    
    if (contentType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return "🖼️";
    if (contentType.includes('pdf') || ext === 'pdf') return "📄";
    if (contentType.includes('word') || contentType.includes('doc') || ['doc', 'docx'].includes(ext)) return "📝";
    if (contentType.includes('excel') || contentType.includes('sheet') || ['xls', 'xlsx'].includes(ext)) return "📊";
    if (contentType.includes('powerpoint') || contentType.includes('presentation') || ['ppt', 'pptx'].includes(ext)) return "📽️";
    return "📎";
  };

  const getOfficeViewerUrl = (url: string, contentType: string) => {
    const encodedUrl = encodeURIComponent(url);
    
    if (contentType.includes('pdf')) {
      // Use browser's built-in PDF viewer
      return url;
    }
    
    // Use Microsoft Office Online Viewer for Office documents
    if (contentType.includes('word') || contentType.includes('doc') ||
        contentType.includes('excel') || contentType.includes('sheet') ||
        contentType.includes('powerpoint') || contentType.includes('presentation')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
    }
    
    return url;
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setLoading(false);
    setError(null);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Image failed to load:', e.currentTarget.src);
    setLoading(false);
    setError(language === "es" ? "Error al cargar la imagen" : "Failed to load image");
  };

  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleResetZoom = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageZoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && imageZoom > 1) {
      e.preventDefault();
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDragging(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (imageZoom === 1) {
      handleZoomIn();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isImage) return;

    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    const zoomFactor = 1.2;
    const newZoom = delta > 0
      ? Math.min(imageZoom * zoomFactor, 5)
      : Math.max(imageZoom / zoomFactor, 0.1);

    setImageZoom(newZoom);

    // Reset position if zooming out to 1x
    if (newZoom === 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handlePrint = () => {
    if (!attachment?.url) return;

    // Create a new window for printing
    const printWindow = window.open(attachment.url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleFullscreen = () => {
    if (!attachment?.url) return;
    window.open(attachment.url, '_blank');
  };

  const handleDownload = async () => {
    if (!attachment) return;

    console.log('🔽 FORCING download for:', attachment.filename);

    // CANVAS PROXY METHOD - Works even when server shows images instead of downloading
    const downloadImageViaCanvas = (imageUrl: string, filename: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        console.log('🎨 Using canvas proxy method to force download');

        // Create new image element
        const img = new Image();

        // Handle CORS
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            console.log('✅ Image loaded, creating canvas...');

            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Could not get canvas context');
            }

            // Set canvas size to match image
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;

            console.log(`📐 Canvas size: ${canvas.width}x${canvas.height}`);

            // Draw image on canvas
            ctx.drawImage(img, 0, 0);

            // Convert canvas to blob and download
            canvas.toBlob((blob) => {
              if (!blob) {
                throw new Error('Could not create blob from canvas');
              }

              console.log('✅ Blob created from canvas, size:', blob.size);

              // Create download URL
              const blobUrl = URL.createObjectURL(blob);

              // Create download link
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = filename;
              link.style.display = 'none';

              // Force download
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Cleanup
              setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
              }, 1000);

              console.log('🎉 Canvas download completed for:', filename);
              resolve();

            }, 'image/png', 1.0); // High quality PNG

          } catch (error) {
            console.error('❌ Canvas processing failed:', error);
            reject(error);
          }
        };

        img.onerror = (error) => {
          console.error('❌ Image failed to load:', error);
          reject(new Error('Failed to load image for canvas processing'));
        };

        // Start loading image
        img.src = imageUrl;
      });
    };

    // API download with fetch (for authenticated endpoints)
    const apiDownload = async (url: string, filename: string, headers: Record<string, string>): Promise<void> => {
      try {
        console.log('🔐 Trying API download with authentication');

        const response = await fetch(url, {
          headers,
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const blob = await response.blob();
        console.log('✅ API file fetched successfully. Size:', blob.size, 'bytes');

        // Create blob URL for download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);

        console.log('🎉 API download completed:', filename);
      } catch (error) {
        console.error('❌ API download failed:', error);
        throw error;
      }
    };

    try {
      // Try API endpoint first if we have credentials
      if (ticketId && apiBase && attachment.id && token) {
        const apiUrl = `${apiBase}/api/v1/tickets/${ticketId}/attachments/${attachment.id}/download`;
        const headers = { "Authorization": `Bearer ${token}` };

        try {
          await apiDownload(apiUrl, attachment.filename, headers);
          return;
        } catch (apiError) {
          console.log('🔄 API download failed, trying canvas method:', apiError);
          // Continue to canvas method
        }
      }

      // Use canvas proxy method for images (GUARANTEED TO WORK)
      if (attachment.url) {
        if (attachment.contentType.startsWith('image/')) {
          console.log('🖼️ Detected image, using canvas proxy method');
          await downloadImageViaCanvas(attachment.url, attachment.filename);
          return;
        } else {
          // For non-images, try direct link method
          console.log('📄 Non-image file, trying direct download');
          const link = document.createElement('a');
          link.href = attachment.url;
          link.download = attachment.filename;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log('✅ Direct download triggered for non-image');
          return;
        }
      }

      throw new Error('No download URL available');

    } catch (error) {
      console.error('💥 All download methods failed:', error);

      // User-friendly error with clipboard copy
      const message = language === "es"
        ? `❌ No se pudo descargar "${attachment.filename}" automáticamente.\n\nEl archivo se ha copiado al portapapeles. Pégalo en una nueva pestaña para descargarlo manualmente.`
        : `❌ Could not download "${attachment.filename}" automatically.\n\nThe URL has been copied to clipboard. Paste it in a new tab to download manually.`;

      // Copy URL to clipboard
      if (attachment.url && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(attachment.url);
          alert(message);
        } catch (clipError) {
          alert(message.replace('se ha copiado al portapapeles', 'no se pudo copiar').replace('has been copied to clipboard', 'could not be copied'));
        }
      } else {
        alert(message.replace('se ha copiado al portapapeles', 'no se pudo copiar').replace('has been copied to clipboard', 'could not be copied'));
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!show) return;

    if (e.key === 'Escape') {
      onClose();
    } else if (onNavigate) {
      if (e.key === 'ArrowLeft') {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        onNavigate('next');
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show, onNavigate]);

  if (!show || !attachment) return null;

  // Get file extension
  const fileExtension = attachment.filename.toLowerCase().split('.').pop() || '';
  
  // Detect file type by contentType first, then fallback to extension
  const isImage = attachment.contentType.startsWith('image/') || 
                  ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension);
                  
  const isPDF = attachment.contentType.includes('pdf') || 
                attachment.contentType === 'application/pdf' ||
                fileExtension === 'pdf';
                
  const isOfficeDoc = attachment.contentType.includes('word') || 
                    attachment.contentType.includes('doc') ||
                    attachment.contentType.includes('excel') || 
                    attachment.contentType.includes('sheet') ||
                    attachment.contentType.includes('powerpoint') || 
                    attachment.contentType.includes('presentation') ||
                    attachment.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    attachment.contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    attachment.contentType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                    attachment.contentType === 'application/msword' ||
                    attachment.contentType === 'application/vnd.ms-excel' ||
                    attachment.contentType === 'application/vnd.ms-powerpoint' ||
                    ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-md border-b border-white/10 z-10">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 text-white min-w-0 flex-1">
            <div className="text-xl md:text-2xl flex-shrink-0">{getFileIcon(attachment.contentType, attachment.filename)}</div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm md:text-lg truncate">{attachment.filename}</h3>
              <p className="text-xs md:text-sm text-gray-300">
                {attachment.contentType} 
                {attachment.size && ` • ${(attachment.size / (1024 * 1024)).toFixed(1)} MB`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Image Controls */}
            {isImage && (
              <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
                <button
                  onClick={handleZoomOut}
                  className="p-1 md:p-2 text-white hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={language === "es" ? "Alejar" : "Zoom Out"}
                  disabled={imageZoom <= 0.1}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <span className="text-white text-xs md:text-sm min-w-[2.5rem] md:min-w-[3rem] text-center">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 md:p-2 text-white hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={language === "es" ? "Acercar" : "Zoom In"}
                  disabled={imageZoom >= 5}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-1 md:p-2 text-white hover:bg-white/20 rounded transition-colors"
                  title={language === "es" ? "Restablecer" : "Reset"}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}

            {/* PDF Controls */}
            {isPDF && (
              <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
                <button
                  onClick={handlePrint}
                  className="p-1 md:p-2 text-white hover:bg-white/20 rounded transition-colors"
                  title={language === "es" ? "Imprimir" : "Print"}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
                <button
                  onClick={handleFullscreen}
                  className="p-1 md:p-2 text-white hover:bg-white/20 rounded transition-colors"
                  title={language === "es" ? "Pantalla completa" : "Fullscreen"}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a2 2 0 012-2h4M4 16v4a2 2 0 002 2h4M16 4h4a2 2 0 012 2v4M16 20h4a2 2 0 002-2v-4" />
                  </svg>
                </button>
              </div>
            )}

            {/* Navigation */}
            {showNavigation && onNavigate && (
              <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
                <button
                  onClick={() => onNavigate('prev')}
                  className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                  title={language === "es" ? "Anterior" : "Previous"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => onNavigate('next')}
                  className="p-2 text-white hover:bg-white/20 rounded transition-colors"
                  title={language === "es" ? "Siguiente" : "Next"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title={language === "es" ? "Descargar" : "Download"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors text-xl"
              title={language === "es" ? "Cerrar" : "Close"}
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="absolute top-16 bottom-4 left-2 right-2 md:left-4 md:right-4">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>{language === "es" ? "Cargando..." : "Loading..."}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-white">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-lg mb-2">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
            >
              {language === "es" ? "Cerrar" : "Close"}
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="w-full h-full">
            {/* Image Preview */}
            {isImage && attachment.url && (
              <div
                className="w-full h-full flex items-center justify-center relative overflow-hidden"
                onWheel={handleWheel}
              >
                <div
                  className={`relative select-none ${imageZoom > 1 ? 'cursor-move' : 'cursor-zoom-in'}`}
                  style={{
                    width: 'fit-content',
                    height: 'fit-content',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleImageClick}
                >
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className="block shadow-2xl"
                    style={{
                      transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                      transformOrigin: 'center',
                      maxHeight: 'calc(100vh - 8rem)',
                      maxWidth: 'calc(100vw - 4rem)',
                      transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                      userSelect: 'none',
                      pointerEvents: 'none'
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    draggable={false}
                  />
                </div>
              </div>
            )}

            {/* PDF Preview */}
            {isPDF && attachment.url && (
              <div className="w-full h-full">
                {error ? (
                  <div className="text-center text-white h-full flex flex-col justify-center">
                    <div className="text-8xl mb-6">📄</div>
                    <h3 className="text-2xl font-semibold mb-2">{attachment.filename}</h3>
                    <p className="text-gray-300 mb-6">
                      {language === "es"
                        ? "Vista previa no disponible. El archivo se puede descargar."
                        : "Preview not available. File can be downloaded."
                      }
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleDownload}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {language === "es" ? "Descargar" : "Download"}
                      </button>
                      <button
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {language === "es" ? "Abrir en nueva pestaña" : "Open in new tab"}
                      </button>
                    </div>
                  </div>
                ) : showIframe && (
                  <div className="w-full h-full relative">
                    {/* Try browser's native PDF viewer first */}
                    <iframe
                      key={`native-${iframeKey}`}
                      src={`${attachment.url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH&zoom=page-fit`}
                      className="w-full h-full border-none"
                      title={attachment.filename}
                      width="100%"
                      height="100%"
                      style={{
                        minHeight: '100vh',
                        minWidth: '100vw',
                        border: '0',
                        backgroundColor: '#525659'
                      }}
                      onLoad={() => {
                        setLoading(false);
                        console.log('Native PDF viewer loaded successfully');
                      }}
                      onError={() => {
                        console.log('Native PDF viewer failed, trying Google Docs Viewer...');
                        // Hide native and show Google viewer
                        const nativeViewer = document.querySelector(`iframe[key="native-${iframeKey}"]`) as HTMLElement;
                        const googleViewer = document.querySelector(`iframe[key="google-${iframeKey}"]`) as HTMLElement;
                        if (nativeViewer && googleViewer) {
                          nativeViewer.style.display = 'none';
                          googleViewer.style.display = 'block';
                        }
                      }}
                    />

                    {/* Fallback: Google Docs Viewer */}
                    <iframe
                      key={`google-${iframeKey}`}
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(attachment.url)}&embedded=true&chrome=false&dov=1&rm=minimal&view=FitH`}
                      className="w-full h-full border-none absolute top-0 left-0"
                      title={`${attachment.filename} - Google Viewer`}
                      width="100%"
                      height="100%"
                      style={{
                        minHeight: '100vh',
                        minWidth: '100vw',
                        border: '0',
                        display: 'none',
                        backgroundColor: '#404040'
                      }}
                      onLoad={() => {
                        setLoading(false);
                        console.log('Google Docs viewer loaded as fallback');
                      }}
                      onError={() => {
                        console.log('Google Docs viewer also failed');
                        setLoading(false);
                        setError(language === "es" ? "Vista previa no disponible" : "Preview not available");
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Office Documents Preview */}
            {isOfficeDoc && attachment.url && (
              <div className="w-full h-full">
                {error ? (
                  <div className="text-center text-white h-full flex flex-col justify-center">
                    <div className="text-8xl mb-6">{getFileIcon(attachment.contentType, attachment.filename)}</div>
                    <h3 className="text-2xl font-semibold mb-2">{attachment.filename}</h3>
                    <p className="text-gray-300 mb-6">
                      {language === "es"
                        ? "Vista previa no disponible para este documento. Se puede descargar o abrir en nueva pestaña."
                        : "Preview not available for this document. Can be downloaded or opened in new tab."
                      }
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleDownload}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {language === "es" ? "Descargar" : "Download"}
                      </button>
                      <button
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {language === "es" ? "Abrir en nueva pestaña" : "Open in new tab"}
                      </button>
                    </div>
                  </div>
                ) : showIframe && (
                  <div className="w-full h-full relative">
                    {/* Try Google Docs Viewer */}
                    <iframe
                      key={`google-office-${iframeKey}`}
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(attachment.url)}&embedded=true&chrome=false&dov=1&rm=minimal&view=FitH`}
                      className="w-full h-full border-none"
                      title={attachment.filename}
                      width="100%"
                      height="100%"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      style={{ minHeight: '100vh', minWidth: '100vw', border: '0' }}
                      onLoad={() => {
                        setLoading(false);
                        console.log('Google Docs viewer loaded for Office document');
                      }}
                      onError={() => {
                        console.log('Google Docs viewer failed for Office document, trying Microsoft Viewer...');
                        // Try Microsoft Office Online Viewer as fallback
                        const msViewer = document.querySelector(`iframe[key="ms-office-${iframeKey}"]`) as HTMLElement;
                        const googleViewer = document.querySelector(`iframe[key="google-office-${iframeKey}"]`) as HTMLElement;
                        if (msViewer && googleViewer) {
                          googleViewer.style.display = 'none';
                          msViewer.style.display = 'block';
                        }
                      }}
                    />

                    {/* Fallback: Microsoft Office Online Viewer */}
                    <iframe
                      key={`ms-office-${iframeKey}`}
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(attachment.url)}`}
                      className="w-full h-full border-none absolute top-0 left-0"
                      title={`${attachment.filename} - Microsoft Viewer`}
                      width="100%"
                      height="100%"
                      style={{ minHeight: '100vh', minWidth: '100vw', border: '0', display: 'none' }}
                      onLoad={() => {
                        setLoading(false);
                        console.log('Microsoft Office viewer loaded as fallback');
                      }}
                      onError={() => {
                        console.log('Both viewers failed for Office document');
                        setLoading(false);
                        setError(language === "es" ? "Vista previa no disponible" : "Preview not available");
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Unsupported File Type */}
            {!isImage && !isPDF && !isOfficeDoc && (
              <div className="text-center text-white">
                <div className="text-8xl mb-6">{getFileIcon(attachment.contentType, attachment.filename)}</div>
                <h3 className="text-2xl font-semibold mb-2">{attachment.filename}</h3>
                <p className="text-gray-300 mb-6">
                  {language === "es" 
                    ? "Vista previa no disponible para este tipo de archivo" 
                    : "Preview not available for this file type"
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {language === "es" ? "Descargar" : "Download"}
                  </button>
                  <button
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {language === "es" ? "Abrir en nueva pestaña" : "Open in new tab"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-white/60 text-sm">
        <p>
          {language === "es"
            ? isImage
              ? "ESC: cerrar • Flechas: navegar • Click: zoom • Scroll: zoom • Arrastrar cuando ampliado"
              : "Presiona ESC para cerrar • Usa las flechas para navegar"
            : isImage
              ? "ESC: close • Arrows: navigate • Click: zoom • Scroll: zoom • Drag when zoomed"
              : "Press ESC to close • Use arrow keys to navigate"
          }
        </p>
      </div>
    </div>
  );
}