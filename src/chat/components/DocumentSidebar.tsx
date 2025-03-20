import React, { useState } from 'react';
import { deleteDocument, useQuery, getDocuments } from "wasp/client/operations";
import { embedDocument } from "wasp/client/operations";
import { Button, Input, Tooltip, Card, Tabs, Tab } from "@nextui-org/react";
import { Document } from '../../types';

export function DocumentSidebar() {
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { data: documents, isLoading } = useQuery(getDocuments) as { data: Document[] | undefined, isLoading: boolean };

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
      <div className="w-12 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center">
        <Tooltip content="Expand Documents Panel" placement="left">
          <Button 
            isIconOnly 
            variant="light" 
            className="mt-4"
            onClick={() => setIsCollapsed(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16"></path>
              <path d="M4 12h16"></path>
              <path d="M4 18h16"></path>
            </svg>
          </Button>
        </Tooltip>
        <div className="flex-1 flex flex-col items-center py-8 space-y-8">
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
    <div className="w-72 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-medium">Documents</h2>
        <Button 
          isIconOnly 
          variant="light" 
          size="sm"
          onClick={() => setIsCollapsed(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Button>
      </div>
      
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Tabs 
          aria-label="Document upload options" 
          color="primary" 
          variant="underlined" 
          classNames={{
            tabList: "gap-2 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-2 h-8",
            tabContent: "group-data-[selected=true]:text-primary"
          }}
        >
          <Tab key="url" title="URL">
            <form onSubmit={handleAddDocument} className="space-y-2 pt-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Add document URL"
                size="sm"
                classNames={{
                  input: "dark:bg-gray-800 dark:text-white",
                  inputWrapper: "dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
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
                className="dark:bg-indigo-700 dark:hover:bg-indigo-600"
                size="sm"
                isLoading={isUploading}
                disabled={!url.trim() || isUploading}
                fullWidth
              >
                Add Document
              </Button>
            </form>
          </Tab>
          <Tab key="upload" title="Upload">
            <div className="pt-2">
              <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer
                  ${isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                  }
                  bg-gray-50 dark:bg-gray-800
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
                <div className="flex flex-col items-center justify-center py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mb-2 ${isDragging ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-sm font-medium mb-1">Drag & Drop Files</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">or click to browse</p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  color="primary"
                  className="dark:bg-indigo-700 dark:hover:bg-indigo-600"
                  size="sm"
                  disabled={isUploading}
                  fullWidth
                >
                  Upload Documents
                </Button>
              </div>
              <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                Supported formats: PDF, DOCX, TXT
              </div>
            </div>
          </Tab>
        </Tabs>
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
            {documents.map((document) => (
              <Card key={document.id} className="p-3 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate" title={document.title}>
                      {document.title}
                    </h3>
                    <p className="text-xs text-gray-500 truncate" title={document.url}>
                      {document.url}
                    </p>
                  </div>
                  <div>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onClick={() => deleteDocument({ id: document.id })}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
