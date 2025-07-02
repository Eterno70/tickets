import React, { useState, useRef } from 'react';
import { FileAttachment } from '../../types';
import { Upload, X, File, Image, FileText, Archive, Trash2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FileUploadProps {
  onUpload: (files: FileAttachment[]) => void;
  onClose: () => void;
}

export function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const { currentUser } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{[key: string]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addFiles(files);
    }
  };

  const addFiles = (files: File[]) => {
    // Filter out files that are too large (10MB limit)
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo "${file.name}" es demasiado grande. Máximo 10MB.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Generate previews for images
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviews(prev => ({
            ...prev,
            [file.name]: e.target?.result as string
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    
    // Remove preview if it exists
    if (previews[fileToRemove.name]) {
      setPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[fileToRemove.name];
        return newPreviews;
      });
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-5 h-5 text-green-600" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-600" />;
    if (type.includes('video/')) return <Archive className="w-5 h-5 text-purple-600" />;
    if (type.includes('audio/')) return <Archive className="w-5 h-5 text-yellow-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    const attachments: FileAttachment[] = [];
    for (const file of selectedFiles) {
      // Subir archivo a Supabase Storage
      const filePath = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('attachments').upload(filePath, file);
      if (error) {
        alert(`Error subiendo el archivo ${file.name}: ${error.message}`);
        continue;
      }
      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl || '';
      // Insertar en la tabla file_attachments
      const { data: dbData, error: dbError } = await supabase.from('file_attachments').insert({
        message_id: null,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploaded_by: currentUser?.id,
        created_at: new Date().toISOString()
      }).select().single();
      if (dbError) {
        alert(`Error guardando el archivo en la base de datos: ${dbError.message}`);
        continue;
      }
      attachments.push({
        id: dbData.id,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedBy: currentUser?.id || '',
        uploadedAt: new Date()
      });
    }
    onUpload(attachments);
    onClose();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Adjuntar Archivos</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={`w-12 h-12 mx-auto mb-3 transition-colors ${
              dragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <p className="text-base font-medium text-gray-700 mb-2">
              {dragActive ? '¡Suelta los archivos aquí!' : 'Arrastra archivos aquí'}
            </p>
            <p className="text-gray-500 mb-4">
              o{' '}
              <button
                onClick={openFileDialog}
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                selecciona archivos
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Máximo 10MB por archivo • Imágenes, PDFs, documentos y más
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            />
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="px-4 pb-4 flex-1 overflow-hidden">
            <h4 className="font-semibold text-gray-900 mb-3">
              Archivos seleccionados ({selectedFiles.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
                  {/* File preview or icon */}
                  <div className="flex-shrink-0 mr-3">
                    {previews[file.name] ? (
                      <div className="relative">
                        <img
                          src={previews[file.name]}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded transition-all duration-200 flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 hover:opacity-100" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-white rounded border border-gray-200 flex items-center justify-center">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>
                  
                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-500">
                        {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar archivo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-xs text-gray-600">
            {selectedFiles.length > 0 && (
              <span>
                {selectedFiles.length} archivo{selectedFiles.length !== 1 ? 's' : ''} seleccionado{selectedFiles.length !== 1 ? 's' : ''}
                {' • '}
                {formatFileSize(selectedFiles.reduce((total, file) => total + file.size, 0))} total
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Adjuntar {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}