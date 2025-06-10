import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface VideoDisplayCardProps {
  videoSource: string;
  title: string;
  marketType: 'b2b' | 'b2c' | 'c2c';
  autoPlay?: boolean;
  showControls?: boolean;
  onClose: () => void;
}

export function VideoDisplayCard({
  videoSource,
  title,
  marketType,
  autoPlay = false,
  showControls = true,
  onClose
}: VideoDisplayCardProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && cardRef.current) {
      cardRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getMarketTypeColor = () => {
    switch (marketType) {
      case 'b2b':
        return 'bg-blue-600';
      case 'b2c':
        return 'bg-green-600';
      case 'c2c':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card ref={cardRef} className="relative overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <video
            ref={videoRef}
            src={videoSource}
            className="w-full h-32 object-cover"
            muted={isMuted}
            loop
            playsInline
            onLoadedData={() => {
              if (autoPlay && videoRef.current) {
                videoRef.current.play();
              }
            }}
          />
          
          {/* Video overlay controls */}
          {showControls && (
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Market type badge */}
          <div className={`absolute top-2 left-2 ${getMarketTypeColor()} text-white px-2 py-1 text-xs font-medium rounded`}>
            {marketType.toUpperCase()}
          </div>

          {/* Close button */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 h-6 w-6 p-0 bg-white/90 hover:bg-white"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Video title */}
        <div className="p-3">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {marketType === 'b2b' && 'Business Solutions & Networking'}
            {marketType === 'b2c' && 'Consumer Products & Services'}
            {marketType === 'c2c' && 'Peer-to-Peer Marketplace'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}