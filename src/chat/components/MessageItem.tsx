import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { type Message } from 'wasp/entities';

type MessageItemProps = {
  message: Message;
};

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  return (
    <div 
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} ${isSystem ? 'opacity-70' : ''}`}
    >
      <div 
        className={`
          max-w-[85%] md:max-w-[75%] lg:max-w-[65%] rounded-lg px-4 py-3 mb-2
          ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}
          ${isSystem ? 'italic bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm' : ''}
        `}
      >
        {message.modelType && !isUser && !isSystem && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {message.modelType}
            {message.useRag && ' + RAG'}
          </div>
        )}
        
        {isSystem ? (
          <div>{message.content}</div>
        ) : (
          <ReactMarkdown 
            className="prose dark:prose-invert prose-sm max-w-none"
          >
            {message.content}
          </ReactMarkdown>
        )}
        
        {message.reasoningContent && !isUser && !isSystem && (
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setIsReasoningOpen(!isReasoningOpen)}
              className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none transition-colors cursor-pointer mt-1 mb-2"
            >
              <svg 
                className={`h-4 w-4 mr-1 transition-transform duration-200 ${isReasoningOpen ? 'transform rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {isReasoningOpen ? 'Ocultar razonamiento' : 'Ver razonamiento'}
            </button>
            
            {isReasoningOpen && (
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded my-2 border border-gray-200 dark:border-gray-700">
                <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 font-medium">Proceso de razonamiento:</div>
                <ReactMarkdown 
                  className="prose dark:prose-invert prose-sm max-w-none"
                >
                  {message.reasoningContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
