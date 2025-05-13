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
      connect();
      return;
    }
    
    // If socket exists but isn't open, and it's been a while, force reconnect
    if (socket && socket.readyState !== WebSocket.OPEN && !isConnected) {
      console.log("WebSocket health check: Connection exists but not open, resetting...");
      // Force close and reconnect
      socket.close();
      socket = null;
      connect();
    }
  }, [user, isConnected]);
  
  // Set up periodic health check (every 30 seconds)
  useEffect(() => {
    const healthCheckInterval = setInterval(checkConnectionHealth, 30000);
    
    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [checkConnectionHealth]);
  
  // WebSocket connection management
  // Generate a unique connection ID for tracking
  const generateConnectionId = () => {
    return `ws_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  };
  
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
    
    try {
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
      
      // Add cache busting parameters to prevent cached connections
      const cacheBuster = `t=${Date.now()}&cid=${connectionId}`;
      const wsUrl = getWebSocketUrl() + '?' + cacheBuster;
      console.log(`Connecting to WebSocket: ${wsUrl}`);
      
      // Create the WebSocket connection
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
      
      socket.onopen = () => {
        console.log("WebSocket connected successfully");
        
        // Make sure socket still exists before setting properties
        if (socket) {
          // Store the connection details on the socket object itself
          (socket as any)._connectionTime = connectionStartTime;
          (socket as any)._connectionId = connectionId;
          (socket as any)._reconnectCount = reconnectAttempts;
        
        // Update connection status
        setConnectionDetails({
          id: connectionId,
          startTime: connectionStartTime,
          reconnects: reconnectAttempts,
          lastActivity: connectionStartTime
        });
        
        // Update connection status to connected (but not yet authenticated)
        setConnectionStatus('connected');
        
        // Reset reconnect attempts upon successful connection
        if (reconnectAttempts > 0) {
          console.log(`Connection restored after ${reconnectAttempts} attempts`);
        }
        reconnectAttempts = 0;
        setIsConnected(true);
        
        // Authenticate with both userId and token
        if (socket && user) {
          // Get token using the proper function instead of direct localStorage access
          const token = getStoredAuthToken();
          
          // Log token presence for debugging (but not the actual token)
          console.log(`Authenticating WebSocket with userId ${user.id}, token present: ${!!token}, connectionId: ${connectionId}`);
          
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
                retryAttempt: true // Mark as retry for server logging
              }));
              console.log("Sent follow-up authentication request to WebSocket server");
            }
          }, 5000); // Check after 5 seconds
        }
      };
      
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
        
        // Clean up ping interval if it exists
        if ((window as any).wsPingInterval) {
          clearInterval((window as any).wsPingInterval);
          (window as any).wsPingInterval = null;
        }
        
        // Clear socket reference
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
            break;
            
          // Default for all other close codes
          default:
            console.warn(`WebSocket closed with code ${event.code} - will try to reconnect`);
            reconnectAttempts++;
        }
        
        // Calculate backoff delay with exponential backoff and jitter
        // Add random jitter to prevent all clients reconnecting simultaneously
        const jitter = Math.random() * 1000;
        
        // Select reconnection strategy based on close code
        let baseDelay = RECONNECT_INTERVAL; // Default reconnect interval
        
        if (event.code === 1000) {
          // For clean closure, use a shorter fixed delay (server might be restarting cleanly)
          baseDelay = 1500;
        } else if (event.code === 1006) {
          // For abnormal closure, use a longer delay with progressive backoff
          // Server might be down for maintenance or crashed
          baseDelay = 2000 + (reconnectAttempts * 500);
        } else if (event.code === 1012 || event.code === 1013) {
          // Service restart or try again later - use an even longer delay
          baseDelay = 5000 + (reconnectAttempts * 1000);
        }
        
        // Apply exponential backoff for repeated attempts
        const exponentialFactor = Math.min(Math.pow(1.5, reconnectAttempts - 1), 10);
        const adaptiveDelay = baseDelay * exponentialFactor;
        
        // Apply reasonable upper bound
        const backoffDelay = Math.min(adaptiveDelay + jitter, 30000);
        
        // Log reconnection strategy
        console.log(`WebSocket reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${Math.round(backoffDelay)}ms (Code: ${event.code})`);
        
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
          // Notify the user of connection issues
          toast({
            title: "Connection Issues",
            description: "Unable to connect to messaging service. Please try refreshing the page.",
            variant: "destructive",
          });
        }
      };
      
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
  
  // Properly clean up all WebSocket related resources
  const disconnect = () => {
    // Clean up WebSocket
    if (socket) {
      try {
        // First try to send a proper logout message if connection is still open
        if (socket.readyState === WebSocket.OPEN && user) {
          socket.send(JSON.stringify({
            type: "logout",
            userId: user.id,
            timestamp: new Date().toISOString()
          }));
        }
      } catch (e) {
        console.error("Error sending logout message:", e);
      }
      
      // Then close the socket
      try {
        socket.close(1000, "Client initiated disconnection");
      } catch (e) {
        console.error("Error closing WebSocket:", e);
      }
      
      // Clear socket reference
      socket = null;
    }
    
    // Clear any reconnection timers
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Clear ping interval
    if ((window as any).wsPingInterval) {
      clearInterval((window as any).wsPingInterval);
      (window as any).wsPingInterval = null;
    }
    
    // Reset connection state
    setIsConnected(false);
    reconnectAttempts = 0;
  };
  
  // Last time we got a pong response (epoch milliseconds)
  const lastPongRef = useRef<number>(Date.now());
  
  // Check connection status periodically
  useEffect(() => {
    const connectionCheckInterval = setInterval(() => {
      // If we're connected but haven't received a pong in over 1 minute, 
      // connection might be stale
      if (isConnected && socket && Date.now() - lastPongRef.current > 60000) {
        console.warn("WebSocket connection might be stale - no pong received recently");
        // Try to send a ping to verify connection
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
              type: "ping",
              timestamp: new Date().toISOString(),
              connectionId: "connection_check"
            }));
            
            // Check again in 5 seconds
            setTimeout(() => {
              if (Date.now() - lastPongRef.current > 65000) {
                console.error("Connection confirmed stale - forcing reconnection");
                // Force reconnection if still no pong
                disconnect();
                reconnectAttempts = 0; // Reset attempts for clean reconnect
                setTimeout(connect, 1000);
              }
            }, 5000);
          }
        } catch (e) {
          console.error("Error checking connection:", e);
          // Force reconnection
          disconnect();
          reconnectAttempts = 0;
          setTimeout(connect, 1000);
        }
      }
    }, 30000);
    
    return () => clearInterval(connectionCheckInterval);
  }, [isConnected]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "authenticated":
        console.log("Authenticated with messaging service", data);
        
        // Update connection status to fully authenticated
        setConnectionStatus('authenticated');
        
        // Log connection details for debugging
        if (data.connectionId) {
          console.log(`WebSocket connection established with ID: ${data.connectionId}`);
        }
        
        // Update connection details with server info
        setConnectionDetails(prev => ({
          ...prev,
          serverConnectionId: data.connectionId,
          serverTime: data.serverTime,
          authenticated: true,
          tokenAuth: data.tokenAuth,
          activeConnections: data.activeConnections,
          lastActivity: Date.now()
        }));
        
        // Show toast for users with connection issues
        if (reconnectAttempts > 0) {
          toast({
            title: "Connection Restored",
            description: "Messaging service connection has been re-established",
          });
          reconnectAttempts = 0;
        }
        
        // Store connection details for persistence
        const connectionInfo = {
          connectionId: data.connectionId,
          serverTime: data.serverTime,
          authenticated: true,
          tokenAuth: data.tokenAuth
        };
        localStorage.setItem('ws_connection_details', JSON.stringify(connectionInfo));
        
        // Set up regular ping to keep connection alive
        // Start ping immediately and then every 30 seconds
        const sendPing = () => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
              type: "ping",
              timestamp: new Date().toISOString(),
              connectionId: data.connectionId
            }));
          }
        };
        
        // Send initial ping
        sendPing();
        
        // Set up regular pings
        const pingInterval = setInterval(sendPing, 30000);
        // Store the interval ID to clear it if needed
        (window as any).wsPingInterval = pingInterval;
        
        // Update last pong time as authentication is a form of response
        lastPongRef.current = Date.now();
        
        break;
        
      case "pong":
        // Update the last pong timestamp
        console.log("Received pong from server");
        const currentTime = Date.now();
        lastPongRef.current = currentTime;
        
        // Update connection details with last activity
        setConnectionDetails(prev => ({
          ...prev,
          lastActivity: currentTime,
          pingLatency: data.receivedAt ? currentTime - new Date(data.receivedAt).getTime() : undefined,
          activeConnections: data.connectionCount || prev.activeConnections
        }));
        
        // Log detailed connection stats for debugging
        if (data.connectionCount) {
          console.debug(`Connection stats - Server uptime: ${data.serverUptime}s, Active connections: ${data.connectionCount}`);
        }
        break;
        
      case "logout_confirmed":
        console.log("Server confirmed logout:", data.message);
        // Complete the clean disconnection process
        if (socket) {
          try {
            socket.close(1000, "Logout complete");
          } catch (e) {
            console.error("Error closing WebSocket after logout:", e);
          }
          socket = null;
        }
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
  
  // Define connection stats method for diagnostics
  const getConnectionStats = () => {
    // Calculate uptime if we have a start time
    const uptime = connectionDetails.startTime 
      ? Date.now() - connectionDetails.startTime 
      : null;
      
    // Format last activity
    const lastActivity = connectionDetails.lastActivity 
      ? new Date(connectionDetails.lastActivity).toISOString() 
      : null;
      
    return {
      uptime,
      reconnects: connectionDetails.reconnects || 0,
      lastActivity,
      errorCount: connectionDetails.errorCount || 0,
      latency: connectionDetails.pingLatency || null
    };
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
    
    // WebSocket connection
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