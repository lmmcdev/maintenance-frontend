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
};

export function FilePreviewDialog({
  show,
  attachment,
  onClose,
  onNavigate,
  showNavigation = false
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
      }
    } else {
      setShowIframe(false);
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
    setLoading(false);
  };

  const handleImageError = () => {
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
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
                  className="p-1 md:p-2 text-white hover:bg-white/20 rounded transition-colors"
                  title={language === "es" ? "Alejar" : "Zoom Out"}
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
                  className="p-1 md:p-2 text-white hover:bg-white/20 rounded transition-colors"
                  title={language === "es" ? "Acercar" : "Zoom In"}
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
              onClick={() => window.open(attachment.url, '_blank')}
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
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>{language === "es" ? "Cargando..." : "Loading..."}</p>
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
                className={`relative max-w-full max-h-full overflow-hidden ${imageZoom > 1 ? 'cursor-move' : 'cursor-zoom-in'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={imageZoom === 1 ? handleZoomIn : undefined}
              >
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${imageZoom}) translate(${imagePosition.x / imageZoom}px, ${imagePosition.y / imageZoom}px)`,
                    transformOrigin: 'center'
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  draggable={false}
                />
              </div>
            )}

            {/* PDF Preview */}
            {isPDF && attachment.url && (
              <div className="w-full h-full">
                {showIframe && (
                  <iframe
                    key={iframeKey}
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(attachment.url)}&embedded=true&chrome=false&dov=1&rm=minimal&view=FitH`}
                    className="w-full h-full border-none"
                    title={attachment.filename}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="auto"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    style={{ minHeight: '100vh', minWidth: '100vw' }}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setError('Preview not available');
                    }}
                  />
                )}
              </div>
            )}

            {/* Office Documents Preview */}
            {isOfficeDoc && attachment.url && (
              <div className="w-full h-full">
                {showIframe && (
                  <iframe
                    key={iframeKey}
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(attachment.url)}&embedded=true&chrome=false&dov=1&rm=minimal&view=FitH`}
                    className="w-full h-full border-none"
                    title={attachment.filename}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="auto"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    style={{ minHeight: '100vh', minWidth: '100vw' }}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setError('Preview not available');
                    }}
                  />
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
                    onClick={() => window.open(attachment.url, '_blank')}
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
            ? "Presiona ESC para cerrar • Usa las flechas para navegar" 
            : "Press ESC to close • Use arrow keys to navigate"
          }
        </p>
      </div>
    </div>
  );
}