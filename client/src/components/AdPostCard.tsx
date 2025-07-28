import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InstantImage } from "@/hooks/use-ultra-instant-image";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
const campaignImage = "/attached_assets/Copy of Pre Launch Campaingn Notification_1749109720371.png";

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
    "Get Started"
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

  return (
    <Card className="bg-white border-2 border-blue-200">
      <CardContent className="p-4 bg-white">
        {/* Advertisement Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              {advertisementText}
            </div>
            <span className="text-xs text-gray-500">{sponsoredText}</span>
          </div>
          <a href="/remove-ads" className="text-xs text-blue-600 hover:text-blue-800 underline">
            {removeAdsText}
          </a>
        </div>

        {/* Advertisement Content */}
        <div className="cursor-pointer" onClick={() => window.open('https://www.dedw3n.com', '_blank')}>
          <div className="mb-3">
            <InstantImage 
              src={campaignImage}
              alt={campaignAltText}
              className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
              priority="instant"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-gray-900">
              {specialOfferText}
            </h3>
            <p className="text-gray-600 text-sm">
              {offerDescriptionText}
            </p>
            
            <div className="flex items-center gap-2 pt-2">
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://www.dedw3n.com', '_blank');
                }}
              >
                {learnMoreText}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://www.dedw3n.com/signup', '_blank');
                }}
              >
                {getStartedText}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}