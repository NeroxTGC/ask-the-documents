import React, { useState, useRef, useEffect } from 'react';
import { useAction } from 'wasp/client/operations';
import { addMessage, generateChatResponse } from 'wasp/client/operations';
import { MessageItem } from './MessageItem';
import { DeleteChatButton } from './DeleteChatButton';
import { type Chat, type Message } from 'wasp/entities';
import { Button, Textarea, Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";

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
        <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-800">
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {chat?.title || 'Chat'}
        </h2>
        <div className="flex items-center gap-2">
          <DeleteChatButton 
            chatId={chat.id} 
            onDelete={onChatDeleted}
          />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-800">
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

      {/* Input form - Using modified HomeChatInput */}
      <div className="flex justify-center items-center py-4">
        <div className="max-w-lg w-full mx-auto">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message DeepSeek"
                disabled={isGenerating}
                className="w-full border-0 focus:ring-0 focus:outline-none min-h-[100px]"
                classNames={{
                  inputWrapper: [
                    "bg-gray-100 dark:bg-gray-700",
                    "shadow-none",
                    "border-0",
                    "!ring-0",
                    "!ring-offset-0",
                    "hover:!bg-gray-100 dark:hover:!bg-gray-700",
                    "data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-gray-700",
                    "group-data-[focus=true]:bg-gray-100 dark:group-data-[focus=true]:bg-gray-700"
                  ].join(" "),
                  input: "focus:bg-gray-100 dark:focus:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              <div className="flex items-center gap-2 px-3 py-3 bg-gray-100 dark:bg-gray-700">
                <Button
                  type="button"
                  onClick={() => setSelectedModel(selectedModel === 'deepseek-chat' ? 'deepseek-reasoner' : 'deepseek-chat')}
                  className={`px-3 py-1 text-xs rounded-full transition-all ${
                    selectedModel === 'deepseek-reasoner' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                  }`}
                  size="sm"
                  startContent={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 12a11 11 0 0 1-22 0 11 11 0 0 1 22 0z"></path>
                      <path d="M22 12h1"></path>
                      <path d="M12 2V1"></path>
                      <path d="M12 23v-1"></path>
                      <path d="M20 20l-1-1"></path>
                      <path d="M1 12h1"></path>
                      <path d="M4 4l1 1"></path>
                      <path d="M4 20l1-1"></path>
                      <path d="M20 4l-1 1"></path>
                    </svg>
                  }
                >
                  DeepThink (R1)
                </Button>
                
                <Popover placement="top" showArrow={true}>
                  <PopoverTrigger>
                    <span>
                      <Button
                        type="button"
                        onClick={() => setUseRag(!useRag)}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          useRag 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                        }`}
                        size="sm"
                        startContent={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <line x1="10" y1="9" x2="8" y2="9"></line>
                          </svg>
                        }
                      >
                        Use Docs
                      </Button>
                    </span>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="px-1 py-2 w-72">
                      <div className="text-sm font-bold">Documents</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {useRag ? 'RAG enabled. Using your documents for context.' : 'RAG disabled. Enable to use your documents.'}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="ml-auto">
                  <Button
                    type="submit"
                    isIconOnly
                    disabled={!message.trim() || isGenerating}
                    className={`rounded-full flex items-center justify-center ${
                      !message.trim() || isGenerating 
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-text'
                        : 'bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white shadow-sm'
                    } w-7 h-7 min-w-0 p-0`}
                    size="sm"
                  >
                    {isGenerating ? (
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                      </div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 p-3">
            Press <span className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Enter</span> to send or <span className="font-mono px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">Shift+Enter</span> for a new line
          </p>
        </div>
      </div>
    </div>
  );
}
