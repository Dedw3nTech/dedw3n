import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Video, TrendingUp, Eye, Clock } from "lucide-react";
import { Link } from "wouter";

export function VideoAdCampaignCard() {
  const campaigns = [
    {
      id: 1,
      title: "Summer Fashion Collection",
      description: "Trending styles for the season",
      views: "12.5K",
      duration: "0:30",
      engagement: "+25%",
      thumbnail: "/api/placeholder/120/80"
    },
    {
      id: 2,
      title: "Tech Gadgets Showcase",
      description: "Latest electronics & accessories",
      views: "8.2K",
      duration: "0:45",
      engagement: "+18%",
      thumbnail: "/api/placeholder/120/80"
    },
    {
      id: 3,
      title: "Home & Living Essentials",
      description: "Transform your space",
      views: "6.1K",
      duration: "0:25",
      engagement: "+32%",
      thumbnail: "/api/placeholder/120/80"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-[15px]">
          <Video className="h-5 w-5 text-blue-600" />
          Video Ad Campaigns
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                <Play className="h-4 w-4 text-gray-400" />
              </div>
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-[8px] px-1 rounded">
                {campaign.duration}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="space-y-1">
                <h4 className="font-medium leading-tight text-[12px] truncate">
                  {campaign.title}
                </h4>
                <p className="text-[10px] text-gray-500 truncate">
                  {campaign.description}
                </p>
                
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{campaign.views}</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>{campaign.engagement}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 flex-shrink-0"
              asChild
            >
              <Link href={`/campaigns/${campaign.id}`}>
                <Play className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
        
        <div className="pt-2">
          <Button 
            asChild 
            variant="ghost" 
            className="w-full border-0 text-[12px]"
          >
            <Link href="/campaigns">
              <Video className="h-4 w-4 mr-2" />
              View All Campaigns
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}