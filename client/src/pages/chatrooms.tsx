import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Globe, MapPin, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CommunityNav } from "@/components/layout/CommunityNav";

interface Chatroom {
  id: number;
  name: string;
  description: string;
  type: 'global' | 'regional' | 'country';
  region?: string;
  country?: string;
  isActive: boolean;
  maxUsers: number;
  createdAt: string;
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

export default function ChatroomsPage() {
  const [selectedChatroom, setSelectedChatroom] = useState<Chatroom | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string }) => {
      const response = await fetch(`/api/chatrooms/${selectedChatroom?.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      setMessage("");
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChatroom) return;

    sendMessageMutation.mutate({ content: message.trim() });
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
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Rooms
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
                        <div className="font-medium">{chatroom.name}</div>
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
        <div className="lg:col-span-3">
          {selectedChatroom ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getChatroomBadgeColor(selectedChatroom.type)} text-white`}>
                    {getChatroomIcon(selectedChatroom.type)}
                  </div>
                  <div>
                    <CardTitle>{selectedChatroom.name}</CardTitle>
                    <p className="text-sm text-gray-600">{selectedChatroom.description}</p>
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
                              {msg.content}
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
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Message ${selectedChatroom.name}...`}
                      className="flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                      type="submit" 
                      disabled={!message.trim() || sendMessageMutation.isPending}
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
      </div>
      </div>
    </div>
  );
}