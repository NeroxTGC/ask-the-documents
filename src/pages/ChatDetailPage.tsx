import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, getChat, getChats } from 'wasp/client/operations';
import { ChatList } from '../chat/components/ChatList';
import { ChatWindow } from '../chat/components/ChatWindow';
import { UserStatus } from '../chat/components/UserStatus';
import { ThemeSwitch } from '../chat/components/ThemeSwitch';
import { NewChatButton } from '../chat/components/NewChatButton';
import { SystemPromptEditor } from '../chat/components/SystemPromptEditor';

export function ChatDetailPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [systemPrompt, setSystemPrompt] = useState('');
  const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant that provides clear and concise answers.";
  
  // Redirect if no id
  useEffect(() => {
    if (!chatId) {
      navigate('/chat');
    }
  }, [chatId, navigate]);
  
  const { 
    data: chats, 
    isLoading: isChatsLoading,
    refetch: refetchChats
  } = useQuery(getChats);
  
  const { 
    data: chat, 
    isLoading: isChatLoading, 
    error 
  } = useQuery(getChat, { id: chatId || '' }, { enabled: !!chatId });

  // Redirect to /chat if chat not found or error
  useEffect(() => {
    if ((!isChatLoading && !chat) || error) {
      console.log('Redirecting to /chat due to missing chat or error', { chat, error });
      navigate('/chat');
    }
  }, [chat, isChatLoading, error, navigate]);

  // Handle chat deletion - ahora solo refresca la lista de chats
  const handleChatDeleted = () => {
    refetchChats();
    // No hacemos nada más porque DeleteChatButton ya redirecciona a /chat
  };

  // Handle new chat creation
  const handleChatCreated = (newChatId: string) => {
    navigate(`/chat/${newChatId}`);
  };

  // If no id, don't render the rest
  if (!chatId) return null;

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
        <div className="flex-1 overflow-y-auto">
          <ChatList 
            chats={chats || []} 
            isLoading={isChatsLoading} 
            selectedChatId={chatId} 
            onChatDeleted={handleChatDeleted}
          />
        </div>
        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <ThemeSwitch />
            <SystemPromptEditor 
              systemPrompt={systemPrompt}
              defaultSystemPrompt={DEFAULT_SYSTEM_PROMPT}
              onSystemPromptChange={setSystemPrompt}
            />
          </div>
          <UserStatus />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {error ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-red-500 text-center">
              <p>Error loading chat</p>
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
          <ChatWindow 
            chat={chat} 
            isLoading={isChatLoading} 
            onChatDeleted={handleChatDeleted}
            systemPrompt={systemPrompt}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Redirecting...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
