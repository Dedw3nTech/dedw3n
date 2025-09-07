import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export function CommunityUniqueAdCard() {
  const [isVisible, setIsVisible] = useState(true);

  const textsToTranslate = [
    "Be Different, Be You - Premium Dedw3n Experience",
    "Close advertisement"
  ];
  
  const { translations } = useMasterBatchTranslation(textsToTranslate, 'normal');
  
  const getTranslation = (text: string) => {
    if (translations && typeof translations === 'object' && !Array.isArray(translations)) {
      const translationMap = translations as Record<string, string>;
      return translationMap[text] || text;
    }
    return text;
  };

  if (!isVisible) return null;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 h-6 w-6 p-0 bg-white/80 hover:bg-white/90"
        onClick={() => setIsVisible(false)}
        aria-label={getTranslation("Close advertisement")}
      >
        <X className="h-3 w-3" />
      </Button>
      
      <a href="/special-offers" className="block">
        <img 
          src="/attached_assets/Copy of Pre Launch Be Different, Be You (1)_1749579414273.png"
          alt={getTranslation("Be Different, Be You - Premium Dedw3n Experience")}
          className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = "/dedw3n-main-logo.png";
          }}
        />
      </a>
    </Card>
  );
}