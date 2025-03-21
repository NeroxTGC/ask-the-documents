import React, { useState, useEffect } from "react";
import { useQuery } from "wasp/client/operations";
import { getChats } from "wasp/client/operations";
import { ChatList } from '../chat/components/ChatList';
import { UserStatus } from '../chat/components/UserStatus';
import { ThemeSwitch } from '../chat/components/ThemeSwitch';
import { HomeChatInput } from '../chat/components/HomeChatInput';
import { DocumentSidebar } from '../chat/components/DocumentSidebar';
import { Button, Tooltip } from '@nextui-org/react';

export function ChatListPage() {
  const { data: chats, isLoading } = useQuery(getChats);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsLeftSidebarCollapsed(true);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar - Chats */}
      {isLeftSidebarCollapsed ? (
        <div className="w-12 border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex flex-col items-center">
          <Tooltip content="Expand Chats Panel" placement="right">
            <Button 
              isIconOnly 
              variant="light" 
              className="mt-4"
              onClick={() => setIsLeftSidebarCollapsed(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4l-5 8 5 8"></path>
                <path d="M21 12H4"></path>
              </svg>
            </Button>
          </Tooltip>
          <div className="flex-1 flex flex-col items-center py-8 space-y-8">
            <Tooltip content="New Chat" placement="right">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={() => setIsLeftSidebarCollapsed(false)}
                className="text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <line x1="12" y1="11" x2="12" y2="17"></line>
                  <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg>
              </Button>
            </Tooltip>
          </div>
          <div className="mt-auto mb-16">
            <ThemeSwitch isCompact={true} />
          </div>
          <div className="mb-4">
            <UserStatus isCompact={true} />
          </div>
        </div>
      ) : (
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 flex flex-col">
          <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-medium">Chats</h2>
            <Button 
              isIconOnly 
              variant="light" 
              size="sm"
              onClick={() => setIsLeftSidebarCollapsed(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 4l5 8-5 8"></path>
                <path d="M4 12h16"></path>
              </svg>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ChatList chats={chats || []} isLoading={isLoading} />
          </div>
          <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
            <ThemeSwitch />
            <UserStatus />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 bg-white dark:bg-gray-800">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Chat</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Start a new conversation with Deepseek or use RAG to get answers from your documents.
            </p>
            <div className="w-full mx-auto">
              <HomeChatInput />
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Press <span className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Enter</span> to send or <span className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Shift+Enter</span> for a new line
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Documents */}
      <DocumentSidebar />
    </div>
  );
}
