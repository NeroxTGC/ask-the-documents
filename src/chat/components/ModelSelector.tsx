import React from 'react';

export type ModelSelectorProps = {
  selectedModel: string;
  useRag: boolean;
  onSelectModel: (model: string) => void;
  onToggleRag: (useRag: boolean) => void;
};

export function ModelSelector({ selectedModel, useRag, onSelectModel, onToggleRag }: ModelSelectorProps) {
  return (
    <div className="flex items-center space-x-3 mb-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Model:</span>
        <div className="relative inline-block">
          <select
            value={selectedModel}
            onChange={(e) => onSelectModel(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="deepseek-chat">DeepSeek-V3</option>
            <option value="deepseek-reasoner">DeepSeek-R1</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={useRag}
              onChange={(e) => onToggleRag(e.target.checked)}
            />
            <div className={`block w-10 h-6 rounded-full ${useRag ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${useRag ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">RAG</span>
        </label>
      </div>
    </div>
  );
}
