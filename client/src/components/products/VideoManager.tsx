import { useState } from "react";
import { useMarketType } from "@/hooks/use-market-type";
import { B2BVideoCard } from "@/components/products/B2BVideoCard";
import { C2CVideoCard } from "@/components/products/C2CVideoCard";
import { VideoAdCampaignCard } from "@/components/products/VideoAdCampaignCard";

// Different video entities with their own properties
interface B2BVideo {
  id: string;
  type: 'b2b';
  videoSource: string;
  title: string;
  description: string;
  targetAudience: string;
  businessType: string;
  minOrderValue: number;
  currency: string;
  companyName?: string;
  industryFocus?: string;
  certifications?: string[];
  yearsInBusiness?: number;
}

interface C2CVideo {
  id: string;
  type: 'c2c';
  videoSource: string;
  title: string;
  description: string;
  sellerName: string;
  location: string;
  price: number;
  currency: string;
  condition: string;
  isNegotiable: boolean;
  itemCategory?: string;
  timePosted?: string;
  viewCount?: number;
  likeCount?: number;
}

interface B2CVideo {
  id: string;
  type: 'b2c';
  videoSource: string;
  title: string;
  description?: string;
  brandName?: string;
  productCategory?: string;
  discountPercentage?: number;
  campaignDuration?: string;
  targetDemographic?: string;
}

type VideoEntity = B2BVideo | C2CVideo | B2CVideo;

interface VideoManagerProps {
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
}

// Sample video data for each marketplace type
const sampleVideos: Record<string, VideoEntity[]> = {
  b2b: [
    {
      id: 'b2b-1',
      type: 'b2b',
      videoSource: '/assets/Cafe.mp4',
      title: 'Wholesale Coffee Equipment',
      description: 'Premium commercial coffee machines for restaurants and cafes',
      targetAudience: 'Restaurant Owners & Cafe Managers',
      businessType: 'Equipment Supplier',
      minOrderValue: 10000,
      currency: 'USD',
      companyName: 'ProCafe Solutions',
      industryFocus: 'Food Service Equipment',
      certifications: ['ISO 9001', 'CE Certified', 'Energy Star'],
      yearsInBusiness: 15
    },
    {
      id: 'b2b-2',
      type: 'b2b',
      videoSource: '/assets/Cafe.mp4',
      title: 'Industrial Manufacturing Solutions',
      description: 'Bulk industrial components and manufacturing equipment for large-scale operations',
      targetAudience: 'Manufacturing Companies',
      businessType: 'Industrial Supplier',
      minOrderValue: 25000,
      currency: 'USD',
      companyName: 'Industrial Pro',
      industryFocus: 'Manufacturing & Industrial',
      certifications: ['ISO 14001', 'OSHA Compliant'],
      yearsInBusiness: 20
    }
  ],
  c2c: [
    {
      id: 'c2c-1',
      type: 'c2c',
      videoSource: '/assets/Cafe.mp4',
      title: 'Vintage Guitar Collection',
      description: 'Rare vintage electric guitar in excellent condition, perfect for collectors',
      sellerName: 'MusicLover92',
      location: 'Downtown Area',
      price: 1200,
      currency: 'USD',
      condition: 'Excellent',
      isNegotiable: true,
      itemCategory: 'Musical Instruments',
      timePosted: '2 days ago',
      viewCount: 45,
      likeCount: 12
    },
    {
      id: 'c2c-2',
      type: 'c2c',
      videoSource: '/assets/Cafe.mp4',
      title: 'Designer Furniture Set',
      description: 'Modern living room set, gently used, moving sale',
      sellerName: 'HomeDesigner',
      location: 'Suburban District',
      price: 800,
      currency: 'USD',
      condition: 'Good',
      isNegotiable: true,
      itemCategory: 'Furniture',
      timePosted: '1 week ago',
      viewCount: 78,
      likeCount: 23
    }
  ],
  b2c: [
    {
      id: 'b2c-1',
      type: 'b2c',
      videoSource: '/assets/Cafe.mp4',
      title: 'Summer Fashion Collection',
      description: 'Discover the latest trends in summer fashion with exclusive discounts',
      brandName: 'TrendyStyle',
      productCategory: 'Fashion & Apparel',
      discountPercentage: 30,
      campaignDuration: 'Limited Time',
      targetDemographic: 'Young Adults 18-35'
    }
  ]
};

export function VideoManager({ autoPlay = false, showControls = true, className = "" }: VideoManagerProps) {
  const { marketType } = useMarketType();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  
  const currentVideos = sampleVideos[marketType] || [];
  const currentVideo = currentVideos[currentVideoIndex];

  if (!currentVideo || currentVideos.length === 0) {
    return null;
  }

  const handleNextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % currentVideos.length);
  };

  const handlePrevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + currentVideos.length) % currentVideos.length);
  };

  const renderVideoCard = () => {
    switch (currentVideo.type) {
      case 'b2b':
        const b2bVideo = currentVideo as B2BVideo;
        return (
          <B2BVideoCard
            videoSource={b2bVideo.videoSource}
            title={b2bVideo.title}
            description={b2bVideo.description}
            targetAudience={b2bVideo.targetAudience}
            businessType={b2bVideo.businessType}
            minOrderValue={b2bVideo.minOrderValue}
            currency={b2bVideo.currency}
            autoPlay={autoPlay}
            showControls={showControls}
            showBusinessInfo={true}
          />
        );
      
      case 'c2c':
        const c2cVideo = currentVideo as C2CVideo;
        return (
          <C2CVideoCard
            videoSource={c2cVideo.videoSource}
            title={c2cVideo.title}
            description={c2cVideo.description}
            sellerName={c2cVideo.sellerName}
            location={c2cVideo.location}
            price={c2cVideo.price}
            currency={c2cVideo.currency}
            condition={c2cVideo.condition}
            autoPlay={autoPlay}
            showControls={showControls}
            showSellerInfo={true}
            isNegotiable={c2cVideo.isNegotiable}
          />
        );
      
      case 'b2c':
        const b2cVideo = currentVideo as B2CVideo;
        return (
          <VideoAdCampaignCard
            videoSource={b2cVideo.videoSource}
            title={b2cVideo.title}
            autoPlay={autoPlay}
            showControls={showControls}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {renderVideoCard()}
      
      {/* Video navigation if multiple videos exist */}
      {currentVideos.length > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={handlePrevVideo}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="Previous video"
          >
            ← Previous
          </button>
          <span className="px-3 py-1 text-xs text-gray-600">
            {currentVideoIndex + 1} of {currentVideos.length}
          </span>
          <button
            onClick={handleNextVideo}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            title="Next video"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}