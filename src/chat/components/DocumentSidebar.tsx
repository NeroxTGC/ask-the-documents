import React, { useState, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { embedDocument } from 'wasp/client/operations';
import { getDocuments } from 'wasp/client/operations';
import { Document } from '../../types';
import { DocumentCollapseButton } from './documents-sidebar/DocumentCollapseButton';
import { DocumentUrlInput } from './documents-sidebar/DocumentUrlInput';
import { DocumentDropZone } from './documents-sidebar/DocumentDropZone';
import { DocumentList } from './documents-sidebar/DocumentList';

export function DocumentSidebar() {
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { data: documents, isLoading } = useQuery(getDocuments) as { data: Document[] | undefined, isLoading: boolean };

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || isUploading) return;
    
    try {
      setIsUploading(true);
      
      await embedDocument({
        url: url.trim()
      });
      
      setUrl('');
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex flex-col items-center">
        <DocumentCollapseButton
          isCollapsed={isCollapsed}
          onToggle={toggleSidebar}
          position="left"
        />
        <div className="flex-1 flex flex-col items-center py-8 space-y-8">
          <div className="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
            {documents && documents.length > 0 && (
              <span className="bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
                {documents.length}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
        <h2 className="text-lg font-medium">Documents</h2>
        <DocumentCollapseButton
          isCollapsed={isCollapsed}
          onToggle={toggleSidebar}
          position="left"
        />
      </div>
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
        <DocumentUrlInput
          url={url}
          onUrlChange={setUrl}
          onSubmit={handleAddDocument}
          isUploading={isUploading}
        />

        <DocumentDropZone
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          onDrop={() => {}} // Actualmente sólo es UI, no hay funcionalidad real
          onClick={() => {}} // Actualmente sólo es UI, no hay funcionalidad real
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <DocumentList
          documents={documents}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
