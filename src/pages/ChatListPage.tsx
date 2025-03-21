import React, { useState, useEffect } from "react";
import { useQuery } from "wasp/client/operations";
import { getChats, createChat } from "wasp/client/operations";
import { ChatSidebar } from '../chat/components/ChatSidebar';
import { UserStatus } from '../chat/components/UserStatus';
import { ThemeSwitch } from '../chat/components/ThemeSwitch';
import { HomeChatInput } from '../chat/components/HomeChatInput';
import { DocumentSidebar } from '../chat/components/DocumentSidebar';
import { Button, Tooltip } from '@nextui-org/react';
import { useNavigate } from 'react-router-dom';

export function ChatListPage() {
  const { data: chats, isLoading } = useQuery(getChats);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

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

  // Function to create a new chat
  const handleCreateNewChat = async () => {
    try {
      const newChat = await createChat({ title: 'New Chat' });
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

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
                onClick={handleCreateNewChat}
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
        <ChatSidebar 
          chats={chats || []} 
          isLoading={isLoading}
        />
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
