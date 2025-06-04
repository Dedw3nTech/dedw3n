import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, Users, Globe, MapPin, Flag, Image, Video, Paperclip, X, Lock, Plus, Mic, MicOff, PhoneCall } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CommunityNav } from "@/components/layout/CommunityNav";

interface Chatroom {
  id: number;
  name: string;
  description: string;
  type: 'global' | 'regional' | 'country' | 'private';
  region?: string;
  country?: string;
  isActive: boolean;
  maxUsers: number;
  createdAt: string;
  creatorId?: number;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
}

interface Message {
  id: number;
  content: string;
  messageType: string;
  createdAt: string;
  userId: number;
  username: string;
  name?: string;
  avatar?: string;
}

interface ActiveUser {
  id: number;
  username: string;
  name?: string;
  avatar?: string;
  lastSeen: string;
}

export default function ChatroomsPage() {
  const [selectedChatroom, setSelectedChatroom] = useState<Chatroom | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Fetch chatrooms
  const { data: chatrooms = [], isLoading: loadingChatrooms } = useQuery({
    queryKey: ['/api/chatrooms'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch messages for selected chatroom
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/chatrooms', selectedChatroom?.id, 'messages'],
    enabled: !!selectedChatroom,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time feel
  });

  // Fetch active users for selected chatroom
  const { data: activeUsers = [], isLoading: loadingActiveUsers } = useQuery({
    queryKey: ['/api/chatrooms', selectedChatroom?.id, 'users'],
    enabled: !!selectedChatroom,
    refetchInterval: 10000, // Refetch every 10 seconds to track online users
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; messageType: string; file?: File }) => {
      const formData = new FormData();
      formData.append('content', messageData.content);
      formData.append('messageType', messageData.messageType);
      
      if (messageData.file) {
        formData.append('file', messageData.file);
      }

      const response = await fetch(`/api/chatrooms/${selectedChatroom?.id}/messages`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms', selectedChatroom?.id, 'messages'] });
    },
  });

  // Join chatroom mutation
  const joinChatroomMutation = useMutation({
    mutationFn: async (chatroomId: number) => {
      const response = await fetch(`/api/chatrooms/${chatroomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to join chatroom');
      }

      return response.json();
    },
  });

  // Create private room mutation
  const createPrivateRoomMutation = useMutation({
    mutationFn: async (roomData: { name: string; isAudioEnabled: boolean; invitedUsers: number[] }) => {
      const response = await fetch('/api/chatrooms/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error('Failed to create private room');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatrooms'] });
      setIsCreateRoomOpen(false);
      setRoomName("");
      setSelectedFriends([]);
      setIsAudioEnabled(true);
      // Automatically select the newly created room
      if (data.chatroom) {
        setSelectedChatroom(data.chatroom);
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-join and select first chatroom
  useEffect(() => {
    if (chatrooms.length > 0 && !selectedChatroom) {
      const globalChatroom = chatrooms.find((room: Chatroom) => room.type === 'global') || chatrooms[0];
      setSelectedChatroom(globalChatroom);
      joinChatroomMutation.mutate(globalChatroom.id);
    }
  }, [chatrooms, selectedChatroom]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type and size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/mpeg', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      alert('Only images (JPEG, PNG, GIF) and videos (MP4, MPEG, MOV) are allowed');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || !selectedChatroom) return;

    const messageType = selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'video') : 'text';
    const content = selectedFile ? (selectedFile.name || 'Media file') : message.trim();

    sendMessageMutation.mutate({ 
      content, 
      messageType,
      file: selectedFile || undefined
    });
  };

  const handleChatroomSelect = (chatroom: Chatroom) => {
    setSelectedChatroom(chatroom);
    joinChatroomMutation.mutate(chatroom.id);
  };

  const getChatroomIcon = (type: string) => {
    switch (type) {
      case 'global':
        return <Globe className="h-5 w-5" />;
      case 'regional':
        return <MapPin className="h-5 w-5" />;
      case 'country':
        return <Flag className="h-5 w-5" />;
      case 'private':
        return <Lock className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getChatroomBadgeColor = (type: string) => {
    switch (type) {
      case 'global':
        return 'bg-blue-500';
      case 'regional':
        return 'bg-green-500';
      case 'country':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get personalized chatroom display name
  const getChatroomDisplayName = (chatroom: Chatroom) => {
    if (chatroom.type === 'regional' && chatroom.name === 'My City' && user?.city) {
      return user.city;
    }
    if (chatroom.type === 'regional' && chatroom.name === 'London' && user?.city) {
      return user.city;
    }
    if (chatroom.type === 'country' && chatroom.name === 'My Country' && user?.country) {
      return user.country;
    }
    if (chatroom.type === 'regional' && chatroom.name === 'My Region' && user?.region) {
      return user.region;
    }
    return chatroom.name;
  };

  // Get personalized chatroom description
  const getChatroomDescription = (chatroom: Chatroom) => {
    if (chatroom.type === 'regional' && (chatroom.name === 'My City' || chatroom.name === 'London') && user?.city) {
      return `Connect with people in ${user.city} and discover what's happening in your city`;
    }
    if (chatroom.type === 'country' && chatroom.name === 'My Country' && user?.country) {
      return `Connect with people from ${user.country}`;
    }
    if (chatroom.type === 'regional' && chatroom.name === 'My Region' && user?.region) {
      return `Chat with people in ${user.region}`;
    }
    return chatroom.description;
  };

  if (loadingChatrooms) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading chatrooms...</div>
      </div>
    );
  }

  return (
    <div>
      <CommunityNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chatrooms</h1>
          <p className="text-gray-600 mt-2">Connect with people from around the world</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px]">
        {/* Chatroom List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Available Rooms
                </div>
                <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Private Room</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="roomName">Room Name</Label>
                        <Input 
                          id="roomName"
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          placeholder="Enter room name..."
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="audioEnabled"
                          checked={isAudioEnabled}
                          onCheckedChange={(checked) => setIsAudioEnabled(checked as boolean)}
                        />
                        <Label htmlFor="audioEnabled" className="flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          Enable Audio Conference
                        </Label>
                      </div>

                      <div>
                        <Label>Invite Friends</Label>
                        <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                          {/* Mock friends list - replace with actual friends data */}
                          {[
                            { id: 1, name: "Alice Johnson", username: "alice" },
                            { id: 2, name: "Bob Smith", username: "bob" },
                            { id: 3, name: "Carol Brown", username: "carol" }
                          ].map((friend) => (
                            <div key={friend.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`friend-${friend.id}`}
                                checked={selectedFriends.includes(friend.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedFriends([...selectedFriends, friend.id]);
                                  } else {
                                    setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`friend-${friend.id}`} className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {friend.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreateRoomOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            // Handle room creation
                            console.log('Creating room:', { roomName, isAudioEnabled, selectedFriends });
                            setIsCreateRoomOpen(false);
                          }}
                          disabled={!roomName.trim()}
                        >
                          Create Room
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chatrooms.map((chatroom: Chatroom) => (
                  <Button
                    key={chatroom.id}
                    variant={selectedChatroom?.id === chatroom.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleChatroomSelect(chatroom)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`p-2 rounded-full ${getChatroomBadgeColor(chatroom.type)} text-white`}>
                        {getChatroomIcon(chatroom.type)}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium">{getChatroomDisplayName(chatroom)}</div>
                        <div className="text-xs text-gray-500 capitalize">
                          {chatroom.type}
                          {chatroom.region && ` • ${chatroom.region}`}
                          {chatroom.country && ` • ${chatroom.country}`}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 flex gap-4">
          {/* Messages Panel */}
          <div className="flex-1">
            {selectedChatroom ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getChatroomBadgeColor(selectedChatroom.type)} text-white`}>
                      {getChatroomIcon(selectedChatroom.type)}
                    </div>
                    <div>
                      <CardTitle>{getChatroomDisplayName(selectedChatroom)}</CardTitle>
                      <p className="text-sm text-gray-600">{getChatroomDescription(selectedChatroom)}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {selectedChatroom.type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      No messages yet. Be the first to start the conversation!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg: Message) => (
                        <div key={msg.id} className="flex gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {msg.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-sm">
                                  {msg.name || msg.username || 'Anonymous'}
                                </span>
                                {msg.name && msg.username && (
                                  <span className="text-xs text-gray-500">@{msg.username}</span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="text-sm text-gray-900 break-words">
                              {msg.messageType === 'image' ? (
                                <div className="space-y-2">
                                  <img 
                                    src={msg.content} 
                                    alt="Shared image"
                                    className="max-w-xs rounded-lg border"
                                    style={{ maxHeight: '200px' }}
                                  />
                                </div>
                              ) : msg.messageType === 'video' ? (
                                <div className="space-y-2">
                                  <video 
                                    src={msg.content} 
                                    controls
                                    className="max-w-xs rounded-lg border"
                                    style={{ maxHeight: '200px' }}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              ) : (
                                msg.content
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  {/* File Preview */}
                  {filePreview && selectedFile && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          {selectedFile.type.startsWith('image/') ? (
                            <img 
                              src={filePreview} 
                              alt="Preview"
                              className="max-w-xs max-h-32 rounded border"
                            />
                          ) : (
                            <video 
                              src={filePreview} 
                              className="max-w-xs max-h-32 rounded border"
                              controls
                            />
                          )}
                          <p className="text-sm text-gray-600 mt-2">
                            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <div className="flex gap-2">
                      {/* Image Upload Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = 'image/jpeg,image/png,image/gif';
                            fileInputRef.current.click();
                          }
                        }}
                        disabled={sendMessageMutation.isPending}
                        title="Upload Image"
                      >
                        <Image className="h-4 w-4" />
                      </Button>

                      {/* Video Upload Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.accept = 'video/mp4,video/mpeg,video/quicktime';
                            fileInputRef.current.click();
                          }
                        }}
                        disabled={sendMessageMutation.isPending}
                        title="Upload Video"
                      >
                        <Video className="h-4 w-4" />
                      </Button>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="image/jpeg,image/png,image/gif,video/mp4,video/mpeg,video/quicktime"
                      />
                    </div>

                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={selectedFile ? "Add a caption..." : `Message ${selectedChatroom.name}...`}
                      className="flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                      type="submit" 
                      disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent>
                  <div className="text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">Select a chatroom to start chatting</p>
                    <p className="text-sm">Choose from Global, Regional, or Country-specific rooms</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Active Users Panel */}
          {selectedChatroom && (
            <div className="w-64 flex-shrink-0">
              <Card className="h-full">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Online ({activeUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    {loadingActiveUsers ? (
                      <div className="p-4 text-center text-gray-500">Loading users...</div>
                    ) : activeUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No active users</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {activeUsers.map((user: ActiveUser) => (
                          <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50">
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {user.name || user.username || 'Anonymous'}
                              </div>
                              {user.name && user.username && (
                                <div className="text-xs text-gray-500">@{user.username}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}