import React from 'react';
import { Button, Card } from '@nextui-org/react';
import { deleteDocument } from 'wasp/client/operations';
import { Document } from '../../../types';

interface DocumentItemProps {
  document: Document;
}

export function DocumentItem({ document }: DocumentItemProps) {
  const handleDelete = () => {
    deleteDocument({ id: document.id });
  };

  return (
    <Card key={document.id} className="p-3 mb-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer dark:bg-gray-800/70">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate" title={document.title}>{document.title}</h3>
          <p className="text-xs text-gray-500 truncate mt-1">{new URL(document.url).hostname}</p>
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="min-w-0 w-6 h-6 p-0 text-gray-500 hover:text-red-500"
          onClick={handleDelete}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
          </svg>
        </Button>
      </div>
    </Card>
  );
}
