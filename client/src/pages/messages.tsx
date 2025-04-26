import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { Loader2, Search, Settings, Phone, VideoIcon, Info, SendHorizonal, Paperclip, Smile, Plus } from "lucide-react";

export default function MessagesPage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  if (!currentUser) {
    toast({
      title: "Authentication required",
      description: "Please log in to access messages",
      variant: "destructive",
    });
    setLocation("/auth");
    return null;
  }

  // Fetch user's conversations
  const {
    data: conversations,
    isLoading: isLoadingConversations,
  } = useQuery({
    queryKey: ["/api/messages/conversations"],
    queryFn: async () => {
      const response = await fetch("/api/messages/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
  });

  // Find active conversation based on URL params
  const activeConversation = username && conversations
    ? conversations.find((convo: any) => 
        convo.participants.some((p: any) => p.username === username)
      )
    : null;

  // Set active conversation ID
  const activeConversationId = activeConversation?.id;

  // Fetch messages for the active conversation
  const {
    data: messages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: [`/api/messages/conversations/${activeConversationId}`],
    queryFn: async () => {
      const response = await fetch(`/api/messages/conversations/${activeConversationId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!activeConversationId,
  });

  // Find the active conversation partner
  const conversationPartner = activeConversation?.participants?.find(
    (p: any) => p.id !== currentUser.id
  );

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId: number }) => {
      const response = await apiRequest(
        "POST",
        `/api/messages/conversations/${conversationId}`,
        { content: message }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send message");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear message input
      setMessageText("");
      
      // Refetch messages to include the new one
      refetchMessages();
      
      // Invalidate conversations list to update last message preview
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // New conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async ({
      username,
      message,
    }: {
      username: string;
      message: string;
    }) => {
      const response = await apiRequest("POST", "/api/messages/conversations", {
        recipientUsername: username,
        firstMessage: message,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to start new conversation"
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Clear message input
      setMessageText("");

      // Update URL to the new conversation
      setLocation(`/messages/${data.recipientUsername}`);

      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: ["/api/messages/conversations"],
      });

      toast({
        title: "Success",
        description: "Conversation started",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    if (activeConversationId) {
      // Send to existing conversation
      sendMessageMutation.mutate({
        message: messageText,
        conversationId: activeConversationId,
      });
    } else if (username) {
      // Start new conversation
      startConversationMutation.mutate({
        username,
        message: messageText,
      });
    }
  };

  // Scroll to the bottom of messages when new ones arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Filter conversations based on search term
  const filteredConversations = isSearching && searchTerm 
    ? conversations?.filter((convo: any) => 
        convo.participants.some((p: any) => 
          p.id !== currentUser.id && 
          (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.username.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
    : conversations;

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations sidebar */}
        <div className="md:col-span-1 border rounded-lg flex flex-col overflow-hidden bg-background">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            
            {isSearching ? (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-8 pr-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => {
                    setIsSearching(false);
                    setSearchTerm("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsSearching(true)}
              >
                <Search className="h-4 w-4 mr-2" />
                Search conversations...
              </Button>
            )}
          </div>

          {isLoadingConversations ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !filteredConversations || filteredConversations.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center p-4 text-center">
              <i className="ri-message-3-line text-4xl text-muted-foreground mb-2"></i>
              <p className="text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with people to start messaging
              </p>
              <Button onClick={() => setLocation("/members")}>
                Find People
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conversation: any) => {
                // Find the other participant (not current user)
                const otherParticipant = conversation.participants.find(
                  (p: any) => p.id !== currentUser.id
                );

                const isActive = conversation.id === activeConversationId;

                return (
                  <div
                    key={conversation.id}
                    className={`p-3 border-b cursor-pointer hover:bg-accent/50 ${
                      isActive ? "bg-accent" : ""
                    }`}
                    onClick={() => setLocation(`/messages/${otherParticipant.username}`)}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherParticipant.avatar || ""} alt={otherParticipant.name} />
                        <AvatarFallback>{getInitials(otherParticipant.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium truncate">{otherParticipant.name}</h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.userId === currentUser.id && "You: "}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <Badge className="mt-1 ml-12">{conversation.unreadCount}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active conversation */}
        <div className="md:col-span-2 border rounded-lg flex flex-col overflow-hidden bg-background">
          {!username ? (
            <div className="flex-1 flex flex-col justify-center items-center p-4 text-center">
              <i className="ri-chat-3-line text-5xl text-muted-foreground mb-2"></i>
              <h2 className="text-xl font-medium mb-2">Your Messages</h2>
              <p className="text-muted-foreground mb-4">
                Select a conversation or start a new one
              </p>
              <Button onClick={() => setLocation("/members")}>
                Find People to Message
              </Button>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={conversationPartner?.avatar || ""} alt={conversationPartner?.name} />
                    <AvatarFallback>{getInitials(conversationPartner?.name || "")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium">{conversationPartner?.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {conversationPartner?.isOnline ? (
                        <span className="text-green-500">Online</span>
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <VideoIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="h-full flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !messages || messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <p className="text-muted-foreground mb-2">No messages yet</p>
                    <p className="text-sm text-muted-foreground">
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message: any, index: number) => {
                      const isCurrentUser = message.userId === currentUser.id;
                      const showAvatar = index === 0 || messages[index - 1].userId !== message.userId;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isCurrentUser && showAvatar && (
                            <Avatar className="h-8 w-8 mr-2 mt-1">
                              <AvatarImage 
                                src={conversationPartner?.avatar || ""} 
                                alt={conversationPartner?.name} 
                              />
                              <AvatarFallback>
                                {getInitials(conversationPartner?.name || "")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          {!isCurrentUser && !showAvatar && (
                            <div className="w-8 mr-2"></div>
                          )}
                          
                          <div className={`max-w-[75%] ${isCurrentUser ? "order-1" : "order-2"}`}>
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                isCurrentUser
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p>{message.content}</p>
                            </div>
                            <div
                              className={`text-xs text-muted-foreground mt-1 ${
                                isCurrentUser ? "text-right" : "text-left"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef}></div>
                  </>
                )}
              </div>

              {/* Message input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending || startConversationMutation.isPending}
                  >
                    {(sendMessageMutation.isPending || startConversationMutation.isPending) ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <SendHorizonal className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}