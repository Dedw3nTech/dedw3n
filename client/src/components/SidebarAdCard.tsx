import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import campaignImage from "@assets/Copy of Copy of Pre Launch Campaign  SELL (1).png";

export function SidebarAdCard() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="w-full border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <CardContent className="p-0 relative">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
          aria-label="Close advertisement"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>

        {/* Advertisement Image */}
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={campaignImage}
            alt="Special Offer - 50% OFF"
            className="w-full h-40 object-cover"
          />
          
          {/* Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Promotional Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              LIMITED TIME
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 bg-gray-100 border border-blue-300">
          <h3 className="font-bold text-lg text-gray-900 mb-2">
            🎉 Special Launch Offer
          </h3>
          
          <p className="text-sm text-gray-700 mb-3">
            Get <span className="font-bold text-blue-600">50% OFF</span> on all premium products. 
            Don't miss this exclusive deal!
          </p>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Ends in 24 hours
            </div>
            
            <Button 
              size="sm" 
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Shop Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}