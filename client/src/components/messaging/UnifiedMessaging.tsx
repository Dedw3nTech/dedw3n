import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Plus, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface MessagingUser {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
}

export function UnifiedMessaging() {
  const { user } = useAuth();
  const { conversations, messages, unreadCount, isConnected, sendMessage, setActiveConversation, refreshConversations } = useMessaging();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MessagingUser | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  // Fetch users for messaging
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/messages/users'],
    enabled: !!user?.id,
  });

  const handleStartConversation = async (recipient: MessagingUser) => {
    setSelectedUser(recipient);
    setIsNewMessageOpen(false);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !messageText.trim()) return;
    
    await sendMessage(String(selectedUser.id), messageText.trim());
    setMessageText('');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to access messages.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  New Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Select a user to start messaging with:
                  </div>
                  <ScrollArea className="h-64 border rounded-md p-2">
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-muted-foreground">Loading users...</div>
                      </div>
                    ) : availableUsers.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-muted-foreground">No users available</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableUsers.map((availableUser: MessagingUser) => (
                          <div
                            key={availableUser.id}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleStartConversation(availableUser)}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={availableUser.avatar || undefined} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{availableUser.name}</div>
                              <div className="text-xs text-muted-foreground">@{availableUser.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
            {/* Conversations List */}
            <div className="border-r pr-4">
              <h3 className="font-semibold mb-4">Conversations</h3>
              {conversations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium">Conversation {conversation.id}</div>
                      {conversation.lastMessage && (
                        <div className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="col-span-2 flex flex-col">
              {selectedUser && (
                <div className="border-b pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedUser.avatar || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{selectedUser.name}</div>
                      <div className="text-xs text-muted-foreground">@{selectedUser.username}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex-1 border rounded p-4 mb-4 overflow-y-auto bg-gray-50">
                {!selectedUser && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a conversation or click "New Message" to start messaging
                  </div>
                ) : selectedUser && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Start a conversation with {selectedUser.name}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded max-w-xs ${
                          message.senderId === String(user.id)
                            ? 'bg-blue-500 text-white ml-auto'
                            : 'bg-white border'
                        }`}
                      >
                        {message.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input 
                  placeholder={selectedUser ? `Message ${selectedUser.name}...` : "Select a user to start messaging..."} 
                  className="flex-1"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={!selectedUser}
                />
                <Button 
                  size="icon" 
                  onClick={handleSendMessage}
                  disabled={!selectedUser || !messageText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-4 text-sm text-muted-foreground">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}