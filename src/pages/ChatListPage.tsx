import React from "react";
import { useQuery } from "wasp/client/operations";
import { getChats } from "wasp/client/operations";
import { ChatList } from '../chat/components/ChatList';
import { UserStatus } from '../chat/components/UserStatus';
import { ThemeSwitch } from '../chat/components/ThemeSwitch';
import { HomeChatInput } from '../chat/components/HomeChatInput';
import { DocumentSidebar } from '../chat/components/DocumentSidebar';

export function ChatListPage() {
  const { data: chats, isLoading } = useQuery(getChats);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar - Chats */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <ChatList chats={chats || []} isLoading={isLoading} />
        </div>
        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-800">
          <ThemeSwitch />
          <UserStatus />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Chat</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start a new conversation with Deepseek or use RAG to get answers from your documents.
            </p>
            <div className="w-full mx-auto">
              <HomeChatInput />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Press <span className="font-mono px-1 bg-gray-100 dark:bg-gray-800 rounded">Enter</span> to send or <span className="font-mono px-1 bg-gray-100 dark:bg-gray-800 rounded">Shift+Enter</span> for a new line
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Documents */}
      <DocumentSidebar />
    </div>
  );
}
