import { useState, useRef, useEffect } from 'react';
import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, X } from 'lucide-react';

// Inline components for messaging UI
const MessageList = ({ selectedUserId }: { selectedUserId: number | null }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Query for conversation messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/messages/conversation', selectedUserId],
    enabled: !!selectedUserId,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
        <p>No messages yet</p>
        <p className="text-sm">Start a conversation</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => {
        const isCurrentUser = message.senderId === user?.id;
        
        return (
          <div 
            key={message.id} 
            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
              {!isCurrentUser && (
                <Avatar className="h-8 w-8 mr-2">
                  <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center">
                    {message.senderName?.charAt(0) || '?'}
                  </div>
                </Avatar>
              )}
              <div>
                <div 
                  className={`px-3 py-2 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {message.attachmentUrl && message.attachmentType === 'image' && (
                    <img 
                      src={message.attachmentUrl} 
                      alt="Attachment" 
                      className="max-w-full rounded-md mb-2"
                    />
                  )}
                  {message.content}
                </div>
                <div className={`text-xs text-muted-foreground mt-1 ${
                  isCurrentUser ? 'text-right' : 'text-left'
                }`}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {isCurrentUser && (
                    <span className="ml-2">
                      {message.isRead ? 'Read' : 'Sent'}
                    </span>
                  )}
                </div>
              </div>
              {isCurrentUser && (
                <Avatar className="h-8 w-8 ml-2">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center">
                      {user?.name.charAt(0)}
                    </div>
                  )}
                </Avatar>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

const ConversationList = ({ 
  selectedUserId, 
  onSelectUser 
}: { 
  selectedUserId: number | null; 
  onSelectUser: (userId: number) => void;
}) => {
  const { onlineUsers } = useMessaging();
  
  // Query for conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['/api/messages/conversations'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-sm">Start a new conversation</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {conversations.map((convo) => (
        <div
          key={convo.user.id}
          className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted ${
            selectedUserId === convo.user.id ? 'bg-muted' : ''
          }`}
          onClick={() => onSelectUser(convo.user.id)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              {convo.user.avatar ? (
                <img src={convo.user.avatar} alt={convo.user.name} />
              ) : (
                <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center">
                  {convo.user.name.charAt(0)}
                </div>
              )}
            </Avatar>
            {onlineUsers.includes(convo.user.id) && (
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background"></span>
            )}
          </div>
          <div className="ml-2 flex-1 overflow-hidden">
            <div className="flex justify-between">
              <h4 className="font-medium text-sm truncate">{convo.user.name}</h4>
              {convo.lastMessage && (
                <span className="text-xs text-muted-foreground">
                  {new Date(convo.lastMessage.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {convo.lastMessage?.content || "No messages yet"}
            </p>
          </div>
          {convo.unreadCount > 0 && (
            <Badge className="ml-1 h-5 min-w-[20px] flex items-center justify-center">
              {convo.unreadCount}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
};

export default function SocialMessaging() {
  const { sendMessage, unreadCount } = useMessaging();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showConversations, setShowConversations] = useState(true);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUserId) return;
    
    sendMessage(selectedUserId, messageText);
    setMessageText('');
  };

  // Get user details of selected conversation
  const { data: selectedUser } = useQuery({
    queryKey: ['/api/users', selectedUserId],
    enabled: !!selectedUserId,
  });

  return (
    <SheetContent className="w-[400px] sm:max-w-md p-0 flex flex-col">
      <SheetHeader className="p-4 border-b">
        {selectedUserId && !showConversations ? (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 h-8 w-8"
              onClick={() => setShowConversations(true)}
            >
              <X className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8 mr-2">
              {selectedUser?.avatar ? (
                <img src={selectedUser.avatar} alt={selectedUser.name} />
              ) : (
                <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center">
                  {selectedUser?.name?.charAt(0) || '?'}
                </div>
              )}
            </Avatar>
            <SheetTitle className="text-base m-0">{selectedUser?.name || 'Loading...'}</SheetTitle>
          </div>
        ) : (
          <SheetTitle>Messages {unreadCount > 0 && `(${unreadCount})`}</SheetTitle>
        )}
      </SheetHeader>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List (visible on conversation view or when no user selected) */}
        {(showConversations || !selectedUserId) && (
          <ScrollArea className="flex-1 h-[calc(100vh-10rem)]">
            <div className="p-3">
              <Input
                placeholder="Search conversations..."
                className="mb-3"
              />
              <ConversationList 
                selectedUserId={selectedUserId} 
                onSelectUser={(userId) => {
                  setSelectedUserId(userId);
                  setShowConversations(false);
                }} 
              />
            </div>
          </ScrollArea>
        )}

        {/* Message View (visible when user selected and not showing conversations) */}
        {selectedUserId && !showConversations && (
          <ScrollArea className="flex-1 h-[calc(100vh-10rem)]">
            <MessageList selectedUserId={selectedUserId} />
          </ScrollArea>
        )}
      </div>

      {/* Message Input (only visible when a conversation is selected) */}
      {selectedUserId && !showConversations && (
        <SheetFooter className="p-3 border-t flex-row gap-2">
          <Input
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </SheetFooter>
      )}
    </SheetContent>
  );
}