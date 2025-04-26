import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVideos, type Video } from "@/hooks/use-videos";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  Loader2, 
  Heart,
  Share2,
  Play,
  Upload,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Film,
  MessageSquare,
  Send
} from "lucide-react";
import { format } from "date-fns";

export default function ShortsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeShortIndex, setActiveShortIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    getVideosByType,
    likeVideoMutation,
    shareVideoMutation,
    viewVideoMutation,
    commentVideoMutation
  } = useVideos();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (user === null) {
      toast({
        title: "Authentication required",
        description: "Please log in to view shorts",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [user, toast, setLocation]);

  // Get shorts videos
  const { 
    data: shorts = [], 
    isLoading: isLoadingShorts 
  } = useQuery({
    queryKey: ['/api/videos/type', 'short'],
    enabled: !!user,
  });

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

  // Function to toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Function to toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Function to submit a comment
  const handleSubmitComment = () => {
    if (!comment.trim() || !shorts[activeShortIndex]) return;
    
    commentVideoMutation.mutate({
      videoId: shorts[activeShortIndex].id,
      content: comment
    }, {
      onSuccess: () => {
        setComment("");
        toast({
          title: "Comment added",
          description: "Your comment has been posted successfully"
        });
      }
    });
  };

  // Function to navigate to next and previous shorts
  const goToNextShort = () => {
    if (activeShortIndex < shorts.length - 1) {
      setActiveShortIndex(activeShortIndex + 1);
      setIsPlaying(true);
      setShowComments(false);
      
      // Register view for the new short
      if (shorts[activeShortIndex + 1]) {
        viewVideoMutation.mutate({
          videoId: shorts[activeShortIndex + 1].id,
          watchTimeSeconds: 1
        });
      }
    }
  };
  
  const goToPreviousShort = () => {
    if (activeShortIndex > 0) {
      setActiveShortIndex(activeShortIndex - 1);
      setIsPlaying(true);
      setShowComments(false);
      
      // Register view for the new short
      if (shorts[activeShortIndex - 1]) {
        viewVideoMutation.mutate({
          videoId: shorts[activeShortIndex - 1].id,
          watchTimeSeconds: 1
        });
      }
    }
  };

  // Register view when loading a short
  useEffect(() => {
    if (shorts.length > 0 && activeShortIndex < shorts.length) {
      viewVideoMutation.mutate({
        videoId: shorts[activeShortIndex].id,
        watchTimeSeconds: 1 // Initial view count
      });
      
      // Auto-play the first short
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.play().catch(e => {
          console.log("Auto-play prevented by browser, click to play");
        });
      }
    }
  }, [shorts, activeShortIndex]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        goToPreviousShort();
      } else if (e.key === 'ArrowDown') {
        goToNextShort();
      } else if (e.key === ' ') {
        // Space bar to toggle play/pause
        togglePlayPause();
        e.preventDefault(); // Prevent page scroll
      } else if (e.key === 'm') {
        // M key to toggle mute
        toggleMute();
      } else if (e.key === 'c') {
        // C key to toggle comments
        setShowComments(!showComments);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeShortIndex, shorts, isPlaying, isMuted, showComments]);

  if (user === null) {
    return (
      <div className="container max-w-screen-xl py-6">
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title="Shorts"
        description="Short vertical videos"
        icon={<Film className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl pb-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Video Shorts</h2>
          <Button 
            onClick={() => setLocation("/videos/upload")}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Create Short
          </Button>
        </div>

        {isLoadingShorts ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : shorts.length === 0 ? (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No shorts yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to create a short video!
            </p>
            <Button 
              onClick={() => setLocation("/videos/upload")}
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Create Short
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div ref={containerRef} className="relative w-full max-w-md mx-auto h-[80vh] bg-black rounded-lg overflow-hidden">
              {/* Active short video */}
              {shorts[activeShortIndex] && (
                <div className="relative h-full w-full">
                  {/* Video content */}
                  <video
                    ref={videoRef}
                    src={shorts[activeShortIndex].videoUrl || ""}
                    autoPlay={isPlaying}
                    muted={isMuted}
                    playsInline
                    loop
                    className="h-full w-full object-cover"
                    onClick={togglePlayPause}
                  />
                  
                  {/* Play/pause overlay */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-transparent z-10"
                    onClick={togglePlayPause}
                  >
                    {!isPlaying && (
                      <div className="bg-black/50 rounded-full p-4">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Short info overlay - top */}
                  <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 border-2 border-white mr-3">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(shorts[activeShortIndex].userId.toString())}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">User {shorts[activeShortIndex].userId}</p>
                        <p className="text-white/70 text-xs">
                          {format(new Date(shorts[activeShortIndex].createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="ml-auto"
                      >
                        Follow
                      </Button>
                    </div>
                  </div>
                  
                  {/* Short caption/description - bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-lg mb-2">
                      {shorts[activeShortIndex].description || shorts[activeShortIndex].title}
                    </p>
                    {shorts[activeShortIndex].tags && shorts[activeShortIndex].tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {shorts[activeShortIndex].tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-white border-white/30">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Right side interaction buttons */}
                  <div className="absolute right-4 bottom-20 flex flex-col gap-6 items-center">
                    <div className="flex flex-col items-center">
                      <button 
                        onClick={() => handleLikeVideo(shorts[activeShortIndex].id, false)}
                        className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition mb-1"
                      >
                        <Heart className="h-6 w-6" />
                      </button>
                      <span className="text-white text-xs">{shorts[activeShortIndex].likes || 0}</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <button 
                        onClick={() => setShowComments(!showComments)}
                        className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition mb-1"
                      >
                        <MessageSquare className="h-6 w-6" />
                      </button>
                      <span className="text-white text-xs">{shorts[activeShortIndex].comments || 0}</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <button 
                        onClick={() => handleShareVideo(shorts[activeShortIndex].id)}
                        className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition mb-1"
                      >
                        <Share2 className="h-6 w-6" />
                      </button>
                      <span className="text-white text-xs">{shorts[activeShortIndex].shares || 0}</span>
                    </div>
                    
                    <button 
                      onClick={toggleMute}
                      className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition"
                    >
                      {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </button>
                  </div>
                  
                  {/* Navigation buttons */}
                  <button 
                    onClick={goToPreviousShort}
                    className={`absolute top-1/3 left-4 transform -translate-y-1/2 bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition ${activeShortIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-70'}`}
                    disabled={activeShortIndex === 0}
                  >
                    <ChevronUp className="h-6 w-6" />
                  </button>
                  
                  <button 
                    onClick={goToNextShort}
                    className={`absolute bottom-1/3 left-4 transform translate-y-1/2 bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition ${activeShortIndex === shorts.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-70'}`}
                    disabled={activeShortIndex === shorts.length - 1}
                  >
                    <ChevronDown className="h-6 w-6" />
                  </button>
                </div>
              )}
              
              {/* Comments slide-up panel */}
              <div 
                className={`absolute bottom-0 left-0 right-0 bg-background rounded-t-xl transition-transform duration-300 z-30 max-h-[70%] overflow-hidden flex flex-col ${
                  showComments ? 'translate-y-0' : 'translate-y-full'
                }`}
              >
                <div className="p-4 border-b">
                  <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
                  <h3 className="font-medium text-lg">Comments ({shorts[activeShortIndex]?.comments || 0})</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Comments would be loaded and displayed here */}
                  <p className="text-center text-muted-foreground py-10">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
                
                <div className="p-4 border-t flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user.name || "User")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 bg-muted rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSubmitComment();
                      }}
                    />
                    <Button 
                      size="icon" 
                      onClick={handleSubmitComment}
                      disabled={!comment.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="flex w-full max-w-md mx-auto gap-1 mt-4">
              {shorts.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1 flex-1 rounded-full ${index === activeShortIndex ? 'bg-primary' : 'bg-muted'}`}
                  onClick={() => {
                    setActiveShortIndex(index);
                    setIsPlaying(true);
                    setShowComments(false);
                  }}
                ></div>
              ))}
            </div>
            
            {/* Short counter */}
            <p className="text-center text-sm text-muted-foreground mt-2">
              {activeShortIndex + 1} / {shorts.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}