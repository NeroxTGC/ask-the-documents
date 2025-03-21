import React from 'react';
import { useAction } from 'wasp/client/operations';
import { createChat } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip } from '@nextui-org/react';

export interface CreateChatButtonProps {
  onChatCreated?: (chatId: string) => void;
  isCompact?: boolean;
}

export function CreateChatButton({ onChatCreated, isCompact = false }: CreateChatButtonProps) {
  const navigate = useNavigate();
  const createChatFn = useAction(createChat);

  const handleNewChat = async () => {
    try {
      const newChat = await createChatFn({
        title: 'New Chat',
      });
      
      // If callback provided, call it with the new chat ID
      if (onChatCreated) {
        onChatCreated(newChat.id);
      } else {
        // Otherwise, redirect to the new chat
        navigate(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  if (isCompact) {
    return (
      <Tooltip content="New Chat" placement="right">
        <Button
          isIconOnly
          variant="light"
          onClick={handleNewChat}
          className="w-7 h-7 min-w-0 p-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </Button>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={handleNewChat}
      className="w-full flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      New Chat
    </button>
  );
}
