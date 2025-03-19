import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Chat } from 'wasp/entities';
import { NewChatButton } from './NewChatButton';
import { DeleteChatButton } from './DeleteChatButton';
import { useQuery } from 'wasp/client/operations';
import { getChats } from 'wasp/client/operations';

export type ChatListProps = {
  chats: Chat[];
  isLoading: boolean;
  selectedChatId?: string;
  onChatDeleted?: () => void;
};

export function ChatList({ chats, isLoading, selectedChatId, onChatDeleted }: ChatListProps) {
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
      <div className="flex flex-col h-full p-4">
        <NewChatButton />
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
    <div className="flex flex-col h-full p-4">
      <NewChatButton />
      
      <div className="mt-4 space-y-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            No chats yet. Start a new chat!
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = selectedChatId === chat.id || location.pathname === `/chat/${chat.id}`;
            
            return (
              <div key={chat.id} className="flex items-center group">
                <Link
                  to={`/chat/${chat.id}`}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-md text-sm flex-1
                    ${isActive
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
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
                    <span className="truncate max-w-[150px]">{chat.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(chat.updatedAt)}
                  </span>
                </Link>
                <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
                  <DeleteChatButton chatId={chat.id} onDelete={() => refetch()} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
