import React, { useState } from 'react';
import { FileAttachment } from '../../types';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';

interface FilePreviewProps {
  attachment: FileAttachment;
  onClose: () => void;
}

export function FilePreview({ attachment, onClose }: FilePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreview = () => {
    if (attachment.type.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full overflow-auto">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBMMTMwIDEwMEg3MEwxMDAgNzBaIiBmaWxsPSIjOUI5QkEwIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIHN0cm9rZT0iIzlCOUJBMCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LXNpemU9IjEyIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KPHN2Zz4=';
            }}
          />
        </div>
      );
    }

    if (attachment.type.includes('pdf')) {
      return (
        <div className="h-full">
          <iframe
            src={attachment.url}
            className="w-full h-full border-0"
            title={attachment.name}
          />
        </div>
      );
    }

    if (attachment.type.includes('text')) {
      return (
        <div className="p-6 bg-gray-50 rounded-lg h-full overflow-auto">
          <div className="bg-white p-4 rounded border">
            <p className="text-gray-600 text-center">Vista previa de archivo de texto</p>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Descarga el archivo para ver su contenido completo
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4 text-lg font-medium">
            No se puede previsualizar este tipo de archivo
          </p>
          <p className="text-gray-500 mb-6">
            Tipo: {attachment.type}
          </p>
          <button
            onClick={handleDownload}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <Download className="w-5 h-5 mr-2" />
            Descargar archivo
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`bg-white rounded-lg flex flex-col ${
        isFullscreen ? 'w-full h-full rounded-none' : 'max-w-6xl max-h-[90vh] w-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{attachment.name}</h3>
            <p className="text-sm text-gray-500">
              {formatFileSize(attachment.size)} • {attachment.type}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {/* Image controls */}
            {attachment.type.startsWith('image/') && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Alejar"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Acercar"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Rotar"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </>
            )}
            
            <button
              onClick={handleFullscreen}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Descargar"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {renderPreview()}
        </div>
        
        {/* Footer with file info */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Subido: {new Date(attachment.uploadedAt).toLocaleString('es-ES')}</span>
            <div className="flex items-center space-x-4">
              <span>Tipo: {attachment.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'}</span>
              <button
                onClick={handleDownload}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Descargar archivo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}