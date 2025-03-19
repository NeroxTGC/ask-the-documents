import React from 'react';
import { useQuery } from 'wasp/client/operations';
import { getChats } from 'wasp/client/operations';
import { Link } from 'react-router-dom';
import { ChatList } from '../chat/components/ChatList';
import { NewChatButton } from '../chat/components/NewChatButton';
import { UserStatus } from '../chat/components/UserStatus';

export function ChatListPage() {
  const { data: chats, isLoading, error } = useQuery(getChats);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link to="/" className="text-blue-600 dark:text-blue-400 flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Documents
          </Link>
        </div>
        <div className="p-4">
          <NewChatButton />
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatList chats={chats || []} isLoading={isLoading} />
        </div>
        <UserStatus />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-red-500 text-center">
              <p>Error loading chats:</p>
              <p className="text-sm mt-1">{error.message || 'Unknown error'}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Chat</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start a new conversation with Deepseek or use RAG to get answers from your documents.
              </p>
              <div className="w-64 mx-auto">
                <NewChatButton />
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Or select an existing chat from the sidebar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
