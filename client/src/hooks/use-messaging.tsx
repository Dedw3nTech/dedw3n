import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface MessagingContextType {
  sendMessage: (receiverId: number, content: string, attachmentUrl?: string, attachmentType?: string) => Promise<void>;
  markAsRead: (messageId: number) => Promise<void>;
  onlineUsers: number[];
  typingUsers: Record<number, boolean>;
  sendTypingStatus: (receiverId: number, isTyping: boolean) => void;
  isConnected: boolean;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000; // 3 seconds

  const connectWebSocket = useCallback(() => {
    if (!user) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket at:', wsUrl);
      
      // Create new WebSocket connection
      const ws = new WebSocket(wsUrl);
      
      // Set the socket immediately to keep a reference to it
      setSocket(ws);

      // Handle connection opened
      ws.onopen = () => {
        setIsConnected(true);
        setReconnectAttempt(0);
        console.log('WebSocket connection established');

        // Send authentication message
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      };

      // Handle connection closed
      ws.onclose = (e) => {
        setIsConnected(false);
        console.log('WebSocket connection closed', e.code, e.reason);

        // Attempt to reconnect unless maximum attempts reached
        if (reconnectAttempt < maxReconnectAttempts) {
          const reconnectDelay = reconnectInterval * (Math.pow(1.5, reconnectAttempt) || 1);
          console.log(`Attempting to reconnect in ${reconnectDelay}ms (attempt ${reconnectAttempt + 1}/${maxReconnectAttempts})`);
          
          setTimeout(() => {
            setReconnectAttempt((prev) => prev + 1);
            connectWebSocket();
          }, reconnectDelay);
        } else {
          toast({
            title: 'Connection lost',
            description: 'Failed to reconnect to messaging service. Please refresh the page.',
            variant: 'destructive',
          });
        }
      };

      // Handle connection errors
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't show toast on every error as they're often followed by onclose events
        // which will handle reconnection
      };

      // Handle incoming messages
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket received:', data.type);

          switch (data.type) {
            case 'new_message':
              // This is the message type sent by our new server implementation
              // Invalidate query cache for the conversation and unread count
              queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', data.message.senderId] });
              queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
              queryClient.invalidateQueries({ queryKey: ['/api/messages/unread'] });

              // Show toast notification for new message if not from current user
              if (data.message.senderId !== user.id) {
                toast({
                  title: data.message.senderName || 'New message',
                  description: data.message.content.length > 30 
                    ? data.message.content.substring(0, 30) + '...' 
                    : data.message.content,
                });
              }
              break;
              
            case 'message':
              // Backwards compatibility with old message type
              // Invalidate query cache for the conversation and unread count
              queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', data.senderId] });
              queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
              queryClient.invalidateQueries({ queryKey: ['/api/messages/unread'] });

              // Show toast notification for new message if not from current user
              if (data.senderId !== user.id) {
                toast({
                  title: data.senderName || 'New message',
                  description: data.content.length > 30 
                    ? data.content.substring(0, 30) + '...' 
                    : data.content,
                });
              }
              break;

            case 'typing':
              setTypingUsers(prev => ({
                ...prev,
                [data.senderId]: data.isTyping
              }));
              break;

            case 'online_users':
              setOnlineUsers(data.users || []);
              break;

            case 'user_online':
              setOnlineUsers(prev => {
                if (!prev.includes(data.userId)) {
                  return [...prev, data.userId];
                }
                return prev;
              });
              break;
              
            case 'user_offline':
              setOnlineUsers(prev => prev.filter(id => id !== data.userId));
              break;

            case 'read_receipt':
              // Handle both single messageId and messageIds array
              if (data.messageId) {
                queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', data.userId] });
              } else if (data.messageIds && data.readBy) {
                queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', data.readBy] });
              }
              break;
              
            case 'message_sent':
              // Confirmation that a message was sent and saved
              console.log('Message sent confirmation:', data.messageId);
              break;
              
            case 'ping':
              // Respond to server ping to keep connection alive
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'pong' }));
              }
              break;
              
            case 'error':
              console.error('WebSocket error from server:', data.message);
              toast({
                title: 'Messaging error',
                description: data.message,
                variant: 'destructive',
              });
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      toast({
        title: 'Connection error',
        description: 'Failed to connect to messaging service. Please try again later.',
        variant: 'destructive',
      });
    }

    // Return cleanup function
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user, reconnectAttempt, toast, queryClient]);

  useEffect(() => {
    if (user) {
      connectWebSocket();
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user, connectWebSocket, socket]);

  const sendMessage = async (
    receiverId: number, 
    content: string, 
    attachmentUrl?: string, 
    attachmentType?: string
  ) => {
    if (!user) return;

    try {
      // Send message to server via API
      await apiRequest('POST', '/api/messages', {
        receiverId,
        content,
        attachmentUrl,
        attachmentType
      });

      // Also send via WebSocket for real-time delivery
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'message',
          receiverId,
          content,
          attachmentUrl,
          attachmentType
        }));
      }

      // Invalidate query cache for the conversation
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', receiverId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error sending message',
        description: 'Your message could not be sent. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const markAsRead = async (messageId: number) => {
    if (!user) return;

    try {
      // Mark message as read via API
      await apiRequest('POST', `/api/messages/${messageId}/read`, {});

      // Also send via WebSocket for real-time delivery
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'read_receipt',
          messageId
        }));
      }

      // Invalidate query cache for conversations and unread count
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread'] });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendTypingStatus = (receiverId: number, isTyping: boolean) => {
    if (!user || !socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify({
      type: 'typing',
      receiverId,
      isTyping
    }));
  };

  return (
    <MessagingContext.Provider
      value={{
        sendMessage,
        markAsRead,
        onlineUsers,
        typingUsers,
        sendTypingStatus,
        isConnected
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};