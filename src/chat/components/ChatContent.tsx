import React from 'react';
import { ChatContent as ChatContentComponent } from './chat-content/ChatContent';
import { type Chat, type Message } from 'wasp/entities';

interface ChatContentProps {
  chatId?: string;
  chat?: Chat & { messages: Message[] };
  isChatLoading: boolean;
  chatError?: Error | null;
  systemPrompt: string;
  onChatDeleted: () => void;
}

export function ChatContent(props: ChatContentProps) {
  return <ChatContentComponent {...props} />;
}
