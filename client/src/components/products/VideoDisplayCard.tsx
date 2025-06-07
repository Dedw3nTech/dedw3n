import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react";
import campaignVideo from "@assets/Cafe.mp4";
import carSellingVideo from "@assets/car selling online  .mp4";
import motivationalVideo from "@assets/Phone finger _1749112701077.mp4";

interface VideoDisplayCardProps {
  videoSource?: string;
  title?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  entity?: string;
  marketType?: 'b2c' | 'b2b' | 'c2c';
  onClose?: () => void;
}

export function VideoDisplayCard({ 
  videoSource,
  title,
  autoPlay = true,
  showControls = true,
  entity = "default",
  marketType = "b2c",
  onClose
}: VideoDisplayCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isVisible) {
    return null;
  }

  // Get entity-specific video and title based on market type and entity
  const getEntityContent = () => {
    // If specific video source is provided, use it
    if (videoSource) {
      return {
        video: videoSource,
        title: title || 'Dedw3n | Marketplace'
      };
    }

    // Otherwise, determine based on market type
    if (marketType === 'b2b') {
      return {
        video: carSellingVideo,
        title: title || 'Dedw3n | Business Marketplace'
      };
    }
    
    if (marketType === 'c2c') {
      return {
        video: motivationalVideo,
        title: title || 'Dedw3n | Community Marketplace'
      };
    }
    
    // Default B2C
    return {
      video: campaignVideo,
      title: title || 'Dedw3n | Marketplace'
    };
  };

  const entityContent = getEntityContent();

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
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
          onClick={handleClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}