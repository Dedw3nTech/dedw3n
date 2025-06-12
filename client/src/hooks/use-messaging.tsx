import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './use-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  refreshConversations: () => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations
  const { data: conversationsData, refetch: refetchConversations } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update conversations when data changes
  useEffect(() => {
    if (conversationsData && Array.isArray(conversationsData)) {
      setConversations(conversationsData);
    }
  }, [conversationsData]);

  // WebSocket connection management
  const connectWebSocket = () => {
    if (!user?.id) {
      console.log('[Messaging] No user ID available for WebSocket connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[Messaging] WebSocket already connected');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
      
      console.log('[Messaging] Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[Messaging] WebSocket connected successfully');
        setIsConnected(true);
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Messaging] Received WebSocket message:', data);
          
          if (data.type === 'connection_status' && data.data?.status === 'connected') {
            setIsConnected(true);
          } else if (data.type === 'message') {
            // Handle incoming message
            console.log('[Messaging] New message received:', data);
          }
        } catch (error) {
          console.error('[Messaging] Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('[Messaging] WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect after a delay if user is still logged in
        if (user?.id && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[Messaging] Attempting to reconnect WebSocket...');
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[Messaging] WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('[Messaging] Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  // Connect when user is available
  useEffect(() => {
    if (user?.id) {
      connectWebSocket();
    } else {
      // Disconnect when user logs out
      if (wsRef.current) {
        wsRef.current.close(1000, 'User logged out');
        wsRef.current = null;
      }
      setIsConnected(false);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [user?.id]);

  const sendMessage = async (receiverId: string, content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('[Messaging] WebSocket not connected');
      return;
    }

    try {
      const message = {
        type: 'message',
        data: {
          receiverId: parseInt(receiverId),
          content,
          timestamp: new Date().toISOString()
        }
      };

      wsRef.current.send(JSON.stringify(message));
      console.log('[Messaging] Message sent:', message);
    } catch (error) {
      console.error('[Messaging] Failed to send message:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    console.log('[Messaging] Marking conversation as read:', conversationId);
    // Implementation for marking messages as read
  };

  const refreshConversations = () => {
    refetchConversations();
    queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
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
    refreshConversations,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}