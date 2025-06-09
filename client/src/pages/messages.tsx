import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useMessaging } from "@/hooks/use-messaging";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { ConnectionDiagnostics } from "@/components/messaging/ConnectionDiagnostics";
import { ConnectionStatusIndicator } from "@/components/messaging/ConnectionStatusIndicator";
import { 
  Loader2, Search, Settings, Phone, VideoIcon, Video,
  Info, SendHorizonal, Paperclip, Smile, Plus, X,
  Mic, MicOff, Camera, CameraOff, MonitorUp, Volume2, Volume, PhoneOff 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MessagesPage() {
  usePageTitle("messages");
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [messageText, setMessageText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [selectedCategory, setSelectedCategory] = useState<"marketplace" | "community" | "dating">("marketplace");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Messaging context
  const {
    conversations: wsConversations,
    activeConversation: wsActiveConversation,
    messages: wsMessages,
    unreadCount,
    isConnected,
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    connect,
    disconnect,
    sendMessage: wsSendMessage,
    startConversation: wsStartConversation,
    setActiveConversation: setWsActiveConversation,
    markAsRead,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
    shareScreen
  } = useMessaging();

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

  // Fetch user's conversations filtered by category
  const {
    data: apiConversations,
    isLoading: isLoadingConversations,
  } = useQuery({
    queryKey: ["/api/messages/conversations", selectedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/messages/conversations?category=${selectedCategory}`);
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
  });

  // Find active conversation based on URL params
  const activeApiConversation = username && apiConversations
    ? apiConversations.find((convo: any) => {
        if (convo.participants && convo.participants.length > 0) {
          return convo.participants.some((p: any) => p.username === username);
        } else if (convo.otherUser) {
          return convo.otherUser.username === username;
        }
        return false;
      })
    : null;

  // Set active conversation ID
  const activeConversationId = activeApiConversation?.id;

  // Find the active conversation partner from the username param
  const conversationUserId = username && apiConversations 
    ? (() => {
        const conversation = apiConversations.find((convo: any) => {
          if (convo.participants && convo.participants.length > 0) {
            return convo.participants.some((p: any) => p.username === username);
          } else if (convo.otherUser) {
            return convo.otherUser.username === username;
          }
          return false;
        });
        
        if (!conversation) return null;
        
        if (conversation.participants && conversation.participants.length > 0) {
          return conversation.participants.find((p: any) => p.username === username)?.id;
        } else if (conversation.otherUser) {
          return conversation.otherUser.id;
        }
        return null;
      })()
    : null;

  // Fetch messages for the active conversation
  const {
    data: messagesResponse,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: [`/api/messages/conversations/${conversationUserId}`],
    queryFn: async () => {
      const response = await fetch(`/api/messages/conversations/${conversationUserId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return await response.json();
    },
    enabled: !!conversationUserId,
  });
  
  // Extract messages and conversationPartner from response
  const apiMessages = messagesResponse?.messages || [];
  
  // If we have otherUser in the response, use it to enhance the conversation partner info
  const responseOtherUser = messagesResponse?.otherUser;

  // Find the active conversation partner
  const conversationPartner = activeApiConversation?.participants?.find(
    (p: any) => p.id !== currentUser.id
  );

  // Send message mutation (sends a message to a user by their ID)
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId: number }) => {
      // Here, conversationId is actually the recipient's userId
      const response = await apiRequest(
        "POST",
        `/api/messages/conversations/${conversationId}`,
        { content: message, category: selectedCategory }
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

  // Gift response mutation
  const giftResponseMutation = useMutation({
    mutationFn: async ({ messageId, status }: { messageId: number; status: 'accepted' | 'declined' }) => {
      const response = await apiRequest(
        "POST",
        `/api/gifts/respond`,
        { messageId, status }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to respond to gift");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Gift Response Sent",
        description: data.status === 'accepted' ? "Gift accepted successfully!" : "Gift declined",
      });
      
      // Refetch messages to update UI
      refetchMessages();
      
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to gift",
        variant: "destructive",
      });
    },
  });

  // Handle gift response
  const handleGiftResponse = (messageId: number, status: 'accepted' | 'declined') => {
    giftResponseMutation.mutate({ messageId, status });
  };

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

    if (conversationUserId) {
      // Send to existing conversation partner by ID
      sendMessageMutation.mutate({
        message: messageText,
        conversationId: conversationUserId,
      });
    } else if (username) {
      // Start new conversation with username
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
  }, [apiMessages]);

  // Filter conversations based on search term
  const filteredConversations = isSearching && searchTerm 
    ? apiConversations?.filter((convo: any) => {
        // Handle both participants array and otherUser object structures
        if (convo.participants && convo.participants.length > 0) {
          return convo.participants.some((p: any) => 
            p.id !== currentUser.id && 
            (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             p.username?.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        } else if (convo.otherUser) {
          return convo.otherUser.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 convo.otherUser.username?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      })
    : apiConversations;

  // Connect to WebSocket on component mount
  useEffect(() => {
    if (currentUser) {
      connect();
    }
    
    return () => {
      if (currentUser) {
        disconnect();
      }
    };
  }, [currentUser]);
  
  // Set local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Set remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  // Handle call button click
  const handleCall = async (type: "audio" | "video") => {
    setCallType(type);
    if (conversationPartner?.id) {
      await initiateCall(conversationPartner.id, type);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      {/* Social Header Navigation */}
      <div className="mb-6 border-b pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        </div>
        
        {/* Message Category Navigation */}
        <div className="mt-4">
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as "marketplace" | "community" | "dating")} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="marketplace" className="flex items-center gap-2">
                <i className="ri-store-2-line text-base"></i>
                <span>Marketplace</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <i className="ri-group-line text-base"></i>
                <span>Community</span>
              </TabsTrigger>
              <TabsTrigger value="dating" className="flex items-center gap-2">
                <i className="ri-heart-line text-base"></i>
                <span>Dating</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Active Call Dialog */}
      <Dialog open={!!activeCall} onOpenChange={(open) => !open && endCall()}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
          <div className="relative w-full h-full">
            {/* Remote Video (Full size) */}
            <div className="w-full h-[600px] bg-black relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
              />
              
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={conversationPartner?.avatar || ""} />
                    <AvatarFallback>{getInitials(conversationPartner?.name || "")}</AvatarFallback>
                  </Avatar>
                </div>
              )}
              
              {/* Local Video (Picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-1/4 h-1/4 border-2 border-white rounded-md overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${(!localStream || isVideoOff) ? 'hidden' : ''}`}
                />
                
                {(!localStream || isVideoOff) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={currentUser?.avatar || ""} />
                      <AvatarFallback>{getInitials(currentUser?.name || currentUser?.username || "")}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            </div>
            
            {/* Call Controls */}
            <div className="p-4 bg-background flex justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                onClick={() => toggleMicrophone(!isMuted)}
                className="rounded-full h-12 w-12"
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              
              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="icon"
                onClick={() => toggleCamera(!isVideoOff)}
                className="rounded-full h-12 w-12"
              >
                {isVideoOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
              </Button>
              
              <Button
                variant={isScreenSharing ? "destructive" : "secondary"}
                size="icon"
                onClick={() => shareScreen(!isScreenSharing)}
                className="rounded-full h-12 w-12"
              >
                <MonitorUp className="h-5 w-5" />
              </Button>
              
              <Button
                variant="destructive"
                size="icon"
                onClick={() => endCall()}
                className="rounded-full h-12 w-12"
              >
                <PhoneOff className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Incoming Call Dialog */}
      <Dialog open={!!incomingCall} onOpenChange={(open) => !open && declineCall()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Incoming {incomingCall?.type === "video" ? "Video" : "Audio"} Call</DialogTitle>
            <DialogDescription>
              {conversationPartner?.name || "Someone"} is calling you
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={conversationPartner?.avatar || ""} />
              <AvatarFallback>{getInitials(conversationPartner?.name || "")}</AvatarFallback>
            </Avatar>
          </div>
          
          <DialogFooter className="flex sm:justify-center gap-4">
            <Button
              variant="destructive"
              onClick={() => declineCall()}
              className="flex-1 sm:flex-initial"
            >
              <PhoneOff className="mr-2 h-4 w-4" />
              Decline
            </Button>
            
            <Button
              variant="default"
              onClick={() => acceptCall()}
              className="flex-1 sm:flex-initial"
            >
              <Phone className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations sidebar */}
        <div className="md:col-span-1 border rounded-lg flex flex-col overflow-hidden bg-background">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
            </div>
            
            <div className="mb-4">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="requests">Requests</TabsTrigger>
                </TabsList>
              </Tabs>
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
          ) : !apiConversations || apiConversations.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center p-4 text-center">
              <i className="ri-message-3-line text-4xl text-muted-foreground mb-2"></i>
              <p className="text-muted-foreground mb-2">No conversations yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with people to start messaging
              </p>
              <Button onClick={() => setLocation("/members")} className="bg-black text-white hover:bg-gray-800">
                Find People
              </Button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {(filteredConversations || apiConversations || []).map((conversation: any) => {
                // Find the other participant (not current user)
                let otherParticipant;
                
                if (conversation.participants && conversation.participants.length > 0) {
                  otherParticipant = conversation.participants.find(
                    (p: any) => p.id !== currentUser.id
                  );
                } else if (conversation.otherUser) {
                  otherParticipant = conversation.otherUser;
                }

                // Skip if no other participant found
                if (!otherParticipant) {
                  return null;
                }

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
                        <AvatarImage src={otherParticipant.avatar || ""} alt={otherParticipant.name || otherParticipant.username} />
                        <AvatarFallback>{getInitials(otherParticipant.name || otherParticipant.username || "U")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium truncate">{otherParticipant.name || otherParticipant.username}</h3>
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
                            {conversation.lastMessage.senderId === currentUser.id && "You: "}
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
              }).filter(Boolean)}
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
              <Button onClick={() => setLocation("/members")} className="bg-black text-white hover:bg-gray-800">
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
                  <Button variant="ghost" size="icon" onClick={() => handleCall("audio")}>
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCall("video")}>
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
                ) : !apiMessages || apiMessages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center">
                    <p className="text-muted-foreground mb-2">No messages yet</p>
                    <p className="text-sm text-muted-foreground">
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  <>
                    {apiMessages.map((message: any, index: number) => {
                      // Handle both senderId and userId for compatibility
                      const messageUserId = message.senderId || message.userId;
                      const isCurrentUser = messageUserId === currentUser.id;
                      const showAvatar = index === 0 || 
                        (apiMessages[index - 1].senderId || apiMessages[index - 1].userId) !== messageUserId;
                      
                      // Log message details for debugging
                      console.log(`Message ${index}:`, message);
                      
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
                              <p className="break-words">
                                {message.content.split(/\s+/).map((word: string, i: number) => {
                                  // Check for URLs with http/https/www
                                  if (word.match(/^(https?:\/\/|www\.)/i)) {
                                    const url = word.startsWith('http') ? word : `https://${word}`;
                                    return (
                                      <span key={i}>
                                        <a 
                                          href={url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className={`${isCurrentUser ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'} hover:underline font-medium`}
                                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                                        >
                                          {word}
                                        </a>
                                        {' '}
                                      </span>
                                    );
                                  }
                                  // Check for domains without http/www (e.g. example.com)
                                  else if (word.includes('.') && word.match(/^[a-z0-9][\w\.-]*\.[a-z]{2,}$/i)) {
                                    return (
                                      <span key={i}>
                                        <a 
                                          href={`https://${word}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className={`${isCurrentUser ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'} hover:underline font-medium`}
                                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                                        >
                                          {word}
                                        </a>
                                        {' '}
                                      </span>
                                    );
                                  }
                                  // Check for product links
                                  else if (word.match(/^product\/\d+$/i)) {
                                    return (
                                      <span key={i}>
                                        <a 
                                          href={`/${word}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className={`${isCurrentUser ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'} hover:underline font-medium`}
                                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
                                        >
                                          {word}
                                        </a>
                                        {' '}
                                      </span>
                                    );
                                  }
                                  return <span key={i}>{word} </span>;
                                })}
                              </p>
                              {/* Gift interaction buttons for received gift messages */}
                              {!isCurrentUser && message.content.includes("🎁 I've sent you a gift:") && (
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleGiftResponse(message.id, 'accepted')}
                                  >
                                    <i className="ri-check-line mr-1"></i>
                                    Accept Gift
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={() => handleGiftResponse(message.id, 'declined')}
                                  >
                                    <i className="ri-close-line mr-1"></i>
                                    Decline
                                  </Button>
                                </div>
                              )}
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