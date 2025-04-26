import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVideos, type Video } from "@/hooks/use-videos";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  Loader2, 
  Film, 
  Heart, 
  Share2,
  Play,
  Upload,
  Maximize,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export default function ShortsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeShortIndex, setActiveShortIndex] = useState(0);
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
        description: "Please log in to view shorts",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [user, toast, setLocation]);

  // Get shorts videos
  const { 
    data: shorts = [], 
    isLoading: isLoadingShortsVideos 
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

  // Function to navigate to next and previous shorts
  const goToNextShort = () => {
    if (activeShortIndex < shorts.length - 1) {
      setActiveShortIndex(activeShortIndex + 1);
      
      // Register view for the new short
      if (shorts[activeShortIndex + 1]) {
        viewVideoMutation.mutate({
          videoId: shorts[activeShortIndex + 1].id,
          watchTimeSeconds: 1 // Initial view count
        });
      }
    }
  };
  
  const goToPreviousShort = () => {
    if (activeShortIndex > 0) {
      setActiveShortIndex(activeShortIndex - 1);
      
      // Register view for the new short
      if (shorts[activeShortIndex - 1]) {
        viewVideoMutation.mutate({
          videoId: shorts[activeShortIndex - 1].id,
          watchTimeSeconds: 1 // Initial view count
        });
      }
    }
  };

  // Register view when first loading a short
  useEffect(() => {
    if (shorts.length > 0 && activeShortIndex < shorts.length) {
      viewVideoMutation.mutate({
        videoId: shorts[activeShortIndex].id,
        watchTimeSeconds: 1 // Initial view count
      });
    }
  }, [shorts, activeShortIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        goToPreviousShort();
      } else if (e.key === 'ArrowDown') {
        goToNextShort();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeShortIndex, shorts]);

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
        description="Short-form vertical videos"
        icon={<Film className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl py-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Shorts</h2>
          <Button 
            onClick={() => setLocation("/videos/upload")}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Short
          </Button>
        </div>

        {isLoadingShortsVideos ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : shorts.length === 0 ? (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No shorts yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to upload a short video!
            </p>
            <Button 
              onClick={() => setLocation("/videos/upload")}
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Short
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-md mx-auto h-[80vh] bg-black rounded-lg overflow-hidden">
              {/* Current short */}
              {shorts[activeShortIndex] && (
                <div className="relative h-full w-full">
                  {shorts[activeShortIndex].videoUrl ? (
                    <video
                      src={shorts[activeShortIndex].videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <Play className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Video info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white text-lg font-bold mb-1">
                      {shorts[activeShortIndex].title}
                    </h3>
                    
                    {shorts[activeShortIndex].description && (
                      <p className="text-white/80 text-sm mb-3">
                        {shorts[activeShortIndex].description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(shorts[activeShortIndex].userId.toString())}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium text-sm">
                        User {shorts[activeShortIndex].userId}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute right-4 bottom-32 flex flex-col gap-4">
                    <button 
                      onClick={() => handleLikeVideo(shorts[activeShortIndex].id, false)}
                      className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition"
                    >
                      <Heart className="h-6 w-6" />
                      <span className="text-xs block mt-1">{shorts[activeShortIndex].likes}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleShareVideo(shorts[activeShortIndex].id)}
                      className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition"
                    >
                      <Share2 className="h-6 w-6" />
                      <span className="text-xs block mt-1">{shorts[activeShortIndex].shares}</span>
                    </button>
                    
                    <button 
                      onClick={() => setLocation(`/videos/${shorts[activeShortIndex].id}`)}
                      className="bg-black/50 rounded-full p-3 text-white hover:bg-black/70 transition"
                    >
                      <Maximize className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {/* Navigation buttons */}
                  <button 
                    onClick={goToPreviousShort}
                    className={`absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition ${activeShortIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-70'}`}
                    disabled={activeShortIndex === 0}
                  >
                    <ChevronUp className="h-6 w-6" />
                  </button>
                  
                  <button 
                    onClick={goToNextShort}
                    className={`absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-black/50 rounded-full p-2 text-white hover:bg-black/70 transition ${activeShortIndex === shorts.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-70'}`}
                    disabled={activeShortIndex === shorts.length - 1}
                  >
                    <ChevronDown className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Progress indicator */}
            <div className="mt-4 flex items-center justify-center gap-1">
              {shorts.map((_, index) => (
                <div 
                  key={index} 
                  className={`h-1 w-6 rounded-full ${index === activeShortIndex ? 'bg-primary' : 'bg-muted'}`}
                  onClick={() => setActiveShortIndex(index)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-2">
              {activeShortIndex + 1} / {shorts.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}