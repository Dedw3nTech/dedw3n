import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, getStoredAuthToken } from "@/lib/queryClient";

// WebSocket connection
let socket: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL = 3000; // 3 seconds

// WebRTC configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

type MessageType = "text" | "image" | "video" | "audio" | "file" | "call_request" | "call_missed" | "call_ended";

// Define message interface
interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  isRead: boolean;
  messageType: MessageType;
  createdAt: string;
}

// Define conversation interface
interface Conversation {
  partnerId: number;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  participants: any[];
}

// Define call interface
interface Call {
  callId: string;
  initiatorId: number;
  receiverId: number;
  type: "audio" | "video";
  status: "requested" | "ongoing" | "declined" | "ended" | "missed";
}

// Define the peer connection state
interface PeerConnectionState {
  connection: RTCPeerConnection | null;
  dataChannel: RTCDataChannel | null;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

// Define messaging context
interface MessagingContextType {
  // State
  conversations: Conversation[];
  activeConversation: number | null;
  messages: Message[];
  unreadCount: number;
  isConnected: boolean;
  activeCall: Call | null;
  incomingCall: Call | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  
  // Methods
  sendMessage: (userId: number, content: string, attachmentUrl?: string, attachmentType?: string, messageType?: MessageType) => Promise<void>;
  startConversation: (username: string, message: string) => Promise<void>;
  setActiveConversation: (userId: number | null) => void;
  markAsRead: (userId: number) => Promise<void>;
  sendTypingIndicator: (userId: number, status: "typing" | "stopped") => void;
  deleteMessage: (messageId: number) => Promise<void>;
  clearConversation: (userId: number) => Promise<void>;
  
  // Call methods
  initiateCall: (userId: number, type: "audio" | "video") => Promise<string | null>;
  acceptCall: () => Promise<boolean>;
  declineCall: () => Promise<boolean>;
  endCall: () => Promise<boolean>;
  
  // WebRTC methods
  toggleMicrophone: (enabled: boolean) => void;
  toggleCamera: (enabled: boolean) => void;
  shareScreen: (enabled: boolean) => Promise<void>;
  
  // WebSocket connection
  connect: () => void;
  disconnect: () => void;
}

// Create context
const MessagingContext = createContext<MessagingContextType | null>(null);

// Convert protocol based on location
function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

// Provider component
export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States
  const [isConnected, setIsConnected] = useState(false);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // WebRTC
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  
  // Get unread message count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread/count"],
    enabled: !!user,
  });
  
  // Get conversations
  const { data: conversationsData } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
  });
  
  // Get messages for active conversation
  const { data: messagesData } = useQuery<{ messages: Message[]; otherUser: any; activeCall: Call | null }>({
    queryKey: ["/api/messages/conversations", activeConversation],
    enabled: !!user && !!activeConversation,
  });
  
  // Update active call from API response
  useEffect(() => {
    if (messagesData?.activeCall && !activeCall) {
      setActiveCall(messagesData.activeCall);
    }
  }, [messagesData]);
  
  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      content, 
      attachmentUrl, 
      attachmentType, 
      messageType = "text" 
    }: { 
      userId: number; 
      content: string; 
      attachmentUrl?: string; 
      attachmentType?: string;
      messageType?: MessageType;
    }) => {
      const res = await apiRequest("POST", `/api/messages/conversations/${userId}`, {
        content,
        attachmentUrl,
        attachmentType,
        messageType
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", activeConversation] });
    }
  });
  
  const startConversationMutation = useMutation({
    mutationFn: async ({ username, message }: { username: string; message: string }) => {
      const res = await apiRequest("POST", "/api/messages/conversations", {
        recipientUsername: username,
        firstMessage: message
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setActiveConversation(data.conversation.recipientId);
    }
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/messages/mark-read/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread/count"] });
    }
  });
  
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("DELETE", `/api/messages/${messageId}`);
      return await res.json();
    },
    onSuccess: () => {
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", activeConversation] });
      }
    }
  });
  
  const clearConversationMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/messages/conversations/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", activeConversation] });
      }
    }
  });
  
  // WebSocket connection management
  const connect = () => {
    if (!user || socket) return;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      return;
    }
    
    try {
      socket = new WebSocket(getWebSocketUrl());
      
      socket.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Authenticate with both userId and token
        if (socket && user) {
          // Get token using the proper function instead of direct localStorage access
          const token = getStoredAuthToken();
          
          socket.send(JSON.stringify({
            type: "authenticate",
            userId: user.id,
            token: token  // Include the JWT token for authentication
          }));
          
          console.log("Sent authentication request to WebSocket server with token");
        }
      };
      
      socket.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        socket = null;
        
        // Try to reconnect after delay with backoff
        if (reconnectTimer) clearTimeout(reconnectTimer);
        
        reconnectAttempts++;
        const backoffDelay = Math.min(30000, RECONNECT_INTERVAL * Math.pow(1.5, reconnectAttempts - 1));
        
        console.log(`WebSocket reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${backoffDelay}ms`);
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimer = setTimeout(() => {
            if (user) connect();
          }, backoffDelay);
        } else {
          console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
        }
      };
      
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Don't call close here as it will be handled by onclose event
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setIsConnected(false);
      
      // Try to reconnect after delay
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        if (user) connect();
      }, 5000);
    }
  };
  
  const disconnect = () => {
    if (socket) {
      socket.close();
      socket = null;
    }
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    setIsConnected(false);
  };
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "authenticated":
        console.log("Authenticated with messaging service");
        // Send a ping to keep connection alive
        setTimeout(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
        break;
        
      case "new_message":
        // Update conversation and message lists
        queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
        queryClient.invalidateQueries({ queryKey: ["/api/messages/unread/count"] });
        
        // If this message is for the active conversation, update messages
        if (activeConversation === data.message.senderId) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", activeConversation] });
          
          // Automatically mark as read if the conversation is active
          markAsReadMutation.mutate(data.message.senderId);
        } else {
          // Show notification for new message
          toast({
            title: "New message",
            description: data.message.content.length > 50 
              ? data.message.content.substring(0, 50) + "..." 
              : data.message.content,
          });
        }
        break;
        
      case "call_request":
        // Show incoming call notification
        setIncomingCall({
          callId: data.callId,
          initiatorId: data.initiatorId,
          receiverId: user?.id || 0,
          type: data.callType,
          status: "requested"
        });
        
        // Play ringtone
        const audio = new Audio("/sounds/ringtone.mp3");
        audio.loop = true;
        audio.play().catch(e => console.log("Error playing ringtone:", e));
        
        // Store the audio element to stop it later
        (window as any).ringtoneAudio = audio;
        break;
        
      case "call_accepted":
        // Update call status
        if (activeCall && activeCall.callId === data.callId) {
          setActiveCall({
            ...activeCall,
            status: "ongoing"
          });
          
          // Start WebRTC connection as the caller
          if (user?.id === activeCall.initiatorId) {
            setupWebRTC(activeCall.receiverId, activeCall.type);
          }
        }
        break;
        
      case "call_declined":
        // Handle declined call
        if (activeCall && activeCall.callId === data.callId) {
          toast({
            title: "Call declined",
            description: "The recipient declined your call",
          });
          
          cleanupCallResources();
        }
        break;
        
      case "call_ended":
        // Handle call end
        if (activeCall && activeCall.callId === data.callId) {
          toast({
            title: "Call ended",
            description: `Call duration: ${data.duration} seconds`,
          });
          
          cleanupCallResources();
        } else if (incomingCall && incomingCall.callId === data.callId) {
          setIncomingCall(null);
          if ((window as any).ringtoneAudio) {
            (window as any).ringtoneAudio.pause();
            (window as any).ringtoneAudio.currentTime = 0;
            (window as any).ringtoneAudio = null;
          }
        }
        break;
        
      case "signal":
        // Handle WebRTC signaling
        if (activeCall && data.callId === activeCall.callId) {
          handleSignaling(data);
        }
        break;
        
      case "typing_indicator":
        // Handle typing indicator - could update UI to show typing status
        break;
        
      case "read_receipt":
        // Handle read receipts - update message status
        if (activeConversation === data.readBy) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", activeConversation] });
        }
        break;
        
      case "status_update":
        // Handle online/offline status updates
        queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
        break;
        
      case "message_deleted":
        // Handle deleted message notifications
        if (activeConversation) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", activeConversation] });
        }
        break;
        
      case "error":
        console.error("WebSocket error:", data.message);
        toast({
          title: "Messaging Error",
          description: data.message,
          variant: "destructive",
        });
        break;
    }
  };
  
  // WebRTC handling functions
  const setupWebRTC = async (peerId: number, callType: "audio" | "video") => {
    try {
      // Create local stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video"
      });
      
      setLocalStream(stream);
      
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });
      
      peerConnection.current = pc;
      
      // Add local tracks to connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && activeCall) {
          socket.send(JSON.stringify({
            type: "signal",
            callId: activeCall.callId,
            recipientId: peerId,
            signal: {
              type: "ice-candidate",
              candidate: event.candidate
            }
          }));
        }
      };
      
      // Handle incoming tracks
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };
      
      // If we're the initiator (outgoing call), create and send the offer
      if (user?.id === activeCall?.initiatorId) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        if (socket && activeCall) {
          socket.send(JSON.stringify({
            type: "signal",
            callId: activeCall.callId,
            recipientId: peerId,
            signal: {
              type: "offer",
              sdp: pc.localDescription
            }
          }));
        }
      }
    } catch (error) {
      console.error("Error setting up WebRTC:", error);
      cleanupCallResources();
      
      toast({
        title: "Call Error",
        description: "Failed to access camera/microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  // Handle WebRTC signaling
  const handleSignaling = async (data: any) => {
    try {
      const pc = peerConnection.current;
      if (!pc || !activeCall) return;
      
      const signal = data.signal;
      
      switch (signal.type) {
        case "offer":
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          if (socket) {
            socket.send(JSON.stringify({
              type: "signal",
              callId: activeCall.callId,
              recipientId: data.senderId,
              signal: {
                type: "answer",
                sdp: pc.localDescription
              }
            }));
          }
          break;
          
        case "answer":
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          break;
          
        case "ice-candidate":
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          break;
      }
    } catch (error) {
      console.error("Error handling signaling:", error);
    }
  };
  
  // Clean up call resources
  const cleanupCallResources = () => {
    // Stop ringtone
    if ((window as any).ringtoneAudio) {
      (window as any).ringtoneAudio.pause();
      (window as any).ringtoneAudio = null;
    }
    
    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setRemoteStream(null);
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Clear call states
    setActiveCall(null);
    setIncomingCall(null);
  };
  
  // Start a call
  const initiateCall = async (userId: number, type: "audio" | "video"): Promise<string | null> => {
    if (!socket || !user) return null;
    
    try {
      // Send call request
      socket.send(JSON.stringify({
        type: "call_request",
        receiverId: userId,
        callType: type
      }));
      
      // Wait for response
      return new Promise((resolve) => {
        // Set up one-time handler for call_initiated message
        const originalOnMessage = socket!.onmessage;
        
        // We've already checked that socket is not null above
        // @ts-ignore
        socket!.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === "call_initiated") {
              // Set active call
              const call: Call = {
                callId: data.callId,
                initiatorId: user.id,
                receiverId: userId,
                type,
                status: "requested"
              };
              
              setActiveCall(call);
              
              // Restore original handler
              socket!.onmessage = originalOnMessage;
              
              // Resolve with call ID
              resolve(data.callId);
            } else {
              // Handle other messages normally
              if (originalOnMessage) {
                // @ts-ignore - Context binding is handled internally
                originalOnMessage(event);
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            if (originalOnMessage) {
              // @ts-ignore - Context binding is handled internally
              originalOnMessage(event);
            }
          }
        };
        
        // Set a timeout to restore the handler and reject
        setTimeout(() => {
          socket!.onmessage = originalOnMessage;
          resolve(null);
        }, 10000);
      });
    } catch (error) {
      console.error("Error initiating call:", error);
      return null;
    }
  };
  
  // Accept incoming call
  const acceptCall = async (): Promise<boolean> => {
    if (!socket || !incomingCall) return false;
    
    try {
      // Stop ringtone
      if ((window as any).ringtoneAudio) {
        (window as any).ringtoneAudio.pause();
        (window as any).ringtoneAudio = null;
      }
      
      // Set active call
      setActiveCall(incomingCall);
      setIncomingCall(null);
      
      // Send acceptance
      socket.send(JSON.stringify({
        type: "call_response",
        callId: incomingCall.callId,
        response: "accept"
      }));
      
      // Setup WebRTC as the callee
      await setupWebRTC(incomingCall.initiatorId, incomingCall.type);
      
      return true;
    } catch (error) {
      console.error("Error accepting call:", error);
      cleanupCallResources();
      return false;
    }
  };
  
  // Decline incoming call
  const declineCall = async (): Promise<boolean> => {
    if (!socket || !incomingCall) return false;
    
    try {
      // Stop ringtone
      if ((window as any).ringtoneAudio) {
        (window as any).ringtoneAudio.pause();
        (window as any).ringtoneAudio = null;
      }
      
      // Send decline response
      socket.send(JSON.stringify({
        type: "call_response",
        callId: incomingCall.callId,
        response: "decline"
      }));
      
      // Clear incoming call
      setIncomingCall(null);
      
      return true;
    } catch (error) {
      console.error("Error declining call:", error);
      setIncomingCall(null);
      return false;
    }
  };
  
  // End active call
  const endCall = async (): Promise<boolean> => {
    if (!socket || !activeCall) return false;
    
    try {
      // Send end call message
      socket.send(JSON.stringify({
        type: "call_end",
        callId: activeCall.callId,
        reason: "ended_by_user"
      }));
      
      // Clean up resources
      cleanupCallResources();
      
      return true;
    } catch (error) {
      console.error("Error ending call:", error);
      cleanupCallResources();
      return false;
    }
  };
  
  // Media control functions
  const toggleMicrophone = (enabled: boolean) => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = enabled;
      });
      setIsMuted(!enabled);
    }
  };
  
  const toggleCamera = (enabled: boolean) => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = enabled;
      });
      setIsVideoOff(!enabled);
    }
  };
  
  const shareScreen = async (enabled: boolean): Promise<void> => {
    if (!peerConnection.current || !activeCall) return;
    
    try {
      if (enabled) {
        // Get screen share stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        // Replace video track
        if (localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          
          // Find sender that sends video
          const senders = peerConnection.current.getSenders();
          const videoSender = senders.find(sender => 
            sender.track?.kind === 'video'
          );
          
          if (videoSender) {
            videoSender.replaceTrack(videoTrack);
            
            // Stop the track when the screen share ends
            videoTrack.onended = async () => {
              await shareScreen(false);
            };
            
            // Update screen sharing state
            setIsScreenSharing(true);
          }
        }
      } else {
        // Revert to camera
        if (localStream) {
          // Stop any existing video tracks
          localStream.getVideoTracks().forEach(track => track.stop());
          
          // Get new camera stream
          const stream = await navigator.mediaDevices.getUserMedia({
            video: activeCall.type === "video"
          });
          
          // Replace the video track in the peer connection
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const senders = peerConnection.current.getSenders();
            const videoSender = senders.find(sender => 
              sender.track?.kind === 'video'
            );
            
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
            }
            
            // Update local stream
            const newLocalStream = new MediaStream();
            
            // Add audio tracks from existing stream
            localStream.getAudioTracks().forEach(track => 
              newLocalStream.addTrack(track)
            );
            
            // Add new video track
            newLocalStream.addTrack(videoTrack);
            
            setLocalStream(newLocalStream);
            
            // Update screen sharing state
            setIsScreenSharing(false);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast({
        title: "Screen Share Error",
        description: "Failed to share screen. Please try again.",
        variant: "destructive",
      });
      
      // Reset screen sharing state on error
      setIsScreenSharing(false);
    }
  };
  
  // Connect WebSocket when user is available
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [user]);
  
  // Auto-mark messages as read when conversation becomes active
  useEffect(() => {
    if (activeConversation && user) {
      markAsReadMutation.mutate(activeConversation);
    }
  }, [activeConversation]);
  
  // Send typing indicators
  const sendTypingIndicator = (userId: number, status: "typing" | "stopped") => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: "typing",
        receiverId: userId,
        status
      }));
    }
  };
  
  // Wrapper functions
  const sendMessage = async (
    userId: number, 
    content: string, 
    attachmentUrl?: string, 
    attachmentType?: string,
    messageType: MessageType = "text"
  ) => {
    // Create the message via HTTP API
    const result = await sendMessageMutation.mutateAsync({ 
      userId, 
      content, 
      attachmentUrl, 
      attachmentType,
      messageType
    });
    
    // Also send via WebSocket for real-time delivery
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: "chat", // Important: This must match the type expected in server's handleChatMessage function
        receiverId: userId,
        content,
        attachmentUrl,
        attachmentType,
        messageType
      }));
    }
    
    return result;
  };
  
  const startConversation = async (username: string, message: string) => {
    await startConversationMutation.mutateAsync({ username, message });
  };
  
  const markAsRead = async (userId: number) => {
    await markAsReadMutation.mutateAsync(userId);
  };
  
  const deleteMessage = async (messageId: number) => {
    await deleteMessageMutation.mutateAsync(messageId);
  };
  
  const clearConversation = async (userId: number) => {
    await clearConversationMutation.mutateAsync(userId);
  };
  
  const value = {
    // State
    conversations: conversationsData || [],
    activeConversation,
    messages: messagesData?.messages || [],
    unreadCount: unreadData?.count || 0,
    isConnected,
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    
    // Methods
    sendMessage,
    startConversation,
    setActiveConversation,
    markAsRead,
    sendTypingIndicator,
    deleteMessage,
    clearConversation,
    
    // Call methods
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    
    // WebRTC methods
    toggleMicrophone,
    toggleCamera,
    shareScreen,
    
    // WebSocket connection
    connect,
    disconnect
  };
  
  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

// Hook to use messaging context
export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}