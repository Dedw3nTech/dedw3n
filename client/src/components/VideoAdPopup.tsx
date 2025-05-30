import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface VideoAdPopupProps {
  videoUrl: string;
  delayMs?: number; // Delay before showing the popup
}

export function VideoAdPopup({ videoUrl, delayMs = 3000 }: VideoAdPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if user has already seen the ad in this session
    const adShown = sessionStorage.getItem('videoAdShown');
    
    if (!adShown && !hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('videoAdShown', 'true');
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [delayMs, hasShown]);

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
      <DialogContent className="max-w-[280px] p-0 bg-transparent border-none shadow-none fixed top-4 right-4 translate-x-0 translate-y-0"
        onInteractOutside={(e) => e.preventDefault()}>
      <div className="fixed inset-0 pointer-events-none" />
        <div className="relative rounded-lg overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            aria-label="Close advertisement"
          >
            <X className="h-4 w-4" />
          </button>

          {/* YouTube embed iframe - compact size for mobile/shorts format */}
          <div className="aspect-[9/16] w-[260px]">
            <iframe
              src={getEmbedUrl(videoUrl)}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
              onError={() => {
                console.error('Video failed to load');
                setIsOpen(false);
              }}
            />
          </div>

          {/* Optional overlay content */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pointer-events-none rounded-b-lg">
            <p className="text-white text-xs font-medium">
              Discover amazing deals on Dedw3n!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}