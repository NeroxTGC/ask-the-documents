import React from 'react';

interface DocumentDropZoneProps {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  onDrop?: (e: React.DragEvent) => void;
  onClick?: () => void;
}

export function DocumentDropZone({
  isDragging,
  setIsDragging,
  onDrop,
  onClick
}: DocumentDropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (onDrop) {
      onDrop(e);
    }
  };

  return (
    <div className="pt-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }
          bg-white dark:bg-gray-800
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={onClick}
      >
        {isDragging ? (
          <p className="text-sm text-primary">Drop to upload</p>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Drag & drop files or click to browse</p>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Supported formats: PDF, TXT, DOCX
      </p>
    </div>
  );
}
