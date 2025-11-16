import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Share2, Bookmark } from "lucide-react";
import { InstantImage } from "@/hooks/use-ultra-instant-image";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
const campaignImage = "/attached_assets/Copy of Spend more time  running Brussels_1761685553333.png";

export function AdPostCard() {
  // Translation setup
  const textsToTranslate = [
    "Advertisement",
    "Sponsored",
    "Remove ads",
    "Special Campaign - Limited Time Offer",
    "🎉 Special Launch Offer",
    "Get 50% OFF on all premium products. Limited time exclusive deal - don't miss out on this incredible offer!",
    "Learn More",
    "Get Started",
    "Like",
    "Comment",
    "Share"
  ];

  const { translations } = useMasterBatchTranslation(textsToTranslate);

  const advertisementText = translations[0] || "Advertisement";
  const sponsoredText = translations[1] || "Sponsored";
  const removeAdsText = translations[2] || "Remove ads";
  const campaignAltText = translations[3] || "Special Campaign - Limited Time Offer";
  const specialOfferText = translations[4] || "🎉 Special Launch Offer";
  const offerDescriptionText = translations[5] || "Get 50% OFF on all premium products. Limited time exclusive deal - don't miss out on this incredible offer!";
  const learnMoreText = translations[6] || "Learn More";
  const getStartedText = translations[7] || "Get Started";
  const likeText = translations[8] || "Like";
  const commentText = translations[9] || "Comment";
  const shareText = translations[10] || "Share";

  return (
    <Card className="bg-white border-2 border-blue-200">
      <CardContent className="p-4 bg-white">
        {/* Advertisement Label */}
        <div className="mb-3">
          <span className="text-xs text-gray-500">{sponsoredText}</span>
        </div>

        {/* Advertisement Content */}
        <div className="cursor-pointer" onClick={() => window.open('https://www.dedw3n.com', '_blank')}>
          <div className="space-y-2 mb-4">
            <h3 className="font-bold text-lg text-gray-900">
              {specialOfferText}
            </h3>
            <p className="text-gray-600 text-sm">
              {offerDescriptionText}
            </p>
          </div>
          
          <div className="mb-6 flex justify-end">
            <Button 
              size="sm" 
              className="bg-black hover:bg-gray-800 text-white"
              onClick={(e) => {
                e.stopPropagation();
                window.open('https://www.dedw3n.com', '_blank');
              }}
            >
              {learnMoreText}
            </Button>
          </div>
          
          <div className="mb-3">
            <InstantImage 
              src={campaignImage}
              alt={campaignAltText}
              className="w-full h-auto object-contain rounded-lg hover:scale-105 transition-transform duration-300"
              priority="instant"
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3 border-t pt-4 pb-4">
        <div className="flex justify-between w-full">
          <div></div>
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              size="default"
              className="flex items-center gap-1 text-black"
            >
              <ThumbsUp className="h-5 w-5" />
              <span>0</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="default"
              className="flex items-center gap-1 text-black"
            >
              <MessageSquare className="h-5 w-5" />
              <span>0</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="default"
              className="flex items-center gap-1 text-black"
            >
              <Share2 className="h-5 w-5" />
              <span>0</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="default"
              className="flex items-center gap-1 text-black"
            >
              <Bookmark className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}