import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './use-auth';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}

interface MessagingContextType {
  conversations: Conversation[];
  activeConversation: string | null;
  messages: Message[];
  unreadCount: number;
  isConnected: boolean;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Simple messaging implementation - will be enhanced later
  const sendMessage = async (receiverId: string, content: string) => {
    // Placeholder implementation
    console.log('Sending message:', { receiverId, content });
  };

  const markAsRead = async (conversationId: string) => {
    // Placeholder implementation
    console.log('Marking as read:', conversationId);
  };

  const value: MessagingContextType = {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isConnected,
    sendMessage,
    markAsRead,
    setActiveConversation,
  };

  return { value, children } as any; // Temporary placeholder to fix import error
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}