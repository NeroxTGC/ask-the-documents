import React, { useState, useEffect } from 'react';
import { deleteDocument, useQuery, getDocuments } from "wasp/client/operations";
import { embedDocument } from "wasp/client/operations";
import { Button, Input, Tooltip, Card } from "@nextui-org/react";
import { Document } from '../../types';

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

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex flex-col items-center">
        <Tooltip content="Expand Documents Panel" placement="left">
          <Button 
            isIconOnly 
            variant="light" 
            className="mt-4"
            onClick={() => setIsCollapsed(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4l-5 8 5 8"></path>
              <path d="M21 12H4"></path>
            </svg>
          </Button>
        </Tooltip>
        <div className="flex-1 flex flex-col items-center py-8 space-y-8">
          <Tooltip content="Add Document" placement="left">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => setIsCollapsed(false)}
              className="text-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </Button>
          </Tooltip>
          <Tooltip content="Documents" placement="left">
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
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
        <h2 className="text-lg font-medium">Documents</h2>
        <Button 
          isIconOnly 
          variant="light" 
          size="sm"
          onClick={() => setIsCollapsed(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4l5 8-5 8"></path>
            <path d="M4 12h16"></path>
          </svg>
        </Button>
      </div>
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
        <form onSubmit={handleAddDocument} className="space-y-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Add document URL"
            size="sm"
            classNames={{
              inputWrapper: [
                "bg-white dark:bg-gray-800",
                "shadow-none",
                "border-1 border-gray-300 dark:border-gray-700",
                "!ring-0",
                "!ring-offset-0",
                "hover:!bg-white dark:hover:!bg-gray-800",
                "data-[hover=true]:bg-white dark:data-[hover=true]:bg-gray-800",
                "group-data-[focus=true]:bg-white dark:group-data-[focus=true]:bg-gray-800"
              ].join(" "),
              input: "focus:bg-white dark:focus:bg-gray-800 hover:bg-white dark:hover:bg-gray-800 dark:text-white"
            }}
            startContent={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            }
            disabled={isUploading}
          />
          <Button 
            type="submit" 
            color="primary" 
            className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none"
            size="sm"
            isLoading={isUploading}
            disabled={!url.trim() || isUploading}
            startContent={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H4" />
              </svg>
            }
          >
            Add Document
          </Button>
        </form>

        <div className="pt-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
              ${isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }
              bg-white dark:bg-gray-800
            `}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              // No real functionality, just UI
            }}
            onClick={() => {
              // This would normally trigger a file input click
            }}
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
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <Card className="p-3 mb-2">
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
            </div>
          </Card>
        )}
        
        {!isLoading && documents && documents.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <path d="M14 2v6h6"></path>
              <path d="M9 15v-1"></path>
              <path d="M12 15v-6"></path>
              <path d="M15 15v-3"></path>
            </svg>
            <p className="text-sm">No documents yet</p>
            <p className="text-xs mt-1">Add a URL above to get started</p>
          </div>
        )}
        
        {!isLoading && documents && documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-3 mb-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer dark:bg-gray-800/70">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate" title={doc.title}>{doc.title}</h3>
                    <p className="text-xs text-gray-500 truncate mt-1">{new URL(doc.url).hostname}</p>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="min-w-0 w-6 h-6 p-0 text-gray-500 hover:text-red-500"
                    onClick={() => deleteDocument({ id: doc.id })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
