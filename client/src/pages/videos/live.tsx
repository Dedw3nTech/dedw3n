import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVideos, type Video } from "@/hooks/use-videos";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/lib/utils";
import { 
  Loader2, 
  Radio, 
  Heart, 
  Share2,
  Play,
  Upload,
  MessageSquare,
  Volume2,
  VolumeX,
  Users,
  Send
} from "lucide-react";
import { format } from "date-fns";

// Mock chat message interface
interface ChatMessage {
  id: number;
  userId: number;
  userName: string;
  message: string;
  timestamp: Date;
}

export default function LivePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeLiveStream, setActiveLiveStream] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    getVideosByType,
    likeVideoMutation,
    shareVideoMutation,
    viewVideoMutation
  } = useVideos();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (user === null) {
      toast({
        title: "Authentication required",
        description: "Please log in to view live streams",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [user, toast, setLocation]);

  // Get live videos
  const { 
    data: liveStreams = [], 
    isLoading: isLoadingLiveStreams 
  } = useQuery({
    queryKey: ['/api/videos/type', 'live'],
    enabled: !!user,
  });

  // Function to handle watching a live stream
  const handleWatchLiveStream = (videoId: number) => {
    setActiveLiveStream(videoId);
    
    // Register view
    viewVideoMutation.mutate({
      videoId,
      watchTimeSeconds: 1 // Initial view count
    });
    
    // Reset chat messages for the new stream
    setChatMessages([]);
    
    // Simulate some initial chat messages
    generateMockChatMessages();
  };

  // Function to handle video like
  const handleLikeVideo = (videoId: number, isLiked: boolean) => {
    likeVideoMutation.mutate({
      videoId,
      action: isLiked ? 'unlike' : 'like'
    });
  };

  // Function to handle video share
  const handleShareVideo = (videoId: number) => {
    shareVideoMutation.mutate({
      videoId,
      platform: 'internal' // For now, just track internal shares
    });
    
    // Copy video link to clipboard
    const videoUrl = `${window.location.origin}/videos/${videoId}`;
    navigator.clipboard.writeText(videoUrl);
    
    toast({
      title: "Link copied!",
      description: "Video link copied to clipboard",
    });
  };

  // Function to toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Function to send a chat message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatMessage.trim() || !user) return;
    
    const newMessage: ChatMessage = {
      id: Date.now(),
      userId: user.id,
      userName: user.name || user.username,
      message: chatMessage.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');
  };

  // Simulate chat messages coming in (for demo purposes)
  const generateMockChatMessages = () => {
    // This would be replaced with actual WebSocket messages in a real implementation
    const mockUsernames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan'];
    const mockMessages = [
      'Hello everyone!',
      'This stream is amazing!',
      'When is the next event?',
      'Thanks for streaming this!',
      'How long have you been doing this?',
      'I love this content!'
    ];
    
    // Generate a random message every 3-5 seconds
    const interval = setInterval(() => {
      const randomUserId = Math.floor(Math.random() * 100) + 10;
      const randomUsername = mockUsernames[Math.floor(Math.random() * mockUsernames.length)];
      const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
      
      const newMessage: ChatMessage = {
        id: Date.now(),
        userId: randomUserId,
        userName: randomUsername,
        message: randomMessage,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, newMessage]);
    }, Math.random() * 2000 + 3000);
    
    // Clean up the interval when component unmounts or stream changes
    return () => clearInterval(interval);
  };

  // Auto-scroll chat to bottom when new messages come in
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // When unmounting or changing streams, clear chat interval
  useEffect(() => {
    const cleanup = generateMockChatMessages();
    return cleanup;
  }, [activeLiveStream]);

  if (user === null) {
    return (
      <div className="container max-w-screen-xl py-6">
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Find the active stream details
  const activeStream = liveStreams.find(stream => stream.id === activeLiveStream);

  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title="Live Streams"
        description="Watch and interact with live broadcasts"
        icon={<Radio className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl py-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Live Now</h2>
          <Button 
            onClick={() => setLocation("/videos/upload")}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Go Live
          </Button>
        </div>

        {isLoadingLiveStreams ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : liveStreams.length === 0 ? (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No live streams right now</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to start a live stream!
            </p>
            <Button 
              onClick={() => setLocation("/videos/upload")}
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Go Live
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active stream and chat section */}
            {activeLiveStream ? (
              <>
                {/* Main stream viewing area */}
                <div className="lg:col-span-2">
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                    {activeStream?.videoUrl ? (
                      <video
                        ref={videoRef}
                        src={activeStream.videoUrl}
                        autoPlay
                        playsInline
                        muted={isMuted}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        <Play className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Live badge and viewer count */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge variant="destructive" className="px-2 py-1">
                        LIVE
                      </Badge>
                      <Badge variant="outline" className="bg-black/70 text-white px-2 py-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {activeStream?.views || 0}
                      </Badge>
                    </div>
                    
                    {/* Controls */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button 
                        onClick={toggleMute}
                        className="bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </button>
                      
                      <button 
                        onClick={() => handleLikeVideo(activeLiveStream, false)}
                        className="bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition"
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                      
                      <button 
                        onClick={() => handleShareVideo(activeLiveStream)}
                        className="bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Stream info */}
                  <div className="mt-4">
                    <h2 className="text-xl font-bold">{activeStream?.title}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(activeStream?.userId.toString() || "")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">User {activeStream?.userId}</p>
                        <p className="text-sm text-muted-foreground">
                          Started {activeStream?.createdAt && format(new Date(activeStream.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <div className="ml-auto flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {activeStream?.likes || 0}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          {activeStream?.shares || 0}
                        </Badge>
                      </div>
                    </div>
                    {activeStream?.description && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md">
                        <p>{activeStream.description}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Live chat */}
                <div className="lg:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Live Chat
                      </CardTitle>
                      <CardDescription>
                        Join the conversation
                      </CardDescription>
                    </CardHeader>
                    <Separator />
                    <ScrollArea className="h-[400px] px-4 py-2">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-muted-foreground text-center">
                            No messages yet. Be the first to chat!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chatMessages.map((msg) => (
                            <div key={msg.id} className="flex gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(msg.userName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-medium text-sm">
                                    {msg.userName}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(msg.timestamp, 'h:mm a')}
                                  </span>
                                </div>
                                <p className="text-sm">{msg.message}</p>
                              </div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                      )}
                    </ScrollArea>
                    <CardFooter className="pt-2">
                      <form onSubmit={handleSendChatMessage} className="w-full flex gap-2">
                        <Input
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1"
                        />
                        <Button type="submit" size="icon">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </CardFooter>
                  </Card>
                </div>
              </>
            ) : (
              /* Live stream grid when no stream is selected */
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveStreams.map((stream) => (
                    <Card key={stream.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors" onClick={() => handleWatchLiveStream(stream.id)}>
                      <div className="relative aspect-video">
                        {stream.thumbnailUrl ? (
                          <img 
                            src={stream.thumbnailUrl} 
                            alt={stream.title} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <Play className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge variant="destructive" className="absolute top-2 left-2">
                          LIVE
                        </Badge>
                        <Badge variant="outline" className="absolute top-2 right-2 bg-black/70 text-white flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {stream.views}
                        </Badge>
                      </div>
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-base line-clamp-1">{stream.title}</CardTitle>
                        <CardDescription className="line-clamp-1">User {stream.userId}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-3 pt-2 flex justify-between">
                        <p className="text-xs text-muted-foreground">
                          Started {format(new Date(stream.createdAt), 'MMM d, h:mm a')}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {stream.likes}
                          </span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}