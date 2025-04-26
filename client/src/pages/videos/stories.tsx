import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVideos, type Video } from "@/hooks/use-videos";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  Loader2, 
  Clock, 
  Heart,
  Share2,
  Play,
  Upload,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";

export default function StoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
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
        description: "Please log in to view stories",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [user, toast, setLocation]);

  // Get stories videos
  const { 
    data: stories = [], 
    isLoading: isLoadingStories 
  } = useQuery({
    queryKey: ['/api/videos/type', 'story'],
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

  // Function to navigate to next and previous stories
  const goToNextStory = () => {
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
      setProgress(0);
      setIsPlaying(true);
    }
  };
  
  const goToPreviousStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  // Auto-advance story when video ends
  const handleVideoEnded = () => {
    if (activeStoryIndex < stories.length - 1) {
      goToNextStory();
    } else {
      // Last story finished
      setIsPlaying(false);
    }
  };

  // Update progress bar
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      const progressValue = (currentTime / duration) * 100;
      setProgress(progressValue);
    }
  };

  // Register view when loading a story
  useEffect(() => {
    if (stories.length > 0 && activeStoryIndex < stories.length) {
      viewVideoMutation.mutate({
        videoId: stories[activeStoryIndex].id,
        watchTimeSeconds: 1 // Initial view count
      });
    }
  }, [stories, activeStoryIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousStory();
      } else if (e.key === 'ArrowRight') {
        goToNextStory();
      } else if (e.key === ' ') {
        // Space bar to toggle play/pause
        togglePlayPause();
        e.preventDefault(); // Prevent page scroll
      } else if (e.key === 'm') {
        // M key to toggle mute
        toggleMute();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeStoryIndex, stories, isPlaying, isMuted]);

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
        title="Stories"
        description="Short video stories from your network"
        icon={<Clock className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl py-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Video Stories</h2>
          <Button 
            onClick={() => setLocation("/videos/upload")}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Create Story
          </Button>
        </div>

        {isLoadingStories ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No stories yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to create a video story!
            </p>
            <Button 
              onClick={() => setLocation("/videos/upload")}
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Create Story
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Story progress indicators */}
            <div className="flex w-full max-w-md mx-auto gap-1 mb-2">
              {stories.map((_, index) => (
                <div key={index} className="flex-1">
                  <Progress 
                    value={index === activeStoryIndex ? progress : (index < activeStoryIndex ? 100 : 0)} 
                    className="h-1" 
                  />
                </div>
              ))}
            </div>
            
            {/* Main story view */}
            <div className="relative w-full max-w-md mx-auto h-[80vh] bg-black rounded-lg overflow-hidden">
              {stories[activeStoryIndex] && (
                <div className="relative h-full w-full">
                  {/* Story header */}
                  <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center">
                    <Avatar className="h-10 w-10 border-2 border-white mr-3">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(stories[activeStoryIndex].userId.toString())}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">User {stories[activeStoryIndex].userId}</p>
                      <p className="text-white/70 text-xs">
                        {format(new Date(stories[activeStoryIndex].createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <button 
                        onClick={() => handleLikeVideo(stories[activeStoryIndex].id, false)}
                        className="text-white hover:text-primary transition"
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleShareVideo(stories[activeStoryIndex].id)}
                        className="text-white hover:text-primary transition"
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Video content */}
                  {stories[activeStoryIndex].videoUrl ? (
                    <video
                      ref={videoRef}
                      src={stories[activeStoryIndex].videoUrl}
                      autoPlay={isPlaying}
                      muted={isMuted}
                      playsInline
                      className="h-full w-full object-cover"
                      onEnded={handleVideoEnded}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <Play className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Story caption/description */}
                  {stories[activeStoryIndex].description && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-lg">
                        {stories[activeStoryIndex].description}
                      </p>
                    </div>
                  )}
                  
                  {/* Playback controls */}
                  <div className="absolute bottom-20 right-4 flex flex-col gap-4">
                    <button 
                      onClick={togglePlayPause}
                      className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </button>
                    
                    <button 
                      onClick={toggleMute}
                      className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition"
                    >
                      {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </button>
                  </div>
                  
                  {/* Navigation buttons */}
                  <button 
                    onClick={goToPreviousStory}
                    className={`absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition ${activeStoryIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-70'}`}
                    disabled={activeStoryIndex === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  
                  <button 
                    onClick={goToNextStory}
                    className={`absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition ${activeStoryIndex === stories.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-70'}`}
                    disabled={activeStoryIndex === stories.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Click to navigate (invisible buttons covering the left and right sides) */}
                  <button 
                    onClick={goToPreviousStory}
                    className={`absolute top-0 left-0 w-1/3 h-full bg-transparent ${activeStoryIndex === 0 ? 'cursor-default' : 'cursor-w-resize'}`}
                    disabled={activeStoryIndex === 0}
                    aria-label="Previous story"
                  />
                  
                  <button 
                    onClick={goToNextStory}
                    className={`absolute top-0 right-0 w-1/3 h-full bg-transparent ${activeStoryIndex === stories.length - 1 ? 'cursor-default' : 'cursor-e-resize'}`}
                    disabled={activeStoryIndex === stories.length - 1}
                    aria-label="Next story"
                  />
                </div>
              )}
            </div>
            
            {/* Story counter */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              {activeStoryIndex + 1} / {stories.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}