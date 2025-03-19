import React, { useState, useRef, useEffect } from 'react';
import { useAction } from 'wasp/client/operations';
import { addMessage, generateChatResponse } from 'wasp/client/operations';
import { MessageItem } from './MessageItem';
import { ModelSelector } from './ModelSelector';
import { DeleteChatButton } from './DeleteChatButton';
import { type Chat, type Message } from 'wasp/entities';

export type ChatWindowProps = {
  chat: Chat & { messages: Message[] };
  isLoading?: boolean;
  onChatDeleted?: () => void;
  systemPrompt?: string;
};

export function ChatWindow({ chat, isLoading = false, onChatDeleted, systemPrompt = '' }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [useRag, setUseRag] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const addMessageFn = useAction(addMessage);
  const generateResponseFn = useAction(generateChatResponse);

  // Initialize local messages from chat messages
  useEffect(() => {
    if (chat?.messages) {
      setLocalMessages(chat.messages);
    }
  }, [chat?.messages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isGenerating) return;
    
    try {
      // Immediately add user message to local state
      const userMessage: Partial<Message> = {
        id: `temp-${Date.now()}`,
        content: message.trim(),
        role: 'user',
        modelType: selectedModel,
        useRag: useRag,
        chatId: chat.id,
        createdAt: new Date(),
      };
      
      // Update local messages immediately
      setLocalMessages(prev => [...prev, userMessage as Message]);
      
      // Clear the input field immediately
      setMessage('');
      
      // Set generating state
      setIsGenerating(true);

      // Generate response in the background
      generateResponseFn({
        chatId: chat.id,
        message: message.trim(),
        modelType: selectedModel,
        useRag: useRag,
        systemPrompt: systemPrompt || ''
      }).catch(error => {
        console.error('Error generating response:', error);
      }).finally(() => {
        setIsGenerating(false);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-900">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-2">
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2 ml-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Combine chat messages with local temporary messages
  const displayMessages = [...localMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Filtrar el mensaje inicial "How can I help you today?" cuando hay otros mensajes
  const filteredMessages = displayMessages.filter(msg => {
    // Si hay más de un mensaje y este es el mensaje de sistema inicial, lo ocultamos
    if (
      msg.role === 'system' && 
      msg.content === 'How can I help you today?' && 
      displayMessages.some(m => m.role !== 'system')
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {chat?.title || 'Chat'}
        </h2>
        <div className="flex items-center gap-2">
          <ModelSelector 
            selectedModel={selectedModel} 
            useRag={useRag}
            onSelectModel={setSelectedModel}
            onToggleRag={setUseRag}
          />
          <DeleteChatButton 
            chatId={chat.id} 
            onDelete={onChatDeleted}
          />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.map((msg: Message) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        {isGenerating && (
          <div className="flex items-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            {isGenerating && (
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none border border-gray-300 dark:border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              disabled={isGenerating}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!message.trim() || isGenerating}
              className={`
                px-4 py-2 rounded-md text-white
                ${!message.trim() || isGenerating
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
