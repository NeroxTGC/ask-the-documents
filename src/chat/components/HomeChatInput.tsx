import React, { useState } from "react";
import { useQuery } from "wasp/client/operations";
import { createChat, generateChatResponse } from "wasp/client/operations";
import { useNavigate } from "react-router-dom";
import { Button, Textarea, Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import { type Chat } from "wasp/entities";

export function HomeChatInput() {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek-chat');
  const [useRag, setUseRag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isLoading) return;
    
    try {
      setIsLoading(true);
      
      // First, create a new chat
      const newChat = await createChat({
        title: message.trim().substring(0, 50) // Use first 50 chars of message as chat title
      }) as Chat;
      
      // Generate response in the new chat
      await generateChatResponse({
        chatId: newChat.id,
        message: message.trim(),
        modelType: selectedModel,
        useRag,
        systemPrompt: '' // Using default system prompt
      });
      
      // Navigate to the new chat
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error creating new chat and sending message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        <div className="relative bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message DeepSeek"
            disabled={isLoading}
            className="w-full border-0 focus:ring-0 focus:outline-none min-h-[100px]"
            classNames={{
              inputWrapper: [
                "bg-transparent",
                "shadow-none",
                "border-0",
                "!ring-0",
                "!ring-offset-0",
                "hover:!bg-transparent",
                "data-[hover=true]:bg-transparent",
                "group-data-[focus=true]:bg-transparent"
              ].join(" "),
              input: "focus:bg-transparent dark:focus:bg-transparent hover:bg-transparent dark:hover:bg-transparent"
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          
          <div className="mt-2 flex items-center gap-2 px-3 py-3 border-t border-gray-200 dark:border-gray-800">
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
                <Button
                  type="button"
                  onClick={() => setUseRag(!useRag)}
                  className={`px-3 py-1 text-xs rounded-full transition-all ${
                    useRag 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600' 
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
                disabled={!message.trim() || isLoading}
                className={`rounded-full flex items-center justify-center ${
                  !message.trim() || isLoading 
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white shadow-sm'
                } w-7 h-7 min-w-0 p-0`}
                size="sm"
              >
                {isLoading ? (
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
        </div>
      </form>
    </div>
  );
}
