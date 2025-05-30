import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface VideoAdPopupProps {
  videoUrl: string;
  delayMs?: number; // Delay before showing the popup
}

export function VideoAdPopup({ videoUrl, delayMs = 0 }: VideoAdPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Always show the video for testing - remove session check temporarily
    if (!hasShown) {
      // Load instantly (no delay)
      setIsOpen(true);
      setHasShown(true);
    }
  }, [hasShown]);

  const handleClose = () => {
    setIsOpen(false);
  };

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/shorts/')) {
      const videoId = url.split('/shorts/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&mute=1&controls=0&modestbranding=1&rel=0&playlist=${videoId}`;
    }
    return url;
  };

  if (!videoUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}>
        <VisuallyHidden>
          <DialogTitle>Video Advertisement</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-[min(200px,25vw)] aspect-[9/16] max-w-[200px] min-w-[150px]">
          {/* YouTube embed iframe - YouTube Shorts dimensions */}
          <iframe
            src={getEmbedUrl(videoUrl)}
            className="w-full h-full rounded-lg shadow-2xl border-2 border-white/20"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
            style={{ 
              minWidth: '150px',
              maxWidth: '200px',
              aspectRatio: '9/16'
            }}
            onError={() => {
              console.error('Video failed to load');
              setIsOpen(false);
            }}
          />
          
          {/* Close button positioned over the video */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-[60] bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 transition-all duration-200 shadow-lg backdrop-blur-sm"
            aria-label="Close advertisement"
            style={{ minWidth: '24px', minHeight: '24px' }}
          >
            <X className="h-3 w-3" />
          </button>

          {/* Optional overlay content */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pointer-events-none rounded-b-lg">
            <p className="text-white text-xs font-medium">
              Welcome to Dedw3n
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}