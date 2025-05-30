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

  if (!videoUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 bg-transparent border-none shadow-none">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
            aria-label="Close advertisement"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Video */}
          <video
            className="w-full h-auto max-h-[400px] object-cover"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            onError={(e) => {
              console.error('Video failed to load:', e);
              setIsOpen(false);
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            <source src={videoUrl} type="video/webm" />
            Your browser does not support the video tag.
          </video>

          {/* Optional overlay content */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm font-medium">
              Discover amazing deals on Dedw3n!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}