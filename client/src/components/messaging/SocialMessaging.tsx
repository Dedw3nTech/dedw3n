import { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/hooks/use-messaging';
import { useVideos } from '@/hooks/use-videos';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { 
  Loader2, Send, User, MoreVertical, ArrowLeft, PlusCircle, 
  Paperclip, Image, Video as VideoIcon, FileText, 
  MessageCircle, TrendingUp, Play, Heart, Share2, 
  Clock, Film, Home, Compass, UserCircle
} from 'lucide-react';
import defaultAvatar from '@assets/WHITE BG DEDWEN LOGO (320 x 132 px) (128 x 56 px).png';

export default function SocialMessaging() {
  const { user } = useAuth();
  const { 
    sendMessage, 
    markAsRead, 
    onlineUsers, 
    typingUsers, 
    sendTypingStatus,
    isConnected
  } = useMessaging();
  
  const {
    trendingVideos,
    userVideos,
    isLoadingTrending,
    isLoadingUserVideos,
    likeVideoMutation,
    shareVideoMutation,
    viewVideoMutation,
  } = useVideos();
  
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('messaging');
  const [activeView, setActiveView] = useState<'conversations' | 'chat' | 'contacts'>('conversations');
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Message type
  interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt: string;
    isRead: boolean;
    attachmentUrl?: string;
    attachmentType?: string;
  }

  // Conversation type
  interface Conversation {
    userId: number;
    name: string;
    avatar: string | null;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  }

  // User type
  interface ChatUser {
    id: number;
    name: string;
    username: string;
    email: string;
    avatar: string | null;
  }

  // Fetch conversations
  const { data: conversations = [] as Conversation[], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/messages/conversations'],
    enabled: user !== null && activeView === 'conversations',
  });

  // Fetch messages for active chat
  const { data: messages = [] as Message[], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages/conversation', activeChat],
    enabled: activeChat !== null && activeView === 'chat',
  });

  // Fetch user data for active chat
  const { data: chatPartner = {} as ChatUser, isLoading: isLoadingPartner } = useQuery<ChatUser>({
    queryKey: ['/api/users', activeChat],
    enabled: activeChat !== null && activeView === 'chat',
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    if (activeChat && messages && messages.length > 0) {
      messages.forEach((message: Message) => {
        if (!message.isRead && message.senderId !== user?.id) {
          markAsRead(message.id);
        }
      });
    }
  }, [activeChat, messages, markAsRead, user]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() && !attachmentUrl) return;
    if (activeChat === null) return;
    
    sendMessage(activeChat, messageText, attachmentUrl || undefined, attachmentType || undefined);
    
    // Clear form
    setMessageText('');
    setAttachmentUrl(null);
    setAttachmentType(null);
  };

  const handleOpenChat = (userId: number) => {
    setActiveChat(userId);
    setActiveView('chat');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    if (activeChat) {
      sendTypingStatus(activeChat, e.target.value.length > 0);
    }
  };

  const handleAttachment = (type: string) => {
    // In a real implementation, this would open a file picker
    // For now, we'll just simulate attaching a sample image
    setAttachmentUrl('https://example.com/sample.jpg');
    setAttachmentType(type);
  };

  const renderConversationsList = () => (
    <>
      <SheetHeader>
        <SheetTitle>Messages</SheetTitle>
        <div className="flex justify-between items-center mt-2">
          <Badge variant="outline" className={isConnected ? "bg-green-100" : "bg-red-100"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <button 
            onClick={() => setActiveView('contacts')}
            className="text-sm text-blue-600 flex items-center gap-1"
          >
            <PlusCircle size={14} /> New Chat
          </button>
        </div>
      </SheetHeader>
      
      <ScrollArea className="flex-1 my-4">
        {isLoadingConversations ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 px-1">
            {conversations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No conversations yet</p>
                <button 
                  onClick={() => setActiveView('contacts')}
                  className="mt-2 text-sm text-blue-600"
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              conversations.map((convo: Conversation) => (
                <div
                  key={convo.userId}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleOpenChat(convo.userId)}
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {convo.avatar ? (
                        <img src={convo.avatar} alt={convo.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    {onlineUsers.includes(convo.userId) && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-sm truncate">{convo.name}</h4>
                      <span className="text-xs text-gray-500">
                        {convo.lastMessageTime && format(new Date(convo.lastMessageTime), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{convo.lastMessage}</p>
                  </div>
                  {convo.unreadCount > 0 && (
                    <Badge className="ml-auto">{convo.unreadCount}</Badge>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </>
  );

  const renderChatView = () => (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView('conversations')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
          </button>
          
          {isLoadingPartner ? (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {chatPartner.avatar ? (
                  <img src={chatPartner.avatar} alt={chatPartner.name} className="h-full w-full object-cover" />
                ) : (
                  <img src={defaultAvatar} alt="Default avatar" className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm">{chatPartner.name}</h4>
                <div className="flex items-center text-xs text-gray-500">
                  {onlineUsers.includes(activeChat || 0) ? (
                    <span className="text-green-500">Online</span>
                  ) : (
                    <span>Offline</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <button className="ml-auto text-gray-600 hover:text-gray-900">
            <MoreVertical size={18} />
          </button>
        </div>
      </SheetHeader>
      
      <ScrollArea className="flex-1 my-4 px-1">
        {isLoadingMessages ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message: Message) => {
                const isMine = message.senderId === user?.id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        isMine
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.attachmentUrl && (
                        <div className="mb-2">
                          {message.attachmentType?.includes('image') ? (
                            <img
                              src={message.attachmentUrl}
                              alt="Attachment"
                              className="max-w-full rounded"
                            />
                          ) : message.attachmentType?.includes('video') ? (
                            <video
                              src={message.attachmentUrl}
                              controls
                              className="max-w-full rounded"
                            />
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-background rounded">
                              <FileText size={16} />
                              <span className="text-xs truncate">Attachment</span>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <span
                        className={`text-xs mt-1 block text-right ${
                          isMine ? 'text-primary-foreground/70' : 'text-gray-500'
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
            
            {typingUsers[activeChat || 0] && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 max-w-[75%]">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      <SheetFooter className="px-0">
        {attachmentUrl && (
          <div className="w-full mb-2 p-2 bg-muted rounded-md flex items-center gap-2">
            <div className="flex-1 truncate text-xs">Attachment ready</div>
            <button
              onClick={() => {
                setAttachmentUrl(null);
                setAttachmentType(null);
              }}
              className="text-destructive hover:text-destructive/80"
            >
              &times;
            </button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <div className="flex gap-1 text-muted-foreground">
            <button
              type="button"
              onClick={() => handleAttachment('image/jpeg')}
              className="p-2 rounded-full hover:bg-muted"
            >
              <Image size={18} />
            </button>
            <button
              type="button"
              onClick={() => handleAttachment('video/mp4')}
              className="p-2 rounded-full hover:bg-muted"
            >
              <Video size={18} />
            </button>
            <button
              type="button"
              onClick={() => handleAttachment('application/pdf')}
              className="p-2 rounded-full hover:bg-muted"
            >
              <Paperclip size={18} />
            </button>
          </div>
          
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={handleTyping}
            className="flex-1"
          />
          
          <button
            type="submit"
            disabled={!messageText.trim() && !attachmentUrl}
            className="bg-primary text-primary-foreground p-2 rounded-full disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </SheetFooter>
    </>
  );

  const renderContactsList = () => (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveView('conversations')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
          </button>
          <SheetTitle>New Message</SheetTitle>
        </div>
      </SheetHeader>
      
      <div className="py-4">
        <Input 
          placeholder="Search users..." 
          className="mb-4"
        />
        
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {/* This would be populated with actual users from the API */}
            {[1, 2, 3].map((id) => (
              <div
                key={id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                onClick={() => handleOpenChat(id)}
              >
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">User {id}</h4>
                  <p className="text-xs text-gray-500">user{id}@example.com</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );

  // Render video card
  const renderVideoCard = (video: any, index: number) => (
    <Card key={index} className="overflow-hidden shadow-sm mb-4">
      <div className="relative aspect-video bg-gray-200">
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <VideoIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/50 hover:bg-black/70">
            <Play className="h-8 w-8 text-white" />
          </Button>
        </div>
        {video.duration && (
          <Badge variant="secondary" className="absolute bottom-2 right-2">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </Badge>
        )}
        {video.videoType === 'live' && (
          <Badge variant="destructive" className="absolute top-2 left-2">LIVE</Badge>
        )}
      </div>
      <CardContent className="pt-3 pb-2">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-medium text-sm line-clamp-1">{video.title}</h3>
          <Badge variant="outline" className="ml-2 text-xs">
            {video.videoType}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {video.description || "No description"}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {video.likes}
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {video.views}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Render videos tab content
  const renderVideosTab = () => (
    <>
      <SheetHeader>
        <SheetTitle>Videos</SheetTitle>
      </SheetHeader>
      
      <ScrollArea className="flex-1 my-4 px-1">
        {isLoadingTrending ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Trending</h3>
              <Button variant="ghost" size="sm" className="text-xs">
                See more
              </Button>
            </div>
            
            {trendingVideos.length === 0 ? (
              <div className="text-center py-5 text-muted-foreground">
                <p>No trending videos</p>
              </div>
            ) : (
              trendingVideos.slice(0, 3).map((video, index) => renderVideoCard(video, index))
            )}
            
            <div className="flex justify-between items-center my-3">
              <h3 className="font-medium">Your Videos</h3>
              <Button variant="ghost" size="sm" className="text-xs">
                See all
              </Button>
            </div>
            
            {isLoadingUserVideos ? (
              <div className="flex justify-center py-5">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : userVideos.length === 0 ? (
              <div className="text-center py-5 text-muted-foreground">
                <p>You haven't uploaded any videos yet</p>
                <Button variant="outline" size="sm" className="mt-2">
                  <PlusCircle className="h-4 w-4 mr-1" /> Upload Video
                </Button>
              </div>
            ) : (
              userVideos.slice(0, 2).map((video, index) => renderVideoCard(video, index))
            )}
            
            <div className="pt-4 pb-2">
              <Button className="w-full" onClick={() => setLocation("/upload-video")}>
                <PlusCircle className="h-4 w-4 mr-1" /> Create New Video
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
    </>
  );

  // Render navigation for social tabs
  const renderSocialNavigation = () => (
    <div className="py-2 px-1">
      <Tabs defaultValue="messaging" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full mb-2">
          <TabsTrigger value="messaging" className="flex flex-col items-center gap-1 py-2 text-xs">
            <MessageCircle className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex flex-col items-center gap-1 py-2 text-xs">
            <Film className="h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex flex-col items-center gap-1 py-2 text-xs">
            <Home className="h-4 w-4" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex flex-col items-center gap-1 py-2 text-xs">
            <Compass className="h-4 w-4" />
            Explore
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messaging" className="flex-1 mt-0 p-0 border-none">
          {activeView === 'conversations' && renderConversationsList()}
          {activeView === 'chat' && renderChatView()}
          {activeView === 'contacts' && renderContactsList()}
        </TabsContent>
        
        <TabsContent value="videos" className="flex-1 mt-0 p-0 border-none">
          {renderVideosTab()}
        </TabsContent>
        
        <TabsContent value="feed" className="mt-0 p-0 border-none">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground mb-2">Go to the Wall</p>
            <Button variant="outline" onClick={() => setLocation("/wall")}>
              View Wall
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="explore" className="mt-0 p-0 border-none">
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground mb-2">Go to Explore</p>
            <Button variant="outline" onClick={() => setLocation("/explore")}>
              Explore Content
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <SheetContent className="flex flex-col p-0 overflow-hidden">
      {renderSocialNavigation()}
    </SheetContent>
  );
}