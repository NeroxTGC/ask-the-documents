import React from 'react';
import { Card } from '@nextui-org/react';
import { Document } from '../../../types';
import { DocumentItem } from './DocumentItem';

interface DocumentListProps {
  documents: Document[] | undefined;
  isLoading: boolean;
}

export function DocumentList({ 
  documents, 
  isLoading 
}: DocumentListProps) {
  if (isLoading) {
    return (
      <Card className="p-3 mb-2">
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full"></div>
        </div>
      </Card>
    );
  }

  if (!documents || documents.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <DocumentItem key={doc.id} document={doc} />
      ))}
    </div>
  );
}
