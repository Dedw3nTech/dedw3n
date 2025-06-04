import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react";
import campaignVideo from "@assets/Cafe.mp4";

interface VideoAdCampaignCardProps {
  videoSource?: string;
  title?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  entity?: string;
  marketType?: 'b2c' | 'b2b' | 'c2c';
}

export function VideoAdCampaignCard({ 
  videoSource = campaignVideo,
  title = "Dedw3n|Marketplace",
  autoPlay = true,
  showControls = true,
  entity = "default",
  marketType = "b2c"
}: VideoAdCampaignCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isVisible) {
    return null;
  }

  // Get entity-specific video and title based on market type and entity
  const getEntityContent = () => {
    if (marketType === 'b2b') {
      switch (entity) {
        case 'manufacturing':
          return {
            video: campaignVideo,
            title: 'Manufacturing Solutions | Dedw3n B2B'
          };
        case 'retail':
          return {
            video: campaignVideo,
            title: 'Retail Distribution | Dedw3n B2B'
          };
        case 'technology':
          return {
            video: campaignVideo,
            title: 'Technology Services | Dedw3n B2B'
          };
        case 'healthcare':
          return {
            video: campaignVideo,
            title: 'Healthcare Solutions | Dedw3n B2B'
          };
        case 'finance':
          return {
            video: campaignVideo,
            title: 'Financial Services | Dedw3n B2B'
          };
        default:
          return {
            video: campaignVideo,
            title: 'Business Solutions | Dedw3n B2B'
          };
      }
    }
    
    return {
      video: videoSource,
      title: title
    };
  };

  const entityContent = getEntityContent();

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
    <Card className="w-full overflow-hidden">
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
          <source src={entityContent.video} type="video/mp4" />
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
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {/* Title header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 pointer-events-none">
          <p className="text-white text-sm font-medium">
            {entityContent.title}
          </p>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white z-10"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}