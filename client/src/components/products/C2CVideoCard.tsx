import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Volume2, VolumeX, Play, Pause, Users, MapPin, Heart, MessageCircle, Share2 } from "lucide-react";
import campaignVideo from "@assets/Cafe.mp4";

interface C2CVideoCardProps {
  videoSource?: string;
  title?: string;
  description?: string;
  sellerName?: string;
  location?: string;
  price?: number;
  currency?: string;
  condition?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  showSellerInfo?: boolean;
  isNegotiable?: boolean;
}

export function C2CVideoCard({ 
  videoSource = campaignVideo,
  title = "C2C Marketplace | Find Great Deals",
  description = "Discover unique items from trusted community members in your area",
  sellerName = "Local Seller",
  location = "Your Area",
  price = 150,
  currency = "USD",
  condition = "Like New",
  autoPlay = false,
  showControls = true,
  showSellerInfo = true,
  isNegotiable = true
}: C2CVideoCardProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLiked, setIsLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isVisible) {
    return null;
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <Card className="w-full overflow-hidden border-2 border-green-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">C2C Marketplace</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-100"
            onClick={() => setIsVisible(false)}
            title="Close video"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-48 object-cover"
          autoPlay={autoPlay}
          loop
          muted={isMuted}
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={videoSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Video controls overlay */}
        {showControls && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              onClick={togglePlay}
              title={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              onClick={toggleMute}
              title={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {/* Social interaction overlay */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
            onClick={toggleLike}
            title={isLiked ? "Unlike this item" : "Like this item"}
          >
            <Heart className={`h-3 w-3 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
            title="Message seller"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
            title="Share with friends"
          >
            <Share2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Title header overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 pointer-events-none">
          <p className="text-white text-sm font-medium">
            {title}
          </p>
        </div>
      </div>

      {showSellerInfo && (
        <CardContent className="pt-3">
          <p className="text-sm text-gray-600 mb-3">{description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-bold text-green-600">
              {currency} {price.toLocaleString()}
              {isNegotiable && <span className="text-xs text-gray-500 ml-1">(Negotiable)</span>}
            </div>
            <Badge variant="outline">{condition}</Badge>
          </div>

          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
            <span>•</span>
            <span>by {sellerName}</span>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
              title="Contact seller about this item"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Message Seller
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              title="Make an offer for this item"
            >
              Make Offer
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}