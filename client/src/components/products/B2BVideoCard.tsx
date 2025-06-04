import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Volume2, VolumeX, Play, Pause, Building2, Users, Target } from "lucide-react";
import campaignVideo from "@assets/Cafe.mp4";

interface B2BVideoCardProps {
  videoSource?: string;
  title?: string;
  description?: string;
  targetAudience?: string;
  businessType?: string;
  minOrderValue?: number;
  currency?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  showBusinessInfo?: boolean;
}

export function B2BVideoCard({ 
  videoSource = campaignVideo,
  title = "B2B Solutions | Dedw3n Business",
  description = "Discover wholesale opportunities and bulk purchasing solutions for your business needs",
  targetAudience = "Retailers & Distributors",
  businessType = "Wholesale",
  minOrderValue = 1000,
  currency = "USD",
  autoPlay = false,
  showControls = true,
  showBusinessInfo = true
}: B2BVideoCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isVisible) {
    return null;
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="w-full overflow-hidden border-2 border-blue-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">B2B Marketplace</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => setIsVisible(false)}
            title="Close video"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-48 object-cover"
          autoPlay={autoPlay}
          loop
          muted={isMuted}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={videoSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Video controls overlay */}
        {showControls && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              onClick={togglePlay}
              title={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              onClick={toggleMute}
              title={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {/* Title header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 pointer-events-none">
          <p className="text-white text-sm font-medium">
            {title}
          </p>
        </div>
      </div>

      {showBusinessInfo && (
        <CardContent className="pt-3">
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {targetAudience}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {businessType}
            </Badge>
            <Badge variant="outline">
              Min Order: {currency} {minOrderValue.toLocaleString()}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              title="Contact business for wholesale pricing"
            >
              <Users className="h-4 w-4 mr-1" />
              Contact for Quote
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              title="Learn more about business solutions"
            >
              Learn More
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}