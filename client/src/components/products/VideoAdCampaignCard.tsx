import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Volume2, VolumeX, Play, Pause, Building2, Users, Store } from "lucide-react";
import campaignVideo from "@assets/Cafe.mp4";

interface VideoAdCampaignCardProps {
  videoSource?: string;
  title?: string;
  description?: string;
  category?: string;
  targetAudience?: string;
  price?: string;
  badge?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  marketType?: 'b2b' | 'b2c' | 'c2c';
}

export function VideoAdCampaignCard({ 
  youtubeVideoId = "JeQDacfz6eA",
  title = "Dedw3n|Marketplace",
  description,
  category,
  targetAudience,
  price,
  badge,
  autoPlay = false,
  marketType = 'b2c'
}: VideoAdCampaignCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeVideoId}${autoPlay ? '?autoplay=1&mute=1' : ''}`;

  return (
    <Card className="w-full overflow-hidden">
      <div className="relative">
        <iframe
          className="w-full h-48"
          src={youtubeEmbedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />

        {/* Title header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 pointer-events-none">
          <p className="text-white text-sm font-medium">
            {title}
          </p>
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white z-10"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Content area with marketplace-specific properties */}
      {(description || category || targetAudience || price || badge) && (
        <CardContent className="pt-3">
          {description && (
            <p className="text-sm text-gray-600 mb-3">{description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            {marketType === 'b2b' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Business
              </Badge>
            )}
            {marketType === 'c2c' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Community
              </Badge>
            )}
            {marketType === 'b2c' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Store className="h-3 w-3" />
                Retail
              </Badge>
            )}
            
            {category && (
              <Badge variant="outline">{category}</Badge>
            )}
            
            {targetAudience && (
              <Badge variant="outline">{targetAudience}</Badge>
            )}
            
            {badge && (
              <Badge variant="destructive">{badge}</Badge>
            )}
          </div>

          {price && (
            <div className="text-lg font-bold text-green-600 mb-3">
              {price}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-black hover:bg-gray-800 text-white flex-1"
            >
              {marketType === 'b2b' ? 'Get Quote' : 
               marketType === 'c2c' ? 'Contact Seller' : 
               'Shop Now'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
            >
              Learn More
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}