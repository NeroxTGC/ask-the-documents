import React, { useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getChats, getChat } from 'wasp/client/operations';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChatList } from '../chat/components/ChatList';
import { ChatWindow } from '../chat/components/ChatWindow';
import { UserStatus } from '../chat/components/UserStatus';

export function ChatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Redirigir si no hay id
  useEffect(() => {
    if (!id) {
      navigate('/chat');
    }
  }, [id, navigate]);
  
  const { 
    data: chats, 
    isLoading: isChatsLoading 
  } = useQuery(getChats);
  
  const { 
    data: chat, 
    isLoading: isChatLoading, 
    error 
  } = useQuery(getChat, { id: id || '' }, { enabled: !!id });

  // Si no hay id, no renderizar el resto
  if (!id) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link to="/chat" className="text-blue-600 dark:text-blue-400 flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chats
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatList chats={chats || []} isLoading={isChatsLoading} selectedChatId={id} />
        </div>
        <UserStatus />
      </div>

      {/* Main content area */}
      <div className="flex-1">
        {error ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-red-500 text-center">
              <p>Error loading chat:</p>
              <p className="text-sm mt-1">{error.message || 'Unknown error'}</p>
            </div>
          </div>
        ) : isChatLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
            </div>
          </div>
        ) : chat ? (
          <ChatWindow chat={chat} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Chat not found</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
