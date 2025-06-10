import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

export function SidebarAdCard() {
  const [isVisible, setIsVisible] = useState(true);

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
          src="/attached_assets/Copy of Copy of Pre Launch Campaign  SELL (1).png"
          alt="Special Campaign Offers"
          className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => {
            e.currentTarget.src = "/attached_assets/Copy of Pre Launch Campaign  SELL.png";
          }}
        />
      </a>
    </Card>
  );
}