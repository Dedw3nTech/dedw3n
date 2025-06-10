import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

export function SidebarAdCard() {
  const [isVisible, setIsVisible] = useState(true);
  
  // Batch translate all ad card text elements
  const textsToTranslate = [
    "Be Different, Be You - Dedw3n Campaign"
  ];
  
  const { translations } = useMasterBatchTranslation(textsToTranslate, 'normal');
  
  const altText = translations["Be Different, Be You - Dedw3n Campaign"] || "Be Different, Be You - Dedw3n Campaign";

  if (!isVisible) return null;

  return (
    <Card className="relative overflow-hidden border-2 border-blue-200">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 h-6 w-6 p-0 bg-black/20 hover:bg-black/40 text-white"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-3 w-3" />
      </Button>
      
      <a href="/special-offers" className="block">
        <img 
          src="/attached_assets/_Pre Launch Be Different Black phone black man_1749579297498.png"
          alt="Be Different - Premium Mobile Experience"
          className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = "/attached_assets/Copy of Pre Launch Be Different, Be You (1)_1749578490011.png";
          }}
        />
      </a>
    </Card>
  );
}