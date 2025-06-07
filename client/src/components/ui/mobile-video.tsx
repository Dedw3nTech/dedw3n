import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface MobileVideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export function MobileVideo({ 
  src, 
  poster, 
  className = '', 
  autoPlay = false, 
  muted = true, 
  loop = true, 
  controls = false 
}: MobileVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle video loading and playback
  useEffect(() => {
    if (!isInView || !videoRef.current) return;

    const video = videoRef.current;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      if (autoPlay && !hasError) {
        video.play().catch(() => {
          // Auto-play failed, user interaction required
          setIsPlaying(false);
        });
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
    };
  }, [isInView, autoPlay, hasError]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {
        // Play failed
        setHasError(true);
      });
    }
  };

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} ref={containerRef}>
        <span className="text-gray-500 text-sm">Video unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {isInView && (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            poster={poster}
            muted={muted}
            loop={loop}
            controls={controls}
            playsInline
            preload="metadata" // Only load metadata initially
          >
            <source src={src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Play/Pause overlay for mobile */}
          {!controls && !isLoading && (
            <button
              onClick={togglePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 hover:opacity-100 transition-opacity duration-300"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 text-white" />
              ) : (
                <Play className="w-12 h-12 text-white" />
              )}
            </button>
          )}
        </>
      )}

      {/* Placeholder when not in view */}
      {!isInView && (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Play className="w-12 h-12 text-gray-400" />
        </div>
      )}
    </div>
  );
}