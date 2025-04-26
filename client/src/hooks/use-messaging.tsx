import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Message types for the WebSocket
interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// User interface
interface User {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
}

// Message interface
interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  chatType?: string;
  roomId?: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export function useMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [activeConversations, setActiveConversations] = useState<{[key: number]: Message[]}>({});
  const socketRef = useRef<WebSocket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate with the WebSocket server
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message:', message);
        
        switch (message.type) {
          case 'online_users':
            setOnlineUsers(message.users);
            break;
            
          case 'user_online':
            setOnlineUsers(prev => [...prev, message.userId]);
            break;
            
          case 'user_offline':
            setOnlineUsers(prev => prev.filter(id => id !== message.userId));
            break;
            
          case 'new_message':
            // Update unread count
            if (message.message.receiverId === user.id && !message.message.isRead) {
              setUnreadCount(prev => prev + 1);
              
              // Show notification toast
              toast({
                title: 'New Message',
                description: message.message.content.length > 30 
                  ? message.message.content.substring(0, 30) + '...' 
                  : message.message.content,
              });
            }
            
            // Update active conversations
            const senderId = message.message.senderId;
            setActiveConversations(prev => ({
              ...prev,
              [senderId]: [...(prev[senderId] || []), message.message]
            }));
            
            // Invalidate queries to update UI
            queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
            break;
            
          case 'message_sent':
            // Message sent confirmation handling
            break;
            
          case 'read_receipt':
            // Read receipt handling
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    socketRef.current = socket;
    
    // Fetch initial unread count
    fetch('/api/messages/unread/count')
      .then(res => res.json())
      .then(data => {
        setUnreadCount(data.count);
      })
      .catch(err => {
        console.error('Error fetching unread count:', err);
      });
    
    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, [user, queryClient, toast]);
  
  // Send a message via WebSocket
  const sendMessage = (recipientId: number, content: string, chatType: string = 'private', attachmentUrl?: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: 'Connection Error',
        description: 'Not connected to messaging server',
        variant: 'destructive',
      });
      return;
    }
    
    const messageData = {
      type: 'message',
      recipientId,
      content,
      chatType,
      attachmentUrl,
      attachmentType: attachmentUrl ? 
        (attachmentUrl.startsWith('data:image/') ? 'image' : 
         attachmentUrl.startsWith('data:video/') ? 'video' : 'file') : 
        undefined
    };
    
    socketRef.current.send(JSON.stringify(messageData));
  };
  
  // Mark messages as read
  const markAsRead = (messageIds: number[], senderId: number) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    
    // Send read receipt via WebSocket
    socketRef.current.send(JSON.stringify({
      type: 'read_receipt',
      messageIds,
      senderId,
    }));
    
    // Update local unread count
    setUnreadCount(prev => Math.max(0, prev - messageIds.length));
    
    // Update server via API
    fetch('/api/messages/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageIds }),
    }).catch(err => {
      console.error('Error marking messages as read:', err);
    });
  };
  
  return {
    isConnected,
    unreadCount,
    onlineUsers,
    activeConversations,
    sendMessage,
    markAsRead,
  };
}