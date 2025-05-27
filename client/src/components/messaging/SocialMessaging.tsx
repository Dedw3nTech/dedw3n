import { useState, useEffect, useRef, FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useMessaging } from '@/hooks/use-messaging';
import { useVideos } from '@/hooks/use-videos';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  MessageCircle,
  User,
  Video,
  PlusCircle,
  Image,
  Paperclip,
  ArrowLeft,
  FileText,
  Loader2,
  MoreVertical,
  VideoIcon,
} from 'lucide-react';
import ProductSearch from './ProductSearch';
import ProductMessage from './ProductMessage';
import { EmojiPickerComponent } from '@/components/ui/emoji-picker';
import defaultAvatar from '@assets/WHITE BG DEDWEN LOGO (320 x 132 px) (128 x 56 px).png';

interface SocialMessagingProps {
  embedded?: boolean;
}

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

// Product type
interface Product {
  id: number;
  name: string;
  price: number;
  discountPrice?: number | null;
  imageUrl: string;
  vendorId: number;
  vendorName?: string;
}

export default function SocialMessaging({ embedded = false }: SocialMessagingProps) {
  const { user } = useAuth();
  const { 
    sendMessage, 
    markAsRead, 
    onlineUsers, 
    typingUsers, 
    sendTypingStatus,
    isConnected
  } = useMessaging();
  
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<'conversations' | 'chat' | 'contacts'>('conversations');
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/messages/conversations'],
    enabled: user !== null && activeView === 'conversations',
  });

  // Fetch messages for active chat
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
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
  
  const handleProductSelect = (product: Product) => {
    if (activeChat === null) return;
    
    // Format a message with product details
    const productInfo = JSON.stringify({
      type: 'product',
      productId: product.id,
      productName: product.name,
      price: product.price,
      discountPrice: product.discountPrice,
      imageUrl: product.imageUrl,
      vendorId: product.vendorId,
      vendorName: product.vendorName
    });
    
    sendMessage(
      activeChat, 
      `Check out this product: ${product.name}`, 
      product.imageUrl,
      'application/product'
    );
  };

  // EMBEDDED MODE RENDERING
  if (embedded) {
    return (
      <div className="flex flex-col h-full bg-white rounded-md overflow-hidden border">
        {activeView === 'conversations' && (
          <>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Messages</h3>
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
            </div>
            
            <div className="flex-1 overflow-auto">
              {isLoadingConversations ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2 p-3">
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
            </div>
          </>
        )}
        
        {activeView === 'chat' && (
          <>
            <div className="p-3 border-b">
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
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-3">
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
                                ) : message.attachmentType?.includes('product') ? (
                                  <ProductMessage
                                    product={{
                                      id: 0,
                                      name: message.content.replace('Check out this product: ', ''),
                                      price: 0,
                                      imageUrl: message.attachmentUrl,
                                      vendorId: 0
                                    }}
                                    inConversation={true}
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
            </div>
            
            <div className="p-3 border-t">
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
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={handleTyping}
                  className="flex-1"
                />
                
                <button
                  type="submit"
                  className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!messageText.trim() && !attachmentUrl}
                >
                  <MessageCircle size={20} />
                </button>
              </form>
            </div>
          </>
        )}
        
        {activeView === 'contacts' && (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveView('conversations')}
                  className="mr-3 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={18} />
                </button>
                <h3 className="text-lg font-semibold">Start a new conversation</h3>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((userId) => (
                  <div
                    key={userId}
                    className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleOpenChat(userId)}
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">User {userId}</h4>
                      <p className="text-xs text-gray-500">Click to start chatting</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // NON-EMBEDDED MODE (REGULAR SHEET COMPONENT)
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative">
          <MessageSquare />
          {/* Badge for unread messages */}
          {conversations.reduce((total, convo) => total + convo.unreadCount, 0) > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              {conversations.reduce((total, convo) => total + convo.unreadCount, 0)}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md overflow-hidden">
        <Tabs defaultValue="conversations" className="flex flex-col h-full">
          <TabsList className="grid grid-cols-2 h-12 rounded-none">
            <TabsTrigger value="conversations">Messages</TabsTrigger>
            <TabsTrigger value="preferences">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversations" className="flex-1 overflow-hidden flex flex-col">
            {activeView === 'conversations' && (
              <>
                <SheetHeader className="px-4 pt-4 pb-2">
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
                    <div className="space-y-2 px-4">
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
            )}
            
            {activeView === 'chat' && (
              <>
                <SheetHeader className="px-4 pt-4 pb-2">
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
                
                <ScrollArea className="flex-1 my-4 px-4">
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
                                    ) : message.attachmentType?.includes('product') ? (
                                      <ProductMessage
                                        product={{
                                          id: 0,
                                          name: message.content.replace('Check out this product: ', ''),
                                          price: 0,
                                          imageUrl: message.attachmentUrl,
                                          vendorId: 0
                                        }}
                                        inConversation={true}
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
                
                <SheetFooter className="px-4 py-2">
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
                        <VideoIcon size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttachment('application/pdf')}
                        className="p-2 rounded-full hover:bg-muted"
                      >
                        <Paperclip size={18} />
                      </button>
                      {/* Product Search Button */}
                      <ProductSearch onSelect={handleProductSelect} />
                    </div>
                    
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={handleTyping}
                      className="flex-1"
                    />
                    
                    <button
                      type="submit"
                      className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={!messageText.trim() && !attachmentUrl}
                    >
                      <MessageCircle size={18} />
                    </button>
                  </form>
                </SheetFooter>
              </>
            )}
            
            {activeView === 'contacts' && (
              <>
                <SheetHeader className="px-4 pt-4 pb-2">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setActiveView('conversations')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <SheetTitle>Start a new conversation</SheetTitle>
                  </div>
                </SheetHeader>
                
                <ScrollArea className="flex-1 my-4">
                  <div className="space-y-3 px-4">
                    {[1, 2, 3, 4, 5].map((userId) => (
                      <div
                        key={userId}
                        className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleOpenChat(userId)}
                      >
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">User {userId}</h4>
                          <p className="text-xs text-gray-500">Click to start chatting</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-4 px-4 pt-4 flex-1 overflow-y-auto">
            <h3 className="text-lg font-medium">Messaging Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium">Notification Settings</label>
                <p className="text-xs text-muted-foreground">Configure how you want to be notified about new messages.</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enable sound notifications</span>
                  <input type="checkbox" className="toggle" />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show message previews</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Do not disturb</span>
                  <input type="checkbox" className="toggle" />
                </div>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium">Privacy Settings</label>
                <p className="text-xs text-muted-foreground">Control who can send you messages and see your online status.</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show online status</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Read receipts</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow messages from non-connections</span>
                  <input type="checkbox" className="toggle" />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}