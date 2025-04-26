import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useVideos, type Video } from "@/hooks/use-videos";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { 
  Loader2, 
  TrendingUp, 
  Eye, 
  Heart, 
  Share2,
  Clock,
  Play,
  Upload
} from "lucide-react";
import { format } from "date-fns";

export default function TrendingVideosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { 
    trendingVideos,
    isLoadingTrending,
    likeVideoMutation,
    shareVideoMutation,
    viewVideoMutation
  } = useVideos();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (user === null) {
      toast({
        title: "Authentication required",
        description: "Please log in to view trending videos",
        variant: "destructive",
      });
      setLocation("/auth");
    }
  }, [user, toast, setLocation]);

  // Function to handle video view
  const handleViewVideo = (videoId: number) => {
    viewVideoMutation.mutate({ 
      videoId, 
      watchTimeSeconds: 1 // Just for tracking click, actual watch time will be tracked on video page
    });
    setLocation(`/videos/${videoId}`);
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
        title="Trending Videos"
        description="Discover the most popular videos on the platform"
        icon={<TrendingUp className="h-6 w-6" />}
      />

      <div className="container max-w-screen-xl py-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Top Videos</h2>
          <Button 
            onClick={() => setLocation("/videos/upload")}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Video
          </Button>
        </div>

        {isLoadingTrending ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex items-center gap-2 pt-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : trendingVideos.length === 0 ? (
          <div className="text-center py-12 bg-muted/40 rounded-lg">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No trending videos yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Be the first to upload a video and start a trend!
            </p>
            <Button 
              onClick={() => setLocation("/videos/upload")}
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingVideos.map((video: Video) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="relative group cursor-pointer" onClick={() => handleViewVideo(video.id)}>
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-48 w-full bg-muted flex items-center justify-center">
                      <Play className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {video.duration ? (
                      <span>{Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}</span>
                    ) : (
                      <span>00:00</span>
                    )}
                  </div>
                  
                  <Badge 
                    className="absolute top-2 left-2" 
                    variant={
                      video.videoType === 'short' ? 'default' : 
                      video.videoType === 'story' ? 'secondary' :
                      video.videoType === 'live' ? 'destructive' :
                      'outline'
                    }
                  >
                    {video.videoType.charAt(0).toUpperCase() + video.videoType.slice(1)}
                  </Badge>
                </div>
                
                <CardHeader className="p-4 pb-0">
                  <h3 className="font-semibold line-clamp-2" title={video.title}>
                    {video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-3 w-3" /> {video.views} views
                    <span className="mx-1">•</span>
                    <Clock className="h-3 w-3" /> {format(new Date(video.createdAt), 'MMM d, yyyy')}
                  </p>
                </CardHeader>
                
                <CardContent className="p-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(video.userId.toString())}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">User {video.userId}</span>
                  </div>
                  
                  {video.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      className="flex items-center gap-1 text-sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeVideo(video.id, false);
                      }}
                    >
                      <Heart className={`h-4 w-4`} />
                      {video.likes}
                    </button>
                    <button 
                      className="flex items-center gap-1 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareVideo(video.id);
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      {video.shares}
                    </button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}