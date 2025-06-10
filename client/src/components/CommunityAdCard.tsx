import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

const advertisementImages = [
  {
    src: "/attached_assets/Copy of Pre Launch Be Different, Be You (1)_1749578490011.png",
    alt: "Be Different, Be You - Dedw3n Campaign",
    fallback: "/attached_assets/Copy of Copy of Pre Launch Campaign  SELL (1).png"
  },
  {
    src: "/attached_assets/Copy of Dedw3n Business B2C Header (1)_1749417523213.png",
    alt: "Dedw3n Business B2C - Connect & Trade",
    fallback: "/attached_assets/Dedw3n Business B2C Header (1).png"
  },
  {
    src: "/attached_assets/Copy of Dedw3n Marketplace.png",
    alt: "Dedw3n Marketplace - Your Global Platform",
    fallback: "/attached_assets/Dedw3n Marketplace (1).png"
  },
  {
    src: "/attached_assets/Copy of Dedw3n comm Footer.png",
    alt: "Join the Dedw3n Community",
    fallback: "/attached_assets/Dedw3n comm Footer.png"
  }
];

export function CommunityAdCard() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Batch translate all ad card text elements
  const textsToTranslate = [
    "Be Different, Be You - Dedw3n Campaign",
    "Dedw3n Business B2C - Connect & Trade",
    "Dedw3n Marketplace - Your Global Platform",
    "Join the Dedw3n Community"
  ];
  
  const { translations } = useMasterBatchTranslation(textsToTranslate, 'normal');
  
  const translatedAlts = textsToTranslate.map((text) => {
    if (translations && typeof translations === 'object' && !Array.isArray(translations)) {
      const translationMap = translations as Record<string, string>;
      return translationMap[text] || text;
    }
    return text;
  });

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % advertisementImages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const currentImage = advertisementImages[currentImageIndex];
  const currentAlt = translatedAlts[currentImageIndex];

  return (
    <Card className="relative overflow-hidden border-2 border-blue-200 mb-6">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 h-6 w-6 p-0 bg-black/20 hover:bg-black/40 text-white"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-3 w-3" />
      </Button>
      
      {/* Image rotation indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 flex gap-1">
        {advertisementImages.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => setCurrentImageIndex(index)}
          />
        ))}
      </div>
      
      <a href="/special-offers" className="block">
        <img 
          src={currentImage.src}
          alt={currentAlt}
          className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = currentImage.fallback;
          }}
        />
      </a>
    </Card>
  );
}