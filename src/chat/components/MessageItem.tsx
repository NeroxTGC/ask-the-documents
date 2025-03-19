import React from 'react';
import ReactMarkdown from 'react-markdown';
import { type Message } from 'wasp/entities';

type MessageItemProps = {
  message: Message;
};

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

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
            {message.modelType === 'rag' ? 'RAG' : 'Deepseek'}
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
      </div>
    </div>
  );
}
