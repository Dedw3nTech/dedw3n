import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface Conversation {
  id: number;
  participants: Array<{
    id: number;
    username: string;
    name?: string;
    avatar?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
}

export interface ConnectionError {
  code: string;
  message: string;
  persistent: boolean;
  timestamp: string;
  count: number;
}

export interface MessagingContextType {
  // Core state
  conversations: Conversation[];
  activeConversation: number | null;
  messages: Message[];
  unreadCount: number;
  
  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'failed';
  connectionErrors: ConnectionError[];
  hasPersisentErrors: boolean;
  
  // Methods
  sendMessage: (receiverId: number, content: string, attachmentUrl?: string) => Promise<void>;
  startConversation: (username: string, content: string) => Promise<void>;
  setActiveConversation: (conversationId: number | null) => void;
  markAsRead: (conversationId: number) => Promise<void>;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  clearConnectionErrors: () => void;
  retryConnection: () => void;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

interface MessagingProviderProps {
  children: React.ReactNode;
  user?: { id: number; username: string } | null;
}

export function MessagingProvider({ children, user }: MessagingProviderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Core state
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'failed'>('disconnected');
  const [connectionErrors, setConnectionErrors] = useState<ConnectionError[]>([]);
  
  // WebSocket management
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttempts = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000; // 1 second
  
  // Check if there are persistent errors
  const hasPersisentErrors = connectionErrors.some(error => error.persistent);
  
  // Fetch conversations
  const { data: conversationsData, refetch: refetchConversations } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 3;
    }
  });
  
  // Fetch messages for active conversation
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['/api/messages/conversations', activeConversation],
    enabled: !!user && !!activeConversation,
    refetchInterval: 5000, // Refetch every 5 seconds
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 3;
    }
  });
  
  // Fetch unread count
  const { data: unreadData, refetch: refetchUnread } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    enabled: !!user,
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: (failureCount, error: any) => {
      if (error?.status === 401) return false;
      return failureCount < 3;
    }
  });
  
  // Add connection error with persistence handling
  const addConnectionError = useCallback((error: Omit<ConnectionError, 'timestamp' | 'count'>) => {
    const timestamp = new Date().toISOString();
    
    setConnectionErrors(prev => {
      // Check if this error type already exists
      const existingErrorIndex = prev.findIndex(e => e.code === error.code);
      
      if (existingErrorIndex >= 0) {
        // Update existing error count and timestamp
        const updated = [...prev];
        updated[existingErrorIndex] = {
          ...updated[existingErrorIndex],
          count: updated[existingErrorIndex].count + 1,
          timestamp
        };
        return updated;
      } else {
        // Add new error
        const newError: ConnectionError = {
          ...error,
          timestamp,
          count: 1
        };
        
        // Keep only last 10 errors
        const updatedErrors = [...prev, newError].slice(-10);
        return updatedErrors;
      }
    });
    
    // Show persistent errors as toasts
    if (error.persistent) {
      toast({
        variant: "destructive",
        title: "Connection Issue",
        description: error.message,
        duration: 0, // Make it persistent until user dismisses
      });
    }
  }, [toast]);
  
  // Clear connection errors
  const clearConnectionErrors = useCallback(() => {
    setConnectionErrors([]);
  }, []);
  
  // WebSocket connection with enhanced error handling
  const connect = useCallback(() => {
    if (!user || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting...');
      return;
    }
    
    console.log('Attempting WebSocket connection...');
    setConnectionStatus('connecting');
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
        connectionAttempts.current = 0;
        
        // Clear connection-related errors
        setConnectionErrors(prev => prev.filter(error => 
          !['CONNECTION_ERROR', 'WEBSOCKET_FAILED', 'AUTH_FAILED'].includes(error.code)
        ));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message types
          switch (message.type) {
            case 'message':
              // Refresh conversations and messages
              refetchConversations();
              if (activeConversation) refetchMessages();
              refetchUnread();
              break;
              
            case 'error':
              if (message.error) {
                addConnectionError(message.error);
              }
              break;
              
            case 'connection_status':
              if (message.data?.status === 'connected') {
                setIsConnected(true);
                setConnectionStatus('connected');
              }
              break;
              
            default:
              console.log('Received WebSocket message:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          addConnectionError({
            code: 'MESSAGE_PARSE_ERROR',
            message: 'Failed to parse server message',
            persistent: false
          });
        }
      };
      
      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        if (event.code === 1006) {
          // Abnormal closure
          setConnectionStatus('error');
          addConnectionError({
            code: 'WEBSOCKET_ABNORMAL_CLOSURE',
            message: 'Connection lost unexpectedly - attempting to reconnect',
            persistent: true
          });
        } else {
          setConnectionStatus('disconnected');
        }
        
        // Attempt reconnection if not at max attempts
        if (connectionAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(2, connectionAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${connectionAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectionAttempts.current++;
            connect();
          }, delay);
        } else {
          setConnectionStatus('failed');
          addConnectionError({
            code: 'MAX_RECONNECT_ATTEMPTS',
            message: 'Unable to establish stable connection after multiple attempts',
            persistent: true
          });
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        
        addConnectionError({
          code: 'WEBSOCKET_ERROR',
          message: 'WebSocket connection error occurred',
          persistent: true
        });
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
      
      addConnectionError({
        code: 'WEBSOCKET_CREATION_FAILED',
        message: 'Failed to create WebSocket connection',
        persistent: true
      });
    }
  }, [user, activeConversation, refetchConversations, refetchMessages, refetchUnread, addConnectionError]);
  
  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    connectionAttempts.current = 0;
  }, []);
  
  // Retry connection manually
  const retryConnection = useCallback(() => {
    disconnect();
    connectionAttempts.current = 0;
    clearConnectionErrors();
    
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect, clearConnectionErrors]);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content, attachmentUrl }: { receiverId: number; content: string; attachmentUrl?: string }) => {
      return apiRequest(`/api/messages/conversations/${receiverId}`, {
        method: 'POST',
        body: { content, attachmentUrl }
      });
    },
    onSuccess: () => {
      refetchConversations();
      refetchMessages();
      refetchUnread();
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error);
      addConnectionError({
        code: 'MESSAGE_SEND_FAILED',
        message: 'Failed to send message - please try again',
        persistent: false
      });
      
      toast({
        variant: "destructive",
        title: "Message Failed",
        description: "Your message could not be sent. Please try again.",
      });
    }
  });
  
  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async ({ username, content }: { username: string; content: string }) => {
      return apiRequest('/api/messages/conversations', {
        method: 'POST',
        body: { recipientUsername: username, firstMessage: content }
      });
    },
    onSuccess: (data) => {
      refetchConversations();
      refetchUnread();
      
      // Set active conversation to the new one
      if (data.conversation?.id) {
        setActiveConversation(data.conversation.id);
      }
    },
    onError: (error: any) => {
      console.error('Failed to start conversation:', error);
      addConnectionError({
        code: 'CONVERSATION_START_FAILED',
        message: 'Failed to start conversation - please try again',
        persistent: false
      });
      
      toast({
        variant: "destructive",
        title: "Conversation Failed",
        description: "Could not start conversation. Please try again.",
      });
    }
  });
  
  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return apiRequest(`/api/messages/mark-read/${conversationId}`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      refetchConversations();
      refetchUnread();
    },
    onError: (error: any) => {
      console.error('Failed to mark as read:', error);
    }
  });
  
  // API methods
  const sendMessage = useCallback(async (receiverId: number, content: string, attachmentUrl?: string) => {
    await sendMessageMutation.mutateAsync({ receiverId, content, attachmentUrl });
  }, [sendMessageMutation]);
  
  const startConversation = useCallback(async (username: string, content: string) => {
    await startConversationMutation.mutateAsync({ username, content });
  }, [startConversationMutation]);
  
  const markAsRead = useCallback(async (conversationId: number) => {
    await markAsReadMutation.mutateAsync(conversationId);
  }, [markAsReadMutation]);
  
  // Auto-connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);
  
  // Context value
  const value: MessagingContextType = {
    // Core state
    conversations: conversationsData || [],
    activeConversation,
    messages: messagesData?.messages || [],
    unreadCount: unreadData?.count || 0,
    
    // Connection state
    isConnected,
    connectionStatus,
    connectionErrors,
    hasPersisentErrors,
    
    // Methods
    sendMessage,
    startConversation,
    setActiveConversation,
    markAsRead,
    
    // Connection management
    connect,
    disconnect,
    clearConnectionErrors,
    retryConnection
  };
  
  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

// Hook to use messaging context
export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}