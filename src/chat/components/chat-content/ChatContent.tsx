import React from 'react';
import { ChatMessages } from './ChatMessages';
import { WelcomeInput } from './WelcomeInput';
import { type Chat, type Message } from 'wasp/entities';

interface ChatContentProps {
  chatId?: string;
  chat?: Chat & { messages: Message[] };
  isChatLoading: boolean;
  chatError?: Error | null;
  systemPrompt: string;
  onChatDeleted: () => void;
}

export function ChatContent({
  chatId,
  chat,
  isChatLoading,
  chatError,
  systemPrompt,
  onChatDeleted
}: ChatContentProps) {
  // Si está cargando el chat específico
  if (chatId && isChatLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }
  
  // Si hay un error de chat
  if (chatId && chatError) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-red-500 text-center">
          <p>Error loading chat</p>
          <p className="text-sm mt-1">{chatError.message || 'Unknown error'}</p>
        </div>
      </div>
    );
  }
  
  // Si se ha cargado un chat específico
  if (chatId && chat) {
    return (
      <ChatMessages
        chat={chat} 
        isLoading={isChatLoading}
        onChatDeleted={onChatDeleted}
        systemPrompt={systemPrompt}
      />
    );
  }
  
  // Vista predeterminada - Entrada de chat de inicio (cuando no hay ID de chat o en la ruta /chat)
  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-white dark:bg-gray-800">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Chat</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Start a new conversation with Deepseek or use RAG to get answers from your documents.
        </p>
        <div className="w-full mx-auto">
          <WelcomeInput />
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Press <span className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Enter</span> to send or <span className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Shift+Enter</span> for a new line
        </p>
      </div>
    </div>
  );
}
