import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getChats, getChat } from 'wasp/client/operations';
import { ChatSidebar } from '../chat/components/ChatSidebar';
import { DocumentSidebar } from '../chat/components/DocumentSidebar';
import { ChatContent } from '../chat/components/ChatContent';

// Hook personalizado para manejar la lógica del chat
function useChatLogic() {
  const { id: chatId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [systemPrompt, setSystemPrompt] = useState('');
  const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant that provides clear and concise answers.";
  
  // Get all chats
  const { 
    data: chats,
    isLoading: isChatsLoading,
    refetch: refetchChats
  } = useQuery(getChats);
  
  // Get specific chat if ID is provided
  const { 
    data: chat,
    isLoading: isChatLoading,
    error: chatError
  } = useQuery(getChat, 
    { id: chatId || '' }, 
    { enabled: !!chatId }
  );
  
  // Handle chat deletion
  const handleChatDeleted = () => {
    refetchChats();
    navigate('/chat');
  };
  
  // Verificar si necesitamos redirigir cuando no se encuentra el chat o hay un error
  React.useEffect(() => {
    if (chatId && ((!isChatLoading && !chat) || chatError)) {
      console.log('Redirecting to /chat due to missing chat or error', { chat, chatError });
      navigate('/chat');
    }
  }, [chat, isChatLoading, chatError, navigate, chatId]);
  
  return {
    chatId,
    chats,
    chat,
    isChatsLoading,
    isChatLoading,
    chatError,
    systemPrompt,
    setSystemPrompt,
    DEFAULT_SYSTEM_PROMPT,
    handleChatDeleted
  };
}

export function ChatPage() {
  const {
    chatId,
    chats,
    chat,
    isChatsLoading,
    isChatLoading,
    chatError,
    systemPrompt,
    setSystemPrompt,
    DEFAULT_SYSTEM_PROMPT,
    handleChatDeleted
  } = useChatLogic();

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
        <ChatContent 
          chatId={chatId}
          chat={chat}
          isChatLoading={isChatLoading}
          chatError={chatError}
          systemPrompt={systemPrompt}
          onChatDeleted={handleChatDeleted}
        />
      </div>
      
      {/* Right Sidebar - Documents */}
      <DocumentSidebar />
    </div>
  );
}
