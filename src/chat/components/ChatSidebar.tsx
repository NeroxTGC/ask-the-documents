import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip } from '@nextui-org/react';
import { createChat } from 'wasp/client/operations';
import { ChatList } from './ChatList';
import { UserStatus } from './UserStatus';
import { ThemeSwitch } from './ThemeSwitch';
import { SystemPromptEditor } from './SystemPromptEditor';

interface ChatSidebarProps {
  chats: any[];
  isLoading: boolean;
  selectedChatId?: string;
  onChatDeleted?: () => void;
  systemPrompt?: string;
  onSystemPromptChange?: (prompt: string) => void;
  defaultSystemPrompt?: string;
}

export function ChatSidebar({
  chats = [],
  isLoading,
  selectedChatId,
  onChatDeleted,
  systemPrompt,
  onSystemPromptChange,
  defaultSystemPrompt,
}: ChatSidebarProps) {
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

  if (isLeftSidebarCollapsed) {
    return (
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
    );
  }
  
  return (
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
        <ChatList 
          chats={chats} 
          isLoading={isLoading} 
          selectedChatId={selectedChatId} 
          onChatDeleted={onChatDeleted}
        />
      </div>
      <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <ThemeSwitch />
          {systemPrompt !== undefined && onSystemPromptChange && defaultSystemPrompt && (
            <SystemPromptEditor 
              systemPrompt={systemPrompt}
              defaultSystemPrompt={defaultSystemPrompt}
              onSystemPromptChange={onSystemPromptChange}
            />
          )}
        </div>
        <UserStatus />
      </div>
    </div>
  );
}
