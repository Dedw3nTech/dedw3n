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

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);

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

    ws.onclose = (e) => {
      setIsConnected(false);
      console.log('WebSocket connection closed', e.code, e.reason);

      // Attempt to reconnect unless maximum attempts reached
      if (reconnectAttempt < maxReconnectAttempts) {
        setTimeout(() => {
          setReconnectAttempt((prev) => prev + 1);
          connectWebSocket();
        }, reconnectInterval);
      } else {
        toast({
          title: 'Connection lost',
          description: 'Failed to reconnect to messaging service. Please refresh the page.',
          variant: 'destructive',
        });
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'Connection error',
        description: 'There was an error with the messaging service.',
        variant: 'destructive',
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'message':
            // Invalidate query cache for the conversation and unread count
            queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', data.senderId] });
            queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/messages/unread'] });

            // Show toast notification for new message if not from current user
            if (data.senderId !== user.id) {
              toast({
                title: data.senderName,
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

          case 'read_receipt':
            // Invalidate query cache for the conversation
            queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', data.userId] });
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user, reconnectAttempt, toast]);

  useEffect(() => {
    if (user) {
      connectWebSocket();
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user, connectWebSocket]);

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