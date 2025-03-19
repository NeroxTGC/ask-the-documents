import React, { useState, useRef, useEffect } from 'react';
import { useAction } from 'wasp/client/operations';
import { addMessage, generateChatResponse } from 'wasp/client/operations';
import { MessageItem } from './MessageItem';
import { ModelSelector } from './ModelSelector';
import { type Chat, type Message } from 'wasp/entities';

type ChatWindowProps = {
  chat: Chat & { messages: Message[] };
  isLoading?: boolean;
};

export function ChatWindow({ chat, isLoading = false }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const addMessageFn = useAction(addMessage);
  const generateResponseFn = useAction(generateChatResponse);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isGenerating) return;
    
    try {
      setIsGenerating(true);

      // Generate response
      await generateResponseFn({
        chatId: chat.id,
        message: message.trim(),
        modelType: selectedModel
      });

      // Clear the input field
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex justify-between items-center">
        <h1 className="font-medium truncate">{chat.title}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-900">
        {chat.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Start a new conversation</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose a model and send a message to begin
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chat.messages.map((msg: Message) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <ModelSelector 
              selectedModel={selectedModel} 
              onChange={setSelectedModel} 
            />
            
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
