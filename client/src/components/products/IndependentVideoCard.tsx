import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Volume2, VolumeX, Play, Pause, Info } from "lucide-react";
import phoneFingerVideo from "@assets/Phone finger _1749108033480.mp4";

interface IndependentVideoCardProps {
  title?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  showInfo?: boolean;
  onClose?: () => void;
}

export function IndependentVideoCard({ 
  title = "Mobile Interaction Experience",
  autoPlay = true,
  showControls = true,
  showInfo = true,
  onClose
}: IndependentVideoCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showVideoInfo, setShowVideoInfo] = useState(false);
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

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const getVideoInfo = () => {
    if (videoRef.current) {
      return {
        duration: videoRef.current.duration || 0,
        currentTime: videoRef.current.currentTime || 0,
        videoWidth: videoRef.current.videoWidth || 0,
        videoHeight: videoRef.current.videoHeight || 0,
        readyState: videoRef.current.readyState,
        networkState: videoRef.current.networkState,
        volume: videoRef.current.volume,
        playbackRate: videoRef.current.playbackRate
      };
    }
    return null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const videoInfo = getVideoInfo();

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
          <source src={phoneFingerVideo} type="video/mp4" />
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

            {showInfo && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                onClick={() => setShowVideoInfo(!showVideoInfo)}
              >
                <Info className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Video info panel */}
        {showVideoInfo && videoInfo && (
          <div className="absolute bottom-12 left-2 bg-black bg-opacity-80 text-white text-xs p-2 rounded max-w-48">
            <div className="space-y-1">
              <div>Duration: {formatTime(videoInfo.duration)}</div>
              <div>Current: {formatTime(videoInfo.currentTime)}</div>
              <div>Resolution: {videoInfo.videoWidth}x{videoInfo.videoHeight}</div>
              <div>Volume: {Math.round(videoInfo.volume * 100)}%</div>
              <div>Speed: {videoInfo.playbackRate}x</div>
              <div>Status: {isPlaying ? 'Playing' : 'Paused'}</div>
              <div>Audio: {isMuted ? 'Muted' : 'Unmuted'}</div>
            </div>
          </div>
        )}

        {/* Title header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 pointer-events-none">
          <p className="text-white text-sm font-medium">
            {title}
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