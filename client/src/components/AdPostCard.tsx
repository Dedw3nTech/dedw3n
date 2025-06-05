import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import campaignImage from "@assets/98967833-7D1A-41E7-AF00-635D7E14BECF_1749108934392.png";

export function AdPostCard() {
  return (
    <Card className="bg-white border-2 border-blue-200">
      <CardContent className="p-4 bg-white">
        {/* Advertisement Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
              Advertisement
            </div>
            <span className="text-xs text-gray-500">Sponsored</span>
          </div>
          <a href="/remove-ads" className="text-xs text-blue-600 hover:text-blue-800 underline">
            Remove ads
          </a>
        </div>

        {/* Advertisement Content */}
        <div className="cursor-pointer" onClick={() => window.open('https://www.dedw3n.com', '_blank')}>
          <div className="mb-3">
            <img 
              src={campaignImage}
              alt="Dedw3n - Buy, Sell, Socialize, Love"
              className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-gray-900">
              Join Dedw3n - Your Ultimate Social Marketplace
            </h3>
            <p className="text-gray-600 text-sm">
              Buy, sell, socialize, and find love all in one platform. Experience the future of social commerce with exclusive deals and community connections.
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
                Learn More
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open('https://www.dedw3n.com/signup', '_blank');
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}