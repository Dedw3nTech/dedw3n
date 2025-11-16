import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Play, Eye, Clock, DollarSign, Users, Filter, Search } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMarketType } from "@/hooks/use-market-type";

interface CreatorVideo {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  views: number;
  likes: number;
  price: number;
  currency: string;
  monetizationType: 'free' | 'ppv' | 'subscription';
  isPremium: boolean;
  previewUrl: string;
  createdAt: string;
  creator: {
    id: number;
    username: string;
    name: string;
    avatar: string;
  };
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP'
  }).format(price);
};

const formatViews = (views: number) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

export default function MarketplaceCreators() {
  const { setMarketType } = useMarketType();
  const [searchTerm, setSearchTerm] = useState("");
  const [monetizationFilter, setMonetizationFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setMarketType("creators");
  }, [setMarketType]);

  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['/api/creators/videos', { page, monetizationType: monetizationFilter, search: searchTerm }],
    enabled: true
  });

  const filteredVideos = videos?.filter((video: CreatorVideo) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.creator.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filters Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                data-testid="input-search"
                placeholder="Search videos or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <Select value={monetizationFilter} onValueChange={setMonetizationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="free">Free Videos</SelectItem>
                <SelectItem value="ppv">Pay-per-View</SelectItem>
                <SelectItem value="subscription">Subscription Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-video bg-gray-300 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Failed to load videos</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">No videos found</div>
            <p className="text-sm text-gray-400">
              {searchTerm || monetizationFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Be the first to upload content!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video: CreatorVideo) => (
              <Card key={video.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                  <img
                    src={video.thumbnailUrl || '/api/placeholder/400/225'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Duration Badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatDuration(video.duration)}
                    </div>
                  )}

                  {/* Monetization Badge */}
                  <div className="absolute top-2 left-2">
                    {video.monetizationType === 'free' && (
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        Free
                      </Badge>
                    )}
                    {video.monetizationType === 'ppv' && (
                      <Badge variant="secondary" className="bg-blue-500 text-white">
                        Pay-per-View
                      </Badge>
                    )}
                    {video.monetizationType === 'subscription' && (
                      <Badge variant="secondary" className="bg-purple-500 text-white">
                        Premium
                      </Badge>
                    )}
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-30">
                    <div className="bg-white bg-opacity-90 rounded-full p-4">
                      <Play className="w-6 h-6 text-gray-900 fill-current" />
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {video.title}
                  </h3>
                  
                  {/* Creator Info */}
                  <Link href={`/creators/${video.creator.id}`}>
                    <div className="flex items-center gap-2 mt-2 group/creator hover:text-blue-600 transition-colors">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={video.creator.avatar} alt={video.creator.name} />
                        <AvatarFallback className="text-xs">
                          {video.creator.name?.charAt(0) || video.creator.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600 group-hover/creator:text-blue-600 transition-colors truncate">
                        {video.creator.name || video.creator.username}
                      </span>
                    </div>
                  </Link>
                </CardHeader>

                <CardContent className="pt-0 pb-2">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViews(video.views)} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatViews(video.likes)} likes
                    </div>
                  </div>

                  {/* Price */}
                  {video.monetizationType !== 'free' && (
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <DollarSign className="w-4 h-4" />
                      {formatPrice(video.price, video.currency)}
                      {video.monetizationType === 'subscription' && (
                        <span className="text-xs text-gray-500">/month</span>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  <Link href={`/watch/${video.id}`} className="w-full">
                    <Button 
                      data-testid={`button-watch-${video.id}`}
                      className="w-full" 
                      variant={video.monetizationType === 'free' ? 'default' : 'outline'}
                    >
                      {video.monetizationType === 'free' ? 'Watch Now' : 
                       video.monetizationType === 'ppv' ? 'Purchase & Watch' : 'Subscribe to Watch'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredVideos.length > 0 && filteredVideos.length >= 12 && (
          <div className="text-center mt-8">
            <Button 
              data-testid="button-load-more"
              onClick={() => setPage(page + 1)} 
              variant="outline"
              disabled={isLoading}
            >
              Load More Videos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}