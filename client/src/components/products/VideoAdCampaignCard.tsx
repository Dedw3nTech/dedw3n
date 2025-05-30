import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import campaignVideo from "@assets/Cafe.mp4";

export function VideoAdCampaignCard() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="w-full overflow-hidden">
      <div className="relative">
        <video
          className="w-full h-48 object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={campaignVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}