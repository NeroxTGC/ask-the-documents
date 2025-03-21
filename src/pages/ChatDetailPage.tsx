import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, getChat, getChats, createChat } from 'wasp/client/operations';
import { ChatSidebar } from '../chat/components/ChatSidebar';
import { ChatWindow } from '../chat/components/ChatWindow';
import { DocumentSidebar } from '../chat/components/DocumentSidebar';
import { Button, Tooltip } from '@nextui-org/react';

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

  // Function to create a new chat
  const handleCreateNewChat = async () => {
    try {
      const newChat = await createChat({ title: 'New Chat' });
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  // If no id, don't render the rest
  if (!chatId) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar - Chats */}
      <ChatSidebar 
        chats={chats || []} 
        isLoading={isChatsLoading}
        selectedChatId={chatId}
        onChatDeleted={handleChatDeleted}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        defaultSystemPrompt={DEFAULT_SYSTEM_PROMPT}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
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
      
      {/* Right Sidebar - Documents */}
      <DocumentSidebar />
    </div>
  );
}
