import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users, 
  Monitor,
  Copy,
  Check,
  MessageSquare,
  Send,
  Maximize,
  Minimize,
  Hand,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  userId: number;
  username: string;
  message: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  userId: number;
  username: string;
  avatar?: string;
}

export default function MeetingPage() {
  const [, params] = useRoute("/meeting/:roomId");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const wsRef = useRef<WebSocket | null>(null);
  
  const roomId = params?.roomId;
  const meetingLink = `${window.location.origin}/meeting/${roomId}`;

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    if (!user || !roomId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join this meeting",
        variant: "destructive",
      });
      return;
    }

    initializeMedia();
    connectWebSocket();

    const startTime = Date.now();
    const timer = setInterval(() => {
      setMeetingDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      cleanup();
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [user, roomId]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Media Access Error",
        description: "Could not access camera or microphone",
        variant: "destructive",
      });
    }
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/meeting`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({
        type: 'join',
        roomId,
        userId: user?.id,
        username: user?.username,
        avatar: user?.avatar,
      }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      await handleSignalingMessage(data);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
  };

  const handleSignalingMessage = async (data: any) => {
    const { type, from, ...payload } = data;

    switch (type) {
      case 'user-joined':
        handleUserJoined(payload);
        break;
      case 'user-left':
        handleUserLeft(payload);
        break;
      case 'participants':
        const existingParticipants = payload.participants || [];
        setParticipants(existingParticipants);
        break;
      case 'offer':
        await handleOffer(from, payload.offer);
        break;
      case 'answer':
        await handleAnswer(from, payload.answer);
        break;
      case 'ice-candidate':
        await handleIceCandidate(from, payload.candidate);
        break;
      case 'chat':
        handleChatMessage(payload);
        break;
      case 'hand-raise':
        handleHandRaise(payload);
        break;
      default:
        break;
    }
  };

  const handleUserJoined = async (payload: any) => {
    const { userId, username, avatar } = payload;
    
    setParticipants(prev => {
      if (prev.some(p => p.id === userId)) {
        return prev;
      }
      return [...prev, {
        id: userId,
        userId: parseInt(userId.split('-')[0]) || 0,
        username,
        avatar
      }];
    });
    
    toast({
      title: "User Joined",
      description: `${username} joined the meeting`,
    });

    if (!localStreamRef.current) return;

    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnectionsRef.current[userId] = peerConnection;

    localStreamRef.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById(`remote-video-${userId}`) as HTMLVideoElement;
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          to: userId,
          candidate: event.candidate,
        }));
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'offer',
        to: userId,
        offer,
      }));
    }
  };

  const handleUserLeft = (payload: any) => {
    const { userId, username } = payload;
    
    setParticipants(prev => prev.filter(p => p.id !== userId));
    
    toast({
      title: "User Left",
      description: `${username} left the meeting`,
    });

    if (peerConnectionsRef.current[userId]) {
      peerConnectionsRef.current[userId].close();
      delete peerConnectionsRef.current[userId];
    }
  };

  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    if (!localStreamRef.current) return;

    const peerConnection = new RTCPeerConnection(iceServers);
    peerConnectionsRef.current[from] = peerConnection;

    localStreamRef.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById(`remote-video-${from}`) as HTMLVideoElement;
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          to: from,
          candidate: event.candidate,
        }));
      }
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'answer',
        to: from,
        answer,
      }));
    }
  };

  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    const peerConnection = peerConnectionsRef.current[from];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    const peerConnection = peerConnectionsRef.current[from];
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const handleChatMessage = (payload: any) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      userId: payload.userId,
      username: payload.username,
      message: payload.message,
      timestamp: new Date(payload.timestamp),
    }]);
  };

  const handleHandRaise = (payload: any) => {
    const { username, raised } = payload;
    
    toast({
      title: raised ? "Hand Raised" : "Hand Lowered",
      description: `${username} ${raised ? 'raised their hand' : 'lowered their hand'}`,
    });
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    } else {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
      
      setIsScreenSharing(false);
    }
  };

  const leaveMeeting = () => {
    cleanup();
    window.close();
  };

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setIsCopied(true);
      toast({
        title: "Link Copied",
        description: "Meeting link copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !wsRef.current) return;

    const message = {
      type: 'chat',
      roomId,
      userId: user?.id,
      username: user?.username,
      message: chatInput,
      timestamp: new Date().toISOString(),
    };

    wsRef.current.send(JSON.stringify(message));
    setChatInput("");
  };

  const toggleHandRaise = () => {
    setIsHandRaised(!isHandRaised);
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'hand-raise',
        roomId,
        userId: user?.id,
        username: user?.username,
        raised: !isHandRaised,
      }));
    }

    toast({
      title: isHandRaised ? "Hand Lowered" : "Hand Raised",
      description: isHandRaised ? "You lowered your hand" : "You raised your hand",
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to join this meeting.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="h-screen flex flex-col">
        <div className="bg-black p-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Meeting Room</h1>
            <Badge variant="secondary" className="flex items-center gap-1 bg-gray-800">
              <Users className="w-3 h-3" />
              {participants.length + 1}
            </Badge>
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatDuration(meetingDuration)}</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyMeetingLink}
            className="text-white hover:bg-gray-800"
            data-testid="button-copy-link"
          >
            {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {isCopied ? "Copied!" : "Copy Link"}
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 relative ${showChat ? 'pr-80' : ''}`}>
            <div className="absolute inset-0 grid grid-cols-2 gap-4 p-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  data-testid="video-local"
                />
                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full">
                  <span className="text-sm">{user.username} (You)</span>
                </div>
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                    <VideoOff className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              {participants.map((participant) => (
                <div key={participant.id} className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    id={`remote-video-${participant.id}`}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    data-testid={`video-remote-${participant.id}`}
                  />
                  <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full">
                    <span className="text-sm">{participant.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showChat && (
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-black border-l border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-semibold">Chat</h3>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">
                      {msg.username} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm bg-gray-900 rounded-lg p-2">
                      {msg.message}
                    </div>
                  </div>
                ))}
              </ScrollArea>

              <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="bg-gray-900 border-gray-700 text-white"
                    data-testid="input-chat"
                  />
                  <Button
                    onClick={sendChatMessage}
                    size="icon"
                    className="bg-black hover:bg-gray-900 text-white"
                    data-testid="button-send-chat"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black p-4 flex items-center justify-center gap-4 border-t border-gray-800">
          <Button
            size="lg"
            onClick={toggleAudio}
            className={`rounded-full w-14 h-14 ${
              isAudioEnabled 
                ? 'bg-black hover:bg-gray-900 text-white border border-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            data-testid="button-toggle-audio"
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            size="lg"
            onClick={toggleVideo}
            className={`rounded-full w-14 h-14 ${
              isVideoEnabled 
                ? 'bg-black hover:bg-gray-900 text-white border border-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            data-testid="button-toggle-video"
          >
            {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button
            size="lg"
            onClick={toggleScreenShare}
            className={`rounded-full w-14 h-14 ${
              isScreenSharing
                ? 'bg-white hover:bg-gray-200 text-black'
                : 'bg-black hover:bg-gray-900 text-white border border-white'
            }`}
            data-testid="button-toggle-screen"
          >
            <Monitor className="w-6 h-6" />
          </Button>

          <Button
            size="lg"
            onClick={toggleHandRaise}
            className={`rounded-full w-14 h-14 ${
              isHandRaised
                ? 'bg-white hover:bg-gray-200 text-black'
                : 'bg-black hover:bg-gray-900 text-white border border-white'
            }`}
            data-testid="button-raise-hand"
          >
            <Hand className="w-6 h-6" />
          </Button>

          <Button
            size="lg"
            onClick={() => setShowChat(!showChat)}
            className={`rounded-full w-14 h-14 ${
              showChat
                ? 'bg-white hover:bg-gray-200 text-black'
                : 'bg-black hover:bg-gray-900 text-white border border-white'
            }`}
            data-testid="button-toggle-chat"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>

          <Button
            size="lg"
            onClick={toggleFullscreen}
            className="rounded-full w-14 h-14 bg-black hover:bg-gray-900 text-white border border-white"
            data-testid="button-fullscreen"
          >
            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </Button>

          <Button
            size="lg"
            onClick={leaveMeeting}
            className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white"
            data-testid="button-leave-meeting"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
