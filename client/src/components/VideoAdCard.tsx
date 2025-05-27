import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, Share2, Eye, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";

interface VideoAd {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  views: number;
  likes: number;
  creator: {
    name: string;
    avatar: string;
  };
  sponsored: boolean;
}

// Mock video ads data - in a real app, this would come from an API
const videoAds: VideoAd[] = [
  {
    id: "1",
    title: "Amazing Product Demo",
    description: "See how this product can change your life",
    thumbnail: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop",
    videoUrl: "https://example.com/video1.mp4",
    duration: "0:30",
    views: 15420,
    likes: 1200,
    creator: {
      name: "TechReviewer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
    },
    sponsored: true
  },
  {
    id: "2",
    title: "Quick Tips & Tricks",
    description: "Learn something new in 30 seconds",
    thumbnail: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop",
    videoUrl: "https://example.com/video2.mp4",
    duration: "0:45",
    views: 8930,
    likes: 654,
    creator: {
      name: "LifeHacker",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
    },
    sponsored: false
  }
];

export function VideoAdCard() {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5 text-red-600" />
          Video Showcase
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {videoAds.map((video, index) => (
          <div key={video.id} className="relative">
            {/* Video Thumbnail/Player */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900 group cursor-pointer">
              <img 
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white/90 text-black hover:bg-white"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  <Play className="h-6 w-6 ml-1" />
                </Button>
              </div>
              
              {/* Duration Badge */}
              <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                {video.duration}
              </Badge>
              
              {/* Sponsored Badge */}
              {video.sponsored && (
                <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                  Sponsored
                </Badge>
              )}
              
              {/* Volume Control */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Video Info */}
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-3">
                <img 
                  src={video.creator.avatar}
                  alt={video.creator.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {video.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {video.creator.name}
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 line-clamp-2">
                {video.description}
              </p>
              
              {/* Video Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{formatViews(video.views)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{formatViews(video.likes)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>
            
            {/* Divider between videos */}
            {index < videoAds.length - 1 && (
              <div className="border-b border-gray-100 mt-4"></div>
            )}
          </div>
        ))}
        
        {/* View More Videos Button */}
        <div className="pt-2">
          <Button 
            variant="outline" 
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            View More Videos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}