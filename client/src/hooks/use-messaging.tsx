import { createContext, useCallback, useContext, useEffect, useState, useRef, ReactNode } from "react";
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
const MAX_RECONNECT_INTERVAL = 30000; // 30 seconds maximum reconnect interval

// WebSocket connection health check
let healthCheckTimer: NodeJS.Timeout | null = null;
const HEALTH_CHECK_INTERVAL = 10000; // 10 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds timeout for health check

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
  
  // Connection state
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'authenticated';
  connectionDetails: {
    id?: string;
    startTime?: number;
    reconnects?: number;
    lastActivity?: number;
    serverConnectionId?: string;
    serverTime?: string;
    authenticated?: boolean;
    tokenAuth?: boolean;
    disconnectTime?: number;
    disconnectCode?: number;
    disconnectReason?: string;
    pingLatency?: number;
    activeConnections?: number;
    connectionDuration?: number;
    errorCount?: number;
    authRetry?: boolean;
    lastError?: {
      time: number;
      type: string;
      url: string;
    };
  };
  
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
  
  // Connection diagnostic information
  getConnectionStats: () => {
    uptime: number | null;
    reconnects: number;
    lastActivity: string | null;
    errorCount: number;
    latency: number | null;
  };
}

// Create context
const MessagingContext = createContext<MessagingContextType | null>(null);

// Convert protocol based on location
function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  // Base URL without query parameters
  return `${protocol}//${window.location.host}/ws`;
}

// Generate a unique connection ID for debugging and tracking
function generateConnectionId() {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `ws_${timestamp}_${randomPart}`;
}

// Provider component
export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'authenticated'>('disconnected');
  const [connectionDetails, setConnectionDetails] = useState<{
    id?: string;
    startTime?: number;
    reconnects?: number;
    lastActivity?: number;
    serverConnectionId?: string;
    serverTime?: string;
    authenticated?: boolean;
    tokenAuth?: boolean;
    disconnectTime?: number;
    disconnectCode?: number;
    disconnectReason?: string;
    pingLatency?: number;
    activeConnections?: number;
    connectionDuration?: number;
    errorCount?: number;
    authRetry?: boolean;
    lastError?: {
      time: number;
      type: string;
      url: string;
    };
  }>({});
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
  
  // Placeholder for the connect function that will be defined later
  // This allows us to use it in the checkConnectionHealth function
  const connectRef = useRef<() => void>(() => {
    console.log("Connect function not yet initialized");
  });
  
  // Helper function to check WebSocket health and reconnect if needed
  const checkConnectionHealth = useCallback(() => {
    // If no user is logged in, don't attempt connection
    if (!user) return;
    
    // If socket doesn't exist or is in closing/closed state, reconnect
    if (!socket || 
        socket.readyState === WebSocket.CLOSING || 
        socket.readyState === WebSocket.CLOSED) {
      console.log("WebSocket health check: Connection needed, initiating...");
      // Ensure socket is null before reconnecting to avoid duplicates
      socket = null;
      connectRef.current();
      return;
    }
    
    // If socket exists but isn't open, and it's been a while, force reconnect
    if (socket && socket.readyState !== WebSocket.OPEN && !isConnected) {
      console.log("WebSocket health check: Connection exists but not open, resetting...");
      // Force close and reconnect
      socket.close();
      socket = null;
      connectRef.current();
    }
  }, [user, isConnected]);
  
  // Note: Main health check is set up in the user effect below

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    // Update last activity timestamp for connection health monitoring
    setConnectionDetails(prev => ({
      ...prev,
      lastActivity: Date.now()
    }));
    
    // Handle different message types
    switch (data.type) {
      case "authenticated":
        console.log("WebSocket authenticated successfully with server ID:", data.connectionId);
        setConnectionStatus('authenticated');
        setConnectionDetails(prev => ({
          ...prev,
          authenticated: true,
          serverConnectionId: data.connectionId,
          tokenAuth: !!data.tokenAuth,
          serverTime: data.serverTime
        }));
        break;
      
      case "auth_success": // Legacy support
        console.log("WebSocket authenticated successfully (legacy message)");
        setConnectionStatus('authenticated');
        setConnectionDetails(prev => ({
          ...prev,
          authenticated: true,
          serverConnectionId: data.connectionId,
          tokenAuth: true,
          serverTime: data.timestamp
        }));
        break;
        
      case "auth_error":
        console.error("WebSocket authentication failed:", data.message);
        setConnectionStatus('connected'); // Still connected but not authenticated
        setConnectionDetails(prev => ({
          ...prev,
          authenticated: false,
          errorCount: (prev.errorCount || 0) + 1,
          lastError: {
            time: Date.now(),
            type: 'auth_error',
            url: window.location.href
          }
        }));
        
        // Show authentication error toast
        toast({
          title: "Authentication Failed",
          description: "Failed to authenticate messaging connection. Try refreshing the page.",
          variant: "destructive",
        });
        break;
        
      case "message":
        console.log("New message received:", data.message);
        // Update message list if this is for the active conversation
        if (activeConversation === data.message.senderId) {
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations", activeConversation] });
          // Mark as read automatically if this is the active conversation
          markAsReadMutation.mutate(data.message.senderId);
        } else {
          // Otherwise just update the unread count
          queryClient.invalidateQueries({ queryKey: ["/api/messages/unread/count"] });
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
          
          // Show notification for new message if not from active conversation
          toast({
            title: `New message from ${data.message.senderName}`,
            description: data.message.content.length > 30 ? 
              data.message.content.substring(0, 30) + "..." : 
              data.message.content,
            action: <div 
              className="cursor-pointer underline" 
              onClick={() => setActiveConversation(data.message.senderId)}
            >
              View
            </div>
          });
        }
        break;
        
      case "typing_indicator":
        // Handle typing indicator updates
        if (activeConversation === data.userId) {
          // Update UI to show typing indicator
          console.log(`User ${data.userId} is ${data.status}`);
          // Implementation depends on UI
        }
        break;
        
      case "user_status":
        // Handle user status updates (online/offline)
        console.log(`User ${data.userId} is now ${data.status}`);
        // Update the conversations list to reflect new status
        queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
        break;
        
      case "call_request":
        console.log("Incoming call:", data);
        // Handle incoming call request
        if (!activeCall && !incomingCall) {
          const call: Call = {
            callId: data.callId,
            initiatorId: data.initiatorId,
            receiverId: data.receiverId,
            type: data.callType,
            status: "requested"
          };
          setIncomingCall(call);
          
          // Play ringtone or notification sound
          // Show UI notification for incoming call
          toast({
            title: `Incoming ${data.callType} Call`,
            description: `From ${data.initiatorName}`,
            duration: 30000, // Longer duration for call notifications
            action: <div className="flex space-x-2">
              <div 
                className="cursor-pointer px-2 py-1 bg-green-500 text-white rounded"
                onClick={() => acceptCall()}
              >
                Accept
              </div>
              <div 
                className="cursor-pointer px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => declineCall()}
              >
                Decline
              </div>
            </div>
          });
        } else {
          // Already in a call, automatically reject
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: "call_response",
              callId: data.callId,
              response: "declined",
              reason: "User busy in another call"
            }));
          }
        }
        break;
        
      case "call_response":
        console.log("Call response:", data);
        if (activeCall && activeCall.callId === data.callId) {
          if (data.response === "accepted") {
            // Call was accepted, update status
            setActiveCall({
              ...activeCall,
              status: "ongoing"
            });
            
            // Initialize WebRTC connection
            setupPeerConnection(activeCall.receiverId, activeCall.type);
          } else {
            // Call was declined or missed
            setActiveCall({
              ...activeCall,
              status: data.response === "declined" ? "declined" : "missed"
            });
            
            // Show notification that call was declined
            toast({
              title: "Call Ended",
              description: data.response === "declined" ? 
                "Call was declined" : 
                "Call was not answered",
              variant: "destructive",
            });
            
            // Clean up call state after a delay
            setTimeout(() => {
              setActiveCall(null);
            }, 3000);
          }
        }
        break;
        
      case "call_end":
        console.log("Call ended:", data);
        if (
          (activeCall && activeCall.callId === data.callId) ||
          (incomingCall && incomingCall.callId === data.callId)
        ) {
          // Update call status
          if (activeCall) {
            setActiveCall({
              ...activeCall,
              status: "ended"
            });
          }
          
          // Clean up call resources
          cleanupCallResources();
          
          // Show notification
          toast({
            title: "Call Ended",
            description: data.reason || "The call has ended",
          });
          
          // Clean up call state after a delay
          setTimeout(() => {
            setActiveCall(null);
            setIncomingCall(null);
          }, 3000);
        }
        break;
        
      case "ice_candidate":
        console.log("Received ICE candidate");
        // Add ice candidate to peer connection
        if (peerConnection.current && data.candidate) {
          try {
            peerConnection.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (error) {
            console.error("Error adding received ICE candidate", error);
          }
        }
        break;
        
      case "session_description":
        console.log("Received session description:", data.type);
        // Handle the received session description (offer or answer)
        if (peerConnection.current) {
          const rtcSessionDescription = new RTCSessionDescription({
            type: data.type,
            sdp: data.sdp
          });
          
          peerConnection.current.setRemoteDescription(rtcSessionDescription)
            .then(() => {
              // If we got an offer, we need to create an answer
              if (data.type === 'offer') {
                return peerConnection.current!.createAnswer();
              }
            })
            .then(answer => {
              if (answer) {
                return peerConnection.current!.setLocalDescription(answer);
              }
            })
            .then(() => {
              // Send the answer back if we created one
              if (data.type === 'offer' && peerConnection.current!.localDescription) {
                socket!.send(JSON.stringify({
                  type: "session_description",
                  target: data.from,
                  description: peerConnection.current!.localDescription
                }));
              }
            })
            .catch(error => {
              console.error("Error handling session description:", error);
            });
        }
        break;
        
      case "ping":
        // Respond to server ping with pong containing timestamp
        if (socket && socket.readyState === WebSocket.OPEN) {
          const pongData = {
            type: "pong",
            timestamp: Date.now(),
            echo: data.timestamp
          };
          socket.send(JSON.stringify(pongData));
        }
        break;
        
      case "pong":
        // Calculate latency from ping-pong
        if (data.echo) {
          const latency = Date.now() - data.echo;
          setConnectionDetails(prev => ({
            ...prev,
            pingLatency: latency,
            lastActivity: Date.now()
          }));
        }
        break;
        
      case "error":
        console.error("Server error message:", data.message);
        // Show error toast for important errors
        if (data.level === "fatal" || data.level === "error") {
          toast({
            title: "Messaging Error",
            description: data.message,
            variant: "destructive",
          });
        }
        
        // Update error stats
        setConnectionDetails(prev => ({
          ...prev,
          errorCount: (prev.errorCount || 0) + 1,
          lastError: {
            time: Date.now(),
            type: data.code || 'server_error',
            url: window.location.href
          }
        }));
        break;
        
      default:
        console.log("Unknown message type:", data.type, data);
    }
  };
  
  // WebSocket connection function
  const connect = () => {
    if (!user || (socket && socket.readyState === WebSocket.OPEN)) return;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      setConnectionStatus('disconnected');
      setConnectionDetails(prev => ({
        ...prev,
        disconnectTime: Date.now(),
        disconnectReason: 'Maximum reconnection attempts reached'
      }));
      return;
    }
    
    // Clean up any existing connection
    if (socket) {
      try {
        socket.close();
      } catch (e) {
        console.warn("Error closing existing socket:", e);
      }
      socket = null;
    }
    
    // Update connection status to connecting
    setConnectionStatus('connecting');
    
    // Generate connection ID and timestamp
    const connectionId = generateConnectionId();
    const connectionStartTime = Date.now();
    
    // Update connection details
    setConnectionDetails(prev => ({
      ...prev,
      id: connectionId,
      startTime: connectionStartTime,
      reconnects: (prev.reconnects || 0) + (reconnectAttempts > 0 ? 1 : 0),
      disconnectTime: undefined,
      disconnectCode: undefined,
      disconnectReason: undefined
    }));
    
    // Construct WebSocket URL with included authentication token
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const token = getStoredAuthToken();
    
    // Add timestamp, connection ID, user ID, and token to prevent caching and for authentication
    const timestamp = Date.now();
    let wsUrl = `${protocol}//${window.location.host}/ws?t=${timestamp}&cid=${connectionId}`;
    
    // Add authentication parameters if user is available
    if (user?.id) {
      wsUrl += `&userId=${user.id}`;
      
      // Add token if available (for token-based authentication)
      if (token) {
        // URL encode the token to prevent special characters from breaking the URL
        const encodedToken = encodeURIComponent(token);
        wsUrl += `&token=${encodedToken}`;
        console.log("Added authentication token to WebSocket URL");
      } else {
        console.warn("No authentication token available for WebSocket connection");
      }
    } else {
      console.warn("No user ID available for WebSocket connection");
      // Return early as we can't authenticate without a user ID
      reconnectAttempts++;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        connect();
      }, Math.min(RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts), MAX_RECONNECT_INTERVAL));
      return;
    }
    
    console.log(`Connecting to WebSocket: ${protocol}//${window.location.host}/ws... (connection ID: ${connectionId})`);
    // Don't log the full URL with token for security reasons
    
    try {
      socket = new WebSocket(wsUrl);
    } catch (error) {
      console.error("Failed to construct WebSocket:", error);
      setConnectionStatus('disconnected');
      setConnectionDetails(prev => ({
        ...prev,
        disconnectTime: Date.now(),
        disconnectReason: 'Failed to construct WebSocket: ' + (error instanceof Error ? error.message : String(error)),
        errorCount: (prev.errorCount || 0) + 1,
        lastError: {
          time: Date.now(),
          type: 'construction_error',
          url: wsUrl
        }
      }));
      
      // Schedule a reconnect
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        reconnectAttempts++;
        connect();
      }, RECONNECT_INTERVAL);
      
      return;
    }
    
    if (socket) {
      socket.onopen = () => {
        console.log("WebSocket connected successfully");
        
        // Make sure socket still exists before setting properties
        if (socket) {
          // Store the connection details on the socket object itself
          (socket as any)._connectionTime = connectionStartTime;
          (socket as any)._connectionId = connectionId;
          (socket as any)._reconnectCount = reconnectAttempts;
        }
        
        // Update connection status
        setConnectionDetails(prevDetails => ({
          ...prevDetails,
          id: connectionId,
          startTime: connectionStartTime,
          reconnects: (prevDetails.reconnects || 0) + (reconnectAttempts > 0 ? 1 : 0)
        }));
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Reset reconnect attempts on successful connection
        if (reconnectAttempts > 0) {
          console.log(`Connection restored after ${reconnectAttempts} attempts`);
        }
        reconnectAttempts = 0;
        
        // Authenticate the connection
        if (user) {
          // Log token presence for debugging (but not the actual token)
          console.log(`Authenticating WebSocket with userId ${user.id}, token present: ${!!token}, connectionId: ${connectionId}`);
          
          // Debug URL parameters
          try {
            if (wsUrl) {
              const urlParts = new URL(wsUrl);
              console.log(`WebSocket connection URL parsing: host=${urlParts.host}, pathname=${urlParts.pathname}, params=`, 
                Object.fromEntries(urlParts.searchParams.entries()));
            }
          } catch (e) {
            console.error('Error parsing WebSocket URL:', e);
          }
          
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: "authenticate",
              userId: user.id,
              token: token,  // Include the JWT token for authentication
              connectionId: connectionId, // Send connection ID for tracing
              clientInfo: {
                timestamp: new Date().toISOString(),
                reconnectAttempts,
                url: window.location.pathname,
                userAgent: navigator.userAgent.substring(0, 100) // Truncate user agent to avoid large payloads
              }
            }));
          }
          
          console.log("Sent authentication request to WebSocket server with token");
          
          // Set a timeout to verify authentication success
          setTimeout(() => {
            if (socket && socket.readyState === WebSocket.OPEN && connectionStatus !== 'authenticated') {
              console.warn("WebSocket authentication may have failed - connection is open but not authenticated");
              // Try to re-authenticate with a fresh token
              const freshToken = getStoredAuthToken();
              socket.send(JSON.stringify({
                type: "authenticate",
                userId: user.id,
                token: freshToken,
                connectionId: connectionId,
                retryAttempt: true, // Mark as retry for server logging
                timestamp: Date.now() // Add timestamp for debugging
              }));
              console.log("Sent follow-up authentication request to WebSocket server");
            }
          }, 5000); // Check after 5 seconds
        }
      };
    }
    
    if (socket) {
      socket.onclose = (event) => {
        console.log(`WebSocket disconnected: Code=${event.code}, Reason=${event.reason || 'No reason provided'}`);
        
        // Update connection status
        setIsConnected(false);
        setConnectionStatus('disconnected');
      
        // Get specific meaning for close codes for better user feedback
        const codeDescription = 
        event.code === 1000 ? "Normal closure" :
        event.code === 1001 ? "Going away" :
        event.code === 1002 ? "Protocol error" :
        event.code === 1003 ? "Unsupported data" :
        event.code === 1005 ? "No status received" :
        event.code === 1006 ? "Abnormal closure" :
        event.code === 1007 ? "Invalid frame payload data" :
        event.code === 1008 ? "Policy violation" :
        event.code === 1009 ? "Message too big" :
        event.code === 1010 ? "Extension required" :
        event.code === 1011 ? "Internal server error" :
        event.code === 1012 ? "Service restart" :
        event.code === 1013 ? "Try again later" :
        event.code === 1014 ? "Bad gateway" : "Unknown error";
      
        const disconnectTime = Date.now();
      
        // Record disconnection in connection details with enhanced information
        setConnectionDetails(prev => ({
          ...prev,
          disconnectTime,
          disconnectCode: event.code,
          disconnectReason: event.reason || codeDescription,
          connectionDuration: prev.startTime ? disconnectTime - prev.startTime : undefined
        }));
    
        // Clean up the socket reference
        socket = null;
      
        // Try to reconnect after delay with backoff
        if (reconnectTimer) clearTimeout(reconnectTimer);
      
        // Handle different close codes differently
        switch (event.code) {
          // Normal closure - normal server restart or page navigation
          case 1000:
            // Don't increment reconnect attempts for clean close
            // But still reconnect in case of server restart
            console.log("Clean WebSocket close - will attempt normal reconnect");
            break;
            
          // Going away - typically browser navigation
          case 1001:
            console.log("WebSocket going away (likely page navigation)");
            // Don't auto-reconnect as user is likely changing pages
            return;
            
          // Protocol error
          case 1002:
            console.warn("WebSocket protocol error - will try to reconnect");
            reconnectAttempts++;
            break;
            
          // Abnormal closure - most common case when server crashes or restarts
          case 1006:
            console.warn("WebSocket abnormal closure (server may be restarting)");
            // This is likely a server restart, be patient with reconnects
            reconnectAttempts++;
            
            // For abnormal closures, attempt reconnection more quickly
            // to avoid issues with features that require WebSockets
            const quickReconnectDelay = 1000; // 1 second
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              reconnectTimer = setTimeout(() => {
                if (user) {
                  // Reset connection completely to avoid any stale connection issues
                  socket = null;
                  connect();
                }
              }, quickReconnectDelay);
            }
            
            // Skip the regular reconnection flow for abnormal closures
            return;
            
          // Internal server error
          case 1011:
            console.warn("WebSocket server error - will try to reconnect");
            reconnectAttempts++;
            break;
            
          // Service restart
          case 1012:
            console.log("WebSocket service restarting - will try to reconnect");
            // Don't increment attempts for service restart
            break;
            
          // Default behavior for other codes
          default:
            reconnectAttempts++;
            console.warn(`WebSocket closed with code ${event.code} - will try to reconnect`);
        }
        
        // Apply increasing backoff
        const backoffDelay = Math.min(
          RECONNECT_INTERVAL * Math.pow(1.5, reconnectAttempts),
          MAX_RECONNECT_INTERVAL
        );
        
        console.log(`WebSocket reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${backoffDelay}ms (Code: ${event.code})`);
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectTimer = setTimeout(() => {
            if (user) {
              // Reset connection completely to avoid any stale connection issues
              socket = null;
              connect();
            }
          }, backoffDelay);
        } else {
          console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
          // Notify the user of connection issues only if not a temporary disconnect during navigation
          if (event.code !== 1001) {
            toast({
              title: "Connection Issues",
              description: "Unable to connect to messaging service. Please try refreshing the page.",
              variant: "destructive",
            });
          }
        }
      };
    }
    
    if (socket) {
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        
        // Log detailed connection error information
        setConnectionDetails(prev => ({
        ...prev,
        lastActivity: Date.now(),
        errorCount: (prev.errorCount || 0) + 1,
        lastError: {
          time: Date.now(),
          type: 'websocket-error',
          // We can't access error details due to browser security restrictions,
          // but we can record when it happened
          url: window.location.href
        }
      }));
      
      // Update UI to show connection is having issues
      if (isConnected) {
        // Show warning toast only if we were previously connected
        toast({
          title: "Connection Issues",
          description: "Experiencing network issues. Attempting to recover...",
          variant: "destructive",
        });
      }
      
      // Don't call close here as the connection will be handled by onclose event
      };
    }
    
    if (socket) {
      socket.onmessage = (event) => {
        try {
          // Log the raw message for debugging
          console.debug("Raw WebSocket message received:", event.data);
          
          const data = JSON.parse(event.data);
          
          // Log parsed data for debugging
          console.debug("Parsed WebSocket message:", data);
          
          // Handle the message
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error, "Raw data:", event.data);
        }
      };
    }
  };
  
  // Properly clean up all WebSocket related resources
  const disconnect = () => {
    // Clean up WebSocket connection
    if (socket) {
      try {
        socket.close(1000, "User initiated disconnect");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      socket = null;
    }
    
    // Clean up reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Reset connection state
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    // Clean up any calls
    cleanupCallResources();
  };
  
  // Clean up call resources
  const cleanupCallResources = () => {
    // Close media streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  };
  
  // Set up peer connection for WebRTC
  const setupPeerConnection = async (targetUserId: number, callType: "audio" | "video") => {
    // Clean up any existing connection
    cleanupCallResources();
    
    // Create a new RTCPeerConnection
    peerConnection.current = new RTCPeerConnection(ICE_SERVERS);
    
    // Get user media
    try {
      const mediaConstraints = {
        audio: true,
        video: callType === "video"
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
      setLocalStream(stream);
      
      // Add tracks to the peer connection
      stream.getTracks().forEach(track => {
        peerConnection.current!.addTrack(track, stream);
      });
      
      // Set up event handlers for the peer connection
      peerConnection.current.onicecandidate = event => {
        if (event.candidate && socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "ice_candidate",
            target: targetUserId,
            candidate: event.candidate
          }));
        }
      };
      
      peerConnection.current.ontrack = event => {
        setRemoteStream(event.streams[0]);
      };
      
      // Create and send the offer if we initiated the call
      if (activeCall && activeCall.initiatorId === user?.id) {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "session_description",
            target: targetUserId,
            description: offer
          }));
        }
      }
    } catch (error) {
      console.error("Error setting up media devices:", error);
      
      toast({
        title: "Media Error",
        description: "Failed to access camera or microphone. Please check permissions.",
        variant: "destructive",
      });
      
      // End the call due to media error
      endCall();
    }
  };
  
  // Methods for the messaging context
  const sendMessage = async (
    userId: number, 
    content: string, 
    attachmentUrl?: string, 
    attachmentType?: string,
    messageType: MessageType = "text"
  ) => {
    try {
      // Send message through the API
      await sendMessageMutation.mutateAsync({ 
        userId, 
        content, 
        attachmentUrl, 
        attachmentType,
        messageType 
      });
      
      // Also send through WebSocket for real-time delivery
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "message",
          recipientId: userId,
          content,
          attachmentUrl,
          attachmentType,
          messageType
        }));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };
  
  const startConversation = async (username: string, message: string) => {
    try {
      await startConversationMutation.mutateAsync({ username, message });
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  };
  
  const markAsRead = async (userId: number) => {
    try {
      await markAsReadMutation.mutateAsync(userId);
      
      // Also send through WebSocket to update in real-time
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "read_receipt",
          senderId: userId
        }));
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  };
  
  const sendTypingIndicator = (userId: number, status: "typing" | "stopped") => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "typing_indicator",
        recipientId: userId,
        status
      }));
    }
  };
  
  const deleteMessage = async (messageId: number) => {
    try {
      await deleteMessageMutation.mutateAsync(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };
  
  const clearConversation = async (userId: number) => {
    try {
      await clearConversationMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Error clearing conversation:", error);
      throw error;
    }
  };
  
  // Call methods
  const initiateCall = async (userId: number, type: "audio" | "video"): Promise<string | null> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast({
        title: "Connection Error",
        description: "Cannot start call: not connected to messaging service",
        variant: "destructive",
      });
      return null;
    }
    
    try {
      // Generate a unique call ID
      const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Update local state
      const call: Call = {
        callId,
        initiatorId: user?.id!,
        receiverId: userId,
        type,
        status: "requested"
      };
      
      setActiveCall(call);
      
      // Send call request through WebSocket
      socket.send(JSON.stringify({
        type: "call_request",
        callId,
        recipientId: userId,
        callType: type
      }));
      
      // Return the call ID for tracking
      return callId;
    } catch (error) {
      console.error("Error initiating call:", error);
      return null;
    }
  };
  
  const acceptCall = async (): Promise<boolean> => {
    if (!incomingCall || !socket || socket.readyState !== WebSocket.OPEN) return false;
    
    try {
      // Update local state
      setActiveCall(incomingCall);
      setIncomingCall(null);
      
      // Send acceptance through WebSocket
      socket.send(JSON.stringify({
        type: "call_response",
        callId: incomingCall.callId,
        response: "accepted"
      }));
      
      // Set up WebRTC connection
      await setupPeerConnection(incomingCall.initiatorId, incomingCall.type);
      
      return true;
    } catch (error) {
      console.error("Error accepting call:", error);
      return false;
    }
  };
  
  const declineCall = async (): Promise<boolean> => {
    if (!incomingCall || !socket || socket.readyState !== WebSocket.OPEN) return false;
    
    try {
      // Send decline through WebSocket
      socket.send(JSON.stringify({
        type: "call_response",
        callId: incomingCall.callId,
        response: "declined"
      }));
      
      // Clear incoming call state
      setIncomingCall(null);
      
      return true;
    } catch (error) {
      console.error("Error declining call:", error);
      return false;
    }
  };
  
  const endCall = async (): Promise<boolean> => {
    if (!activeCall || !socket || socket.readyState !== WebSocket.OPEN) return false;
    
    try {
      // Send end call through WebSocket
      socket.send(JSON.stringify({
        type: "call_end",
        callId: activeCall.callId,
        reason: "User ended call"
      }));
      
      // Update local state
      setActiveCall({
        ...activeCall,
        status: "ended"
      });
      
      // Clean up resources
      cleanupCallResources();
      
      // Clear call state after a short delay
      setTimeout(() => {
        setActiveCall(null);
      }, 3000);
      
      return true;
    } catch (error) {
      console.error("Error ending call:", error);
      return false;
    }
  };
  
  // WebRTC control methods
  const toggleMicrophone = (enabled: boolean) => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsMuted(!enabled);
    }
  };
  
  const toggleCamera = (enabled: boolean) => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsVideoOff(!enabled);
    }
  };
  
  const shareScreen = async (enabled: boolean): Promise<void> => {
    if (!peerConnection.current || !activeCall) return;
    
    if (enabled) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true
        });
        
        // Replace the video track
        if (localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          
          const senders = peerConnection.current.getSenders();
          const sender = senders.find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
          
          setIsScreenSharing(true);
          
          // When screen sharing stops
          videoTrack.onended = () => {
            shareScreen(false).catch(console.error);
          };
        }
      } catch (error) {
        console.error("Error starting screen share:", error);
        toast({
          title: "Screen Sharing Failed",
          description: "Could not start screen sharing",
          variant: "destructive",
        });
      }
    } else {
      // Switch back to camera
      if (localStream && peerConnection.current) {
        try {
          const userStream = await navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: true
          });
          
          const videoTrack = userStream.getVideoTracks()[0];
          
          const senders = peerConnection.current.getSenders();
          const sender = senders.find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
          
          setIsScreenSharing(false);
        } catch (error) {
          console.error("Error stopping screen share:", error);
        }
      }
    }
  };
  
  // Get connection statistics
  const getConnectionStats = () => {
    return {
      uptime: connectionDetails.startTime 
        ? Math.floor((Date.now() - connectionDetails.startTime) / 1000) 
        : null,
      reconnects: connectionDetails.reconnects || 0,
      lastActivity: connectionDetails.lastActivity 
        ? new Date(connectionDetails.lastActivity).toISOString() 
        : null,
      errorCount: connectionDetails.errorCount || 0,
      latency: connectionDetails.pingLatency || null,
    };
  };
  
  // Setup regular health checks with the existing checkConnectionHealth function
  useEffect(() => {
    if (user) {
      // Start health check timer
      if (healthCheckTimer) clearInterval(healthCheckTimer);
      healthCheckTimer = setInterval(checkConnectionHealth, HEALTH_CHECK_INTERVAL);
      
      // Initial connection
      connect();
    } else {
      disconnect();
      // Clear health check timer when user is not available
      if (healthCheckTimer) {
        clearInterval(healthCheckTimer);
        healthCheckTimer = null;
      }
    }
    
    // Clean up on unmount
    return () => {
      disconnect();
      if (healthCheckTimer) {
        clearInterval(healthCheckTimer);
        healthCheckTimer = null;
      }
    };
  }, [user]);
  
  // Expose methods and state through context
  const value: MessagingContextType = {
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
    
    // Connection state
    connectionStatus,
    connectionDetails,
    
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
    
    // Connection management
    connect,
    disconnect,
    
    // Connection diagnostics
    getConnectionStats
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