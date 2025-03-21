import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, getChat, getChats, createChat } from 'wasp/client/operations';
import { ChatList } from '../chat/components/ChatList';
import { ChatWindow } from '../chat/components/ChatWindow';
import { UserStatus } from '../chat/components/UserStatus';
import { ThemeSwitch } from '../chat/components/ThemeSwitch';
import { SystemPromptEditor } from '../chat/components/SystemPromptEditor';
import { DocumentSidebar } from '../chat/components/DocumentSidebar';
import { Button, Tooltip } from '@nextui-org/react';

export function ChatDetailPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [systemPrompt, setSystemPrompt] = useState('');
  const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant that provides clear and concise answers.";
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  
  // Redirect if no id
  useEffect(() => {
    if (!chatId) {
      navigate('/chat');
    }
  }, [chatId, navigate]);
  
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
              chats={chats || []} 
              isLoading={isChatsLoading} 
              selectedChatId={chatId} 
              onChatDeleted={handleChatDeleted}
            />
          </div>
          <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
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
      )}

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
