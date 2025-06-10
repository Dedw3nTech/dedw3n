import { useState, useEffect, useRef, FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Phone, 
  Video, 
  Users,
  Globe,
  User,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  isRead: boolean;
  messageType: string;
  category: string;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
}

interface Conversation {
  id: number;
  otherUser: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

interface CommunityMessagingProps {
  embedded?: boolean;
  initialUserId?: number;
}

export function CommunityMessaging({ embedded = false, initialUserId }: CommunityMessagingProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<'conversations' | 'chat'>('conversations');
  const [activeChat, setActiveChat] = useState<number | null>(initialUserId || null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch community conversations
  const { data: conversations = [], isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/messages/conversations/community'],
    enabled: user !== null,
  });

  // Fetch community messages for active chat
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages/between', activeChat],
    enabled: activeChat !== null,
  });

  // Fetch unread count for community
  const { data: unreadData, refetch: refetchUnread } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread/community'],
    enabled: user !== null,
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Set initial chat if provided
  useEffect(() => {
    if (initialUserId && activeView === 'conversations') {
      setActiveChat(initialUserId);
      setActiveView('chat');
    }
  }, [initialUserId]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (activeChat && messages && messages.length > 0) {
      const unreadMessages = messages.filter(m => !m.isRead && m.senderId !== user?.id);
      unreadMessages.forEach(async (message) => {
        try {
          await apiRequest(`/api/messages/${message.id}/read`, {
            method: 'PATCH',
          });
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });
      
      if (unreadMessages.length > 0) {
        refetchConversations();
        refetchUnread();
      }
    }
  }, [activeChat, messages, user, refetchConversations, refetchUnread]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || activeChat === null) return;
    
    try {
      await apiRequest('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: activeChat,
          content: messageText,
          category: 'community'
        }),
      });
      
      setMessageText('');
      refetchMessages();
      refetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleOpenChat = (userId: number) => {
    setActiveChat(userId);
    setActiveView('chat');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">Please log in to access community messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-green-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Community Messages</h3>
            <p className="text-sm text-gray-600">Connect with community members</p>
          </div>
          {unreadData?.count > 0 && (
            <Badge className="ml-auto bg-green-600 text-white">
              {unreadData.count}
            </Badge>
          )}
        </div>
      </div>

      {/* Conversations View */}
      {activeView === 'conversations' && (
        <div className="flex-1 overflow-auto">
          {isLoadingConversations ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {conversations.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium">No community conversations</p>
                  <p className="text-sm">Join community discussions to start conversations</p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <Card
                    key={convo.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                    onClick={() => handleOpenChat(convo.otherUser.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={convo.otherUser.avatar} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-900 truncate">
                              {convo.otherUser.name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {format(new Date(convo.lastMessage.createdAt), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {convo.lastMessage.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Community
                            </Badge>
                            {convo.unreadCount > 0 && (
                              <Badge className="bg-green-600 text-white text-xs">
                                {convo.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Chat View */}
      {activeView === 'chat' && activeChat && (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('conversations')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar>
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">Community Chat</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Community
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4">
            {isLoadingMessages ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">Start the conversation</p>
                    <p className="text-sm">Share ideas and connect with the community</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.senderId === user?.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-4 py-2 ${
                            isMine
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.attachmentUrl && (
                            <div className="mb-2">
                              <img
                                src={message.attachmentUrl}
                                alt="Attachment"
                                className="max-w-full rounded"
                              />
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <span
                            className={`text-xs mt-1 block text-right ${
                              isMine ? 'text-green-100' : 'text-gray-500'
                            }`}
                          >
                            {format(new Date(message.createdAt), 'HH:mm')}
                            {isMine && message.isRead && (
                              <span className="ml-1">✓</span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Share your thoughts with the community..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <Button type="button" variant="outline" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm">
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}