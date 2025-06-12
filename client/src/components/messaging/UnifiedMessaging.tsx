import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare, Send, Plus, User, Smile } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import EmojiPicker from 'emoji-picker-react';

interface MessagingUser {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
}

export function UnifiedMessaging() {
  const { user } = useAuth();
  const { conversations, messages, conversationMessages, unreadCount, isConnected, sendMessage, setActiveConversation, refreshConversations } = useMessaging();
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MessagingUser | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch users for messaging
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/messages/users'],
    enabled: !!user?.id,
  });

  const handleStartConversation = async (recipient: MessagingUser) => {
    setSelectedUser(recipient);
    setSelectedConversation(null);
    setIsNewMessageOpen(false);
  };

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    setSelectedUser(null);
    setActiveConversation(String(conversation.id));
  };

  const handleSendMessage = async () => {
    if (!selectedUser && !selectedConversation) return;
    if (!messageText.trim()) return;
    
    let receiverId: string;
    if (selectedUser) {
      receiverId = String(selectedUser.id);
    } else if (selectedConversation) {
      // Find the other participant in the conversation
      const otherParticipant = selectedConversation.participants.find((p: any) => p.id !== user?.id);
      if (!otherParticipant) return;
      receiverId = String(otherParticipant.id);
    } else {
      return;
    }
    
    await sendMessage(receiverId, messageText.trim());
    setMessageText('');
    setShowEmojiPicker(false);
    refreshConversations();
  };

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const newText = messageText + emoji;
    setMessageText(newText);
    
    // Focus back to input after emoji selection
    if (inputRef.current) {
      inputRef.current.focus();
      // Set cursor position to end
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newText.length, newText.length);
        }
      }, 0);
    }
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
                  {conversations.map((conversation) => {
                    const otherParticipant = conversation.participants.find((p: any) => p.id !== user.id);
                    const isSelected = selectedConversation?.id === conversation.id;
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={otherParticipant?.avatar || undefined} />
                            <AvatarFallback>
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-sm truncate">
                            {otherParticipant?.name || otherParticipant?.username || 'Unknown User'}
                          </div>
                        </div>
                        {conversation.lastMessage && (
                          <div className="text-xs text-muted-foreground truncate ml-8">
                            {conversation.lastMessage.content}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="col-span-2">
              {!selectedUser && !selectedConversation ? (
                <Card className="h-full">
                  <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                    Select a conversation or click "New Message" to start messaging
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={
                          selectedUser?.avatar || 
                          selectedConversation?.participants?.find((p: any) => p.id !== user.id)?.avatar || 
                          undefined
                        } />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {selectedUser?.name || 
                           selectedConversation?.participants?.find((p: any) => p.id !== user.id)?.name || 
                           'Unknown User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @{selectedUser?.username || 
                            selectedConversation?.participants?.find((p: any) => p.id !== user.id)?.username || 
                            'unknown'}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area with ScrollArea */}
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ScrollArea className="h-full pr-4">
                      {selectedUser && conversationMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Start a conversation with {selectedUser.name}
                        </div>
                      ) : (
                        <div className="space-y-3 pb-4">
                          {(selectedConversation ? conversationMessages : messages).map((message: any) => (
                            <div
                              key={message.id}
                              className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`p-3 rounded-lg max-w-xs break-words ${
                                  message.senderId === user.id
                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                    : 'bg-gray-100 border rounded-bl-sm'
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input - Inside Card */}
                  <div className="p-4 border-t flex-shrink-0">
                    <div className="flex gap-2 relative">
                      <div className="flex-1 relative">
                        <Input 
                          ref={inputRef}
                          type="text"
                          placeholder={
                            selectedUser 
                              ? `Send ${selectedUser.name} a message...` 
                              : selectedConversation 
                                ? `Send ${selectedConversation.participants?.find((p: any) => p.id !== user?.id)?.name || 'user'} a message...`
                                : "Select a user to start messaging..."
                          } 
                          className="h-10 pr-12"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          disabled={!selectedUser && !selectedConversation}
                        />
                        {/* Emoji Button */}
                        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                              disabled={!selectedUser && !selectedConversation}
                            >
                              <Smile className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-0 shadow-lg" side="top" align="end">
                            <EmojiPicker
                              onEmojiClick={handleEmojiSelect}
                              width={350}
                              height={400}
                              previewConfig={{
                                showPreview: false
                              }}
                              skinTonesDisabled
                              searchDisabled={false}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button 
                        type="button"
                        size="icon" 
                        onClick={handleSendMessage}
                        disabled={(!selectedUser && !selectedConversation) || !messageText.trim()}
                        className="h-10 w-10"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
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