import React, { useState } from 'react';
import { Button, Tooltip } from '@nextui-org/react';
import { useAction } from 'wasp/client/operations';
import { createChat } from 'wasp/client/operations';
import { ChatHistory } from './chat-sidebar/ChatHistory';
import { UserProfileButton } from './chat-sidebar/UserProfileButton';
import { ThemeToggle } from './chat-sidebar/ThemeToggle';
import { PromptTemplateEditor } from './chat-sidebar/PromptTemplateEditor';

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
  systemPrompt = '',
  onSystemPromptChange = () => {},
  defaultSystemPrompt = ''
}: ChatSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside 
      className={`flex flex-col ${isCollapsed ? 'w-16' : 'w-72'} border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 transition-all duration-200 ease-in-out h-screen`}
    >
      {/* Header */}
      <div className="flex items-center p-4 h-16 border-b border-gray-200 dark:border-gray-800">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-800 dark:text-white mr-auto">Chats</h1>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onClick={toggleSidebar}
          className="ml-auto"
        >
          {isCollapsed ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </Button>
      </div>

      {/* Chat History */}
      {!isCollapsed ? (
        <ChatHistory 
          chats={chats} 
          isLoading={isLoading} 
          selectedChatId={selectedChatId}
          onChatDeleted={onChatDeleted}
        />
      ) : (
        <div className="flex flex-col items-center p-4">
          {/* Compact Create Chat Button */}
          <div className="mb-4">
            <Tooltip content="New Chat" placement="right">
              <Button
                isIconOnly
                size="sm"
                color="primary"
                variant="flat"
                onClick={async () => {
                  try {
                    const createChatFn = useAction(createChat);
                    const newChat = await createChatFn({
                      title: 'New Chat',
                    });
                    window.location.href = `/chat/${newChat.id}`;
                  } catch (error) {
                    console.error('Error creating new chat:', error);
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </Button>
            </Tooltip>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-auto">
        {!isCollapsed ? (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex justify-between items-center">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <PromptTemplateEditor 
                  systemPrompt={systemPrompt}
                  defaultSystemPrompt={defaultSystemPrompt}
                  onSystemPromptChange={onSystemPromptChange}
                />
              </div>
            </div>
            <UserProfileButton />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 p-4 border-t border-gray-200 dark:border-gray-800">
            <ThemeToggle isCompact />
            <UserProfileButton isCompact />
          </div>
        )}
      </div>
    </aside>
  );
}
