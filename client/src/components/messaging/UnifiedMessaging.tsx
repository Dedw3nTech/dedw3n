import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MessageSquare, Send, Plus, User, Smile, Image, Video, Paperclip } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import EmojiPicker from 'emoji-picker-react';

// Helper function to format message timestamps
function formatMessageTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    try {
      console.log('[UnifiedMessaging] Sending message to:', receiverId, 'Content:', messageText);
      await sendMessage(receiverId, messageText.trim());
      setMessageText('');
      setShowEmojiPicker(false);
      refreshConversations();
      console.log('[UnifiedMessaging] Message sent successfully');
    } catch (error) {
      console.error('[UnifiedMessaging] Failed to send message:', error);
      // Keep the message text so user can retry
    }
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

  const handleFileSelect = (type: 'image' | 'video' | 'file') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 
                                   type === 'video' ? 'video/*' : 
                                   '*/*';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSendWithAttachment = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const authToken = localStorage.getItem('authToken');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
          'x-use-session': 'true',
          'x-auth-method': 'session',
          'x-client-auth': 'true',
        },
        credentials: 'include',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();
      
      // Send message with attachment
      let receiverId: string;
      if (selectedUser) {
        receiverId = String(selectedUser.id);
      } else if (selectedConversation) {
        const otherParticipant = selectedConversation.participants.find((p: any) => p.id !== user?.id);
        if (!otherParticipant) return;
        receiverId = String(otherParticipant.id);
      } else {
        return;
      }

      // Send message with attachment URL
      const messageContent = messageText.trim() || `Sent ${selectedFile.type.startsWith('image/') ? 'an image' : selectedFile.type.startsWith('video/') ? 'a video' : 'a file'}`;
      
      await sendMessage(receiverId, messageContent);
      
      // Clear attachment
      setSelectedFile(null);
      setFilePreview(null);
      setMessageText('');
      setShowEmojiPicker(false);
      refreshConversations();
      
    } catch (error) {
      console.error('Failed to send attachment:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages, messages]);

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
    <div className="max-w-4xl mx-auto p-4 relative z-10 min-h-screen" data-messaging-container>
      <Card className="relative overflow-hidden bg-white shadow-lg">
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
                <Card className="h-[600px] flex flex-col overflow-hidden">
                  {/* Chat Header */}
                  <CardHeader className="pb-3 flex-shrink-0 border-b">
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

                  {/* Messages Area - Scrollable with Fixed Height */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        {selectedUser && conversationMessages.length === 0 ? (
                          <div className="flex items-center justify-center h-96 text-muted-foreground">
                            Start a conversation with {selectedUser.name}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {(selectedConversation ? conversationMessages : messages).map((message: any) => (
                              <div
                                key={message.id}
                                className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`p-3 rounded-lg max-w-[70%] break-words ${
                                    message.senderId === user.id
                                      ? 'bg-blue-500 text-white rounded-br-sm'
                                      : 'bg-gray-100 border rounded-bl-sm'
                                  }`}
                                >
                                  <div className="text-sm">{message.content}</div>
                                  <div className={`text-xs mt-1 ${
                                    message.senderId === user.id
                                      ? 'text-blue-100'
                                      : 'text-gray-500'
                                  }`}>
                                    {formatMessageTime(message.createdAt)}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {/* Auto-scroll anchor */}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Message Input - Fixed at Bottom */}
                  <div className="border-t bg-white p-4 flex-shrink-0 messaging-input-container">
                    {/* File Preview */}
                    {selectedFile && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {filePreview ? (
                              <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                                <Paperclip className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{selectedFile.name}</div>
                              <div className="text-xs text-gray-500">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeAttachment}
                            className="text-gray-500 hover:text-red-500"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 relative w-full max-w-full">
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
                          className="h-10 pr-12 relative z-0"
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
                        {/* Emoji Button with Portal Prevention */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-gray-100 relative z-10"
                                disabled={!selectedUser && !selectedConversation}
                              >
                                <Smile className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-auto p-0 border-0 shadow-lg relative z-50" 
                              side="top" 
                              align="end"
                              container={document.querySelector('[data-messaging-container]')}
                            >
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
                      </div>
                      
                      {/* Attachment Buttons */}
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFileSelect('image')}
                          disabled={!selectedUser && !selectedConversation}
                          className="h-10 w-10 text-gray-500 hover:text-blue-500"
                          title="Add Image"
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFileSelect('video')}
                          disabled={!selectedUser && !selectedConversation}
                          className="h-10 w-10 text-gray-500 hover:text-green-500"
                          title="Add Video"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFileSelect('file')}
                          disabled={!selectedUser && !selectedConversation}
                          className="h-10 w-10 text-gray-500 hover:text-purple-500"
                          title="Add File"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button 
                        type="button"
                        size="icon" 
                        onClick={selectedFile ? handleSendWithAttachment : handleSendMessage}
                        disabled={(!selectedUser && !selectedConversation) || (!messageText.trim() && !selectedFile) || isUploading}
                        className="h-10 w-10 relative z-10"
                      >
                        {isUploading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="*/*"
                    />
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