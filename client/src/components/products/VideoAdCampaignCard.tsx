import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { useInstantImageLoading, preloadCriticalImages } from "@/hooks/use-instant-image-loading";
import campaignVideo from "@assets/Cafe.mp4";
import newCafeVideo from "@assets/Cafe_1749111451530.mp4";
import carSellingVideo from "@assets/car selling online  .mp4";
import motivationalVideo from "@assets/Summer Motivational Instagram Reels Video.mp4";
import phoneFingerVideo from "@assets/Phone finger _1749108033480.mp4";
import newPhoneFingerVideo from "@assets/Phone finger _1749112701077.mp4";

interface VideoAdCampaignCardProps {
  videoSource?: string;
  title?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  entity?: string;
  marketType?: 'b2c' | 'b2b' | 'c2c';
}

export function VideoAdCampaignCard({ 
  videoSource = newPhoneFingerVideo,
  title = "Dedw3n | Community",
  autoPlay = true,
  showControls = true,
  entity = "default",
  marketType = "b2c"
}: VideoAdCampaignCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Preload critical advertisement images for instant display
  useEffect(() => {
    const criticalImages = [
      { src: videoSource, priority: 'instant' as const },
      { src: newPhoneFingerVideo, priority: 'high' as const },
      { src: carSellingVideo, priority: 'high' as const }
    ];
    preloadCriticalImages(criticalImages);
  }, [videoSource]);

  if (!isVisible) {
    return null;
  }

  // Get entity-specific video and title based on market type and entity
  const getEntityContent = () => {
    if (marketType === 'b2b') {
      return {
        video: carSellingVideo,
        title: 'Dedw3n | Community'
      };
    }
    
    if (marketType === 'c2c') {
      return {
        video: motivationalVideo,
        title: 'Dedw3n | Community'
      };
    }
    
    // Default B2C uses the new finger video
    return {
      video: newPhoneFingerVideo,
      title: "Dedw3n | Community"
    };
  };

  const entityContent = getEntityContent();

  // Effect to handle autoplay initialization and browser policies
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('Video component mounted, autoPlay:', autoPlay, 'Video src:', entityContent.video);

    const handleCanPlay = async () => {
      console.log('Video canplay event fired, attempting autoplay...');
      if (autoPlay) {
        try {
          // Ensure video is muted for autoplay compliance
          video.muted = true;
          setIsMuted(true);
          
          // Small delay to ensure video is ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Attempt to play the video
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('Video autoplay successful');
            setIsPlaying(true);
          }
        } catch (error) {
          console.log('Autoplay prevented by browser policy:', error);
          setIsPlaying(false);
        }
      }
    };

    const handleLoadedData = () => {
      console.log('Video loadeddata event fired');
      if (autoPlay && video.paused) {
        handleCanPlay();
      }
    };

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded');
    };

    const handlePlay = () => {
      console.log('Video started playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('Video paused');
      setIsPlaying(false);
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      const target = e.target as HTMLVideoElement;
      if (target && target.error) {
        console.error('Video error details:', target.error.code, target.error.message);
      }
      setIsPlaying(false);
    };

    const handleStalled = () => {
      console.log('Video stalled');
    };

    const handleWaiting = () => {
      console.log('Video waiting for data');
    };

    // Add event listeners
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('waiting', handleWaiting);

    // Force load if needed
    if (video.readyState >= 3) {
      console.log('Video already ready, attempting autoplay');
      handleCanPlay();
    } else {
      console.log('Loading video...');
      video.load();
    }

    // Intersection Observer for better autoplay handling
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && autoPlay && video.paused) {
            console.log('Video entered viewport, attempting autoplay');
            handleCanPlay();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('waiting', handleWaiting);
      observer.disconnect();
    };
  }, [autoPlay, entityContent.video]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          await videoRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error toggling video playback:', error);
        setIsPlaying(false);
      }
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
          muted={true}
          playsInline
          webkit-playsinline="true"
          preload="metadata"
          crossOrigin="anonymous"
          controls={false}
          disablePictureInPicture
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onLoadStart={() => console.log('Video loading started')}
          onLoadedMetadata={() => console.log('Video metadata loaded')}
          onCanPlay={() => console.log('Video can play')}
          onError={(e) => console.error('Video element error:', e)}
        >
          <source src={entityContent.video} type="video/mp4" />
          <source src={entityContent.video} type="video/webm" />
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