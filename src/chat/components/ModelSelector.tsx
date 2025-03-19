import React from 'react';

type ModelSelectorProps = {
  selectedModel: string;
  onChange: (model: string) => void;
};

export function ModelSelector({ selectedModel, onChange }: ModelSelectorProps) {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
      <div className="relative inline-block">
        <select
          value={selectedModel}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
        >
          <option value="deepseek">Deepseek</option>
          <option value="rag">RAG</option>
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
