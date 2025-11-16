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
  conversationMessages: Message[];
  unreadCount: number;
  isConnected: boolean;
  sendMessage: (receiverId: string, content: string) => Promise<boolean>;
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
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const wsDisabled = useRef(false); // Circuit breaker to disable WebSocket if it keeps failing
  const HANDSHAKE_TIMEOUT_MS = 20000; // 20 seconds to allow for server session lookup (especially during cold starts)

  // Fetch conversations - with smart polling (only when WebSocket is disabled)
  const { data: conversationsData, refetch: refetchConversations } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: !!user?.id,
    // Fallback polling when WebSocket is disabled (circuit breaker activated)
    refetchInterval: (query) => {
      // If WebSocket is working, don't poll. If circuit breaker is active, fall back to polling every 30s
      return wsDisabled.current ? 30000 : false;
    },
  });

  // Get the other participant's ID from the active conversation
  const activeConversationData = conversations.find(conv => String(conv.id) === activeConversation);
  const otherParticipant = activeConversationData?.participants.find((p: any) => String(p.id || p) !== String(user?.id));
  const otherParticipantId = (otherParticipant as any)?.id || otherParticipant;

  // Fetch messages for active conversation - with smart polling
  const { data: conversationMessages = [] } = useQuery({
    queryKey: [`/api/messages/conversation/${otherParticipantId}`],
    enabled: !!user?.id && !!otherParticipantId,
    // Fallback polling when WebSocket is disabled - more frequent for active conversation
    refetchInterval: (query) => {
      // If WebSocket is working, don't poll. If circuit breaker is active, fall back to polling every 10s
      return wsDisabled.current ? 10000 : false;
    },
  });

  // Update conversations when data changes (with deep comparison to prevent infinite loops)
  useEffect(() => {
    if (conversationsData && Array.isArray(conversationsData)) {
      const currentConversationsJson = JSON.stringify(conversations);
      const newConversationsJson = JSON.stringify(conversationsData);
      if (currentConversationsJson !== newConversationsJson) {
        setConversations(conversationsData);
      }
    }
  }, [conversationsData, conversations]);

  // Update messages when conversation messages change (with deep comparison to prevent infinite loops)
  useEffect(() => {
    if (conversationMessages && Array.isArray(conversationMessages)) {
      const currentMessagesJson = JSON.stringify(messages);
      const newMessagesJson = JSON.stringify(conversationMessages);
      if (currentMessagesJson !== newMessagesJson) {
        setMessages(conversationMessages);
      }
    }
  }, [conversationMessages, messages]);

  // WebSocket connection management
  const connectWebSocket = () => {
    // Circuit breaker: Don't attempt connection if WebSocket has been disabled due to repeated failures
    if (wsDisabled.current) {
      console.log('[Messaging] WebSocket disabled due to repeated failures. Messaging will work via HTTP polling.');
      return;
    }

    if (!user?.id) {
      console.log('[Messaging] No user ID available for WebSocket connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[Messaging] WebSocket already connected');
      return;
    }

    try {
      // Improved WebSocket URL construction using same-origin approach
      let wsUrl: string;
      
      // Check for invalid host (development environment issues)
      if (!window.location.host || window.location.host.includes('undefined')) {
        console.warn('[Messaging] Invalid host detected, using fallback for development:', window.location.host);
        
        // For development fallback, ensure proper protocol handling
        const devProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const devHost = window.location.hostname;
        // Get port from current location or fallback to 5000
        const devPort = window.location.port || '5000';
        
        // Use ws: for local development to avoid TLS issues
        const protocol = devHost === 'localhost' ? 'ws:' : devProtocol;
        wsUrl = `${protocol}//${devHost}:${devPort}/ws?userId=${user.id}`;
      } else {
        // Use same-origin WebSocket URL for production/normal environments
        const wsBaseUrl = new URL('/ws', window.location.href);
        wsBaseUrl.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsBaseUrl.toString()}?userId=${user.id}`;
      }
      
      console.log('[Messaging] Attempting WebSocket connection...');
      console.log('[Messaging] Full WebSocket URL:', wsUrl);
      console.log('[Messaging] Current page URL:', window.location.href);
      
      wsRef.current = new WebSocket(wsUrl);
      
      // Set a connection timeout to warn about slow handshakes (but don't force close)
      const connectionTimeout = window.setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.warn(`[Messaging] WebSocket handshake still pending after ${HANDSHAKE_TIMEOUT_MS}ms; leaving socket open`);
        }
      }, HANDSHAKE_TIMEOUT_MS);

      wsRef.current.onopen = () => {
        console.log('[Messaging] WebSocket connected successfully');
        
        // Reset reconnection attempts on successful connection
        reconnectAttempts.current = 0;
        
        // Clear connection timeout
        clearTimeout(connectionTimeout);
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Server automatically authenticates via session cookie - no client message needed
        // Just wait for the connection_status message from server
        console.log('[Messaging] Waiting for automatic session authentication from server');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Messaging] Received WebSocket message:', data);
          
          // Handle authentication success
          if (data.type === 'connection_status' && data.data?.status === 'connected') {
            console.log('[Messaging] WebSocket authenticated successfully');
            setIsConnected(true);
          }
          // Handle authentication errors
          else if (data.type === 'error') {
            console.error('[Messaging] WebSocket error:', data.error);
            // Only disconnect on actual auth failures, not on AUTH_REQUIRED (which is just requesting auth)
            if (data.error?.code === 'AUTH_FAILED' || data.error?.code === 'NOT_AUTHENTICATED' || data.error?.code === 'AUTH_TIMEOUT') {
              console.error('[Messaging] Authentication failed, activating HTTP polling fallback');
              setIsConnected(false);
              
              // Activate circuit breaker to enable HTTP polling fallback
              wsDisabled.current = true;
              
              // Invalidate queries to trigger immediate refetch via HTTP polling
              queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
              if (otherParticipantId) {
                queryClient.invalidateQueries({ queryKey: [`/api/messages/conversation/${otherParticipantId}`] });
              }
              
              if (wsRef.current) {
                wsRef.current.close(1000, 'Authentication failed');
              }
            } else if (data.error?.code === 'AUTH_REQUIRED') {
              console.log('[Messaging] Server requesting authentication (token already sent)');
            }
          }
          // Handle incoming messages
          else if (data.type === 'message') {
            console.log('[Messaging] New message received:', data);
          }
        } catch (error) {
          console.error('[Messaging] Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('[Messaging] WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // If circuit breaker was already activated (e.g., by auth failure), don't reconnect
        if (wsDisabled.current) {
          console.log('[Messaging] Circuit breaker active - WebSocket disabled, using HTTP polling');
          // Ensure queries are invalidated to start polling
          queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
          return;
        }
        
        // Clean normal closure (1000) from server/client - don't reconnect unless circuit breaker
        if (event.code === 1000 && event.reason !== 'Authentication failed') {
          console.log('[Messaging] WebSocket closed normally.');
          return;
        }

        // Check if we've hit max reconnect attempts
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('[Messaging] Max reconnection attempts reached. Activating HTTP polling fallback.');
          wsDisabled.current = true; // Activate circuit breaker
          // Trigger immediate HTTP polling
          queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
          return;
        }
        
        // Attempt to reconnect after a delay if user is still logged in
        if (user?.id) {
          reconnectAttempts.current += 1;
          const backoffTime = Math.min(3000 * reconnectAttempts.current, 15000);
          console.log(`[Messaging] Scheduling reconnect attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${backoffTime}ms`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, backoffTime); // Exponential backoff with max 15s
        }
      };

      wsRef.current.onerror = (error) => {
        clearTimeout(connectionTimeout);
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
      // Reset reconnection attempts and circuit breaker when user changes
      reconnectAttempts.current = 0;
      wsDisabled.current = false;
      
      // Small delay before connecting to avoid race conditions during initialization
      const connectTimer = setTimeout(() => {
        connectWebSocket();
      }, 1000); // Wait 1 second after user is available
      
      return () => {
        clearTimeout(connectTimer);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
          wsRef.current.close(1000, 'Component unmounting');
        }
      };
    } else {
      // Disconnect when user logs out or is not authenticated
      if (wsRef.current) {
        wsRef.current.close(1000, 'User logged out');
        wsRef.current = null;
      }
      setIsConnected(false);
      
      // Clear any reconnection timeouts when user is invalid
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
  }, [user?.id]);

  const sendMessage = async (receiverId: string, content: string) => {
    try {
      // Get user ID from current user context for authentication
      let userId = null;
      try {
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          userId = userData.id;
        }
      } catch (e) {
        console.error('Error retrieving user data:', e);
      }

      // Enhanced headers for authentication compatibility
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-use-session': 'true',
          'x-client-auth': 'true',
          'x-auth-method': 'session',
          ...(userId ? { 'x-client-user-id': userId.toString() } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: parseInt(receiverId),
          content,
          messageType: 'text',
          category: 'marketplace'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Messaging] API Error:', response.status, errorData);
        throw new Error(`Failed to send message: ${response.status} - ${errorData}`);
      }

      const newMessage = await response.json();

      // Send WebSocket message for instant real-time updates
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const wsMessage = {
          type: 'message_sent',
          data: {
            id: newMessage.id,
            senderId: newMessage.senderId,
            receiverId: parseInt(receiverId),
            content,
            timestamp: new Date().toISOString(),
            messageType: 'text'
          }
        };
        wsRef.current.send(JSON.stringify(wsMessage));
      }

      // Async refresh - don't block UI
      setTimeout(() => {
        refreshConversations();
        queryClient.invalidateQueries({ queryKey: [`/api/messages/conversation/${receiverId}`] });
      }, 50);

      return true;

    } catch (error) {
      console.error('[Messaging] Failed to send message:', error);
      throw error;
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
    conversationMessages: Array.isArray(conversationMessages) ? conversationMessages : [],
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