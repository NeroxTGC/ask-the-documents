import React from 'react';
import { Button, Input } from '@nextui-org/react';

interface DocumentUrlInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isUploading: boolean;
}

export function DocumentUrlInput({
  url,
  onUrlChange,
  onSubmit,
  isUploading
}: DocumentUrlInputProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Input
        type="url"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
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
  );
}
