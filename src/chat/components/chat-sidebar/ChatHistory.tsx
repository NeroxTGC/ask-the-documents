import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Chat } from 'wasp/entities';
import { useQuery } from 'wasp/client/operations';
import { getChats } from 'wasp/client/operations';
import { Card } from '@nextui-org/react';
import { ChatDeleteButton } from './ChatDeleteButton';
import { CreateChatButton } from './CreateChatButton';

export type ChatHistoryProps = {
  chats: Chat[];
  isLoading: boolean;
  selectedChatId?: string;
  onChatDeleted?: () => void;
};

export function ChatHistory({ chats, isLoading, selectedChatId, onChatDeleted }: ChatHistoryProps) {
  const location = useLocation();
  const { refetch } = useQuery(getChats);

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col p-4">
        <div className="mt-4 space-y-2">
          {[...Array(5)].map((_, index) => (
            <div 
              key={index} 
              className="animate-pulse h-14 bg-gray-200 dark:bg-gray-800 rounded-md"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4">
      <div className="w-full max-w-xs mx-auto mb-4">
        <CreateChatButton />
      </div>
      <div className="space-y-2 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <p className="mb-3">No chats yet. Start a new chat!</p>
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = selectedChatId === chat.id || location.pathname === `/chat/${chat.id}`;
            
            return (
              <div key={chat.id} className="flex items-center group relative">
                <Link
                  to={`/chat/${chat.id}`}
                  className="flex-1"
                >
                  <Card className={`p-3 mb-2 ${isActive 
                    ? 'bg-white dark:bg-gray-800/80 shadow-md dark:shadow-gray-900/50 border-gray-200 dark:border-gray-700' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-300 dark:border-gray-800 bg-gray-100 dark:bg-gray-900'} transition-colors cursor-pointer border rounded-lg overflow-visible`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                          <h3 className="text-sm font-medium truncate" title={chat.title}>{chat.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">{formatDate(chat.updatedAt)}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
                <div 
                  className={`absolute right-5 top-1/2 transform -translate-y-1/2 z-10 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <ChatDeleteButton 
                      chatId={chat.id} 
                      onDelete={() => refetch()} 
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
