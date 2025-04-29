import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import EnhancedPostCard from "@/components/social/EnhancedPostCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Sparkles, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";

interface ContentFeedProps {
  initialFeedType?: 'personal' | 'communities' | 'recommended';
  initialContentType?: string;
  userId?: number;
  limit?: number;
  userPosts?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function ContentFeed({ 
  initialFeedType = 'personal', 
  initialContentType, 
  userId, 
  limit, 
  userPosts 
}: ContentFeedProps) {
  const { t } = useTranslation();
  const [feedType, setFeedType] = useState<'personal' | 'communities' | 'recommended'>(initialFeedType);
  const [contentType, setContentType] = useState<string | null>(initialContentType || null);
  const [page, setPage] = useState(1);
  
  // Get the current user ID for user posts
  const { user } = useAuth();
  const currentUserId = userPosts && user ? user.id : userId;
  
  // Set the item limit
  const itemLimit = limit || ITEMS_PER_PAGE;
  const offset = (page - 1) * itemLimit;
  
  // Build the API URL based on the feed type
  const getFeedEndpoint = () => {
    if (userPosts && currentUserId) {
      return `/api/posts?userId=${currentUserId}&limit=${itemLimit}&offset=${offset}${contentType ? `&contentType=${contentType}` : ''}`;
    }
    
    switch (feedType) {
      case 'personal':
        return `/api/feed/personal?limit=${itemLimit}&offset=${offset}${contentType ? `&contentType=${contentType}` : ''}`;
      case 'communities':
        return `/api/feed/communities?limit=${itemLimit}&offset=${offset}${contentType ? `&contentType=${contentType}` : ''}`;
      case 'recommended':
        return `/api/feed/recommended?limit=${itemLimit}&offset=${offset}${contentType ? `&contentType=${contentType}` : ''}`;
      default:
        return `/api/feed/personal?limit=${itemLimit}&offset=${offset}${contentType ? `&contentType=${contentType}` : ''}`;
    }
  };

  // Fetch posts using the appropriate feed endpoint
  const queryKey = [getFeedEndpoint()];
  
  const { data, isLoading, isFetching, refetch } = useQuery<Post[]>({
    queryKey,
    enabled: !userPosts || !!currentUserId,
  });
  
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  const handleContentTypeChange = (type: string) => {
    setContentType(type === "all" ? null : type);
    setPage(1); // Reset to first page when changing content type
  };
  
  const handleFeedTypeChange = (type: 'personal' | 'communities' | 'recommended') => {
    setFeedType(type);
    setPage(1); // Reset to first page when changing feed type
    refetch(); // Refetch data with the new feed type
  };
  
  return (
    <div className="space-y-4">
      {/* Feed Type Selection (not shown for user profile posts) */}
      {!userPosts && (
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={feedType === 'personal' ? "default" : "outline"} 
                className="w-full" 
                onClick={() => handleFeedTypeChange('personal')}
              >
                <User className="h-4 w-4 mr-2" />
                {t("social.my_feed")}
              </Button>
              <Button 
                variant={feedType === 'communities' ? "default" : "outline"} 
                className="w-full" 
                onClick={() => handleFeedTypeChange('communities')}
              >
                <Users className="h-4 w-4 mr-2" />
                {t("social.communities")}
              </Button>
              <Button 
                variant={feedType === 'recommended' ? "default" : "outline"} 
                className="w-full" 
                onClick={() => handleFeedTypeChange('recommended')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t("social.discover")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Content Type Filters */}
      <Tabs defaultValue={contentType || "all"} onValueChange={handleContentTypeChange}>
        <TabsList className="w-full grid grid-cols-6">
          <TabsTrigger value="all">{t("social.all")}</TabsTrigger>
          <TabsTrigger value="text">{t("social.text")}</TabsTrigger>
          <TabsTrigger value="image">{t("social.photos")}</TabsTrigger>
          <TabsTrigger value="video">{t("social.videos")}</TabsTrigger>
          <TabsTrigger value="article">{t("social.articles")}</TabsTrigger>
          <TabsTrigger value="advertisement">{t("social.ads")}</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* No Posts State */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">{t("social.no_posts")}</h3>
          <p className="mt-2 text-sm text-gray-500">
            {feedType === 'personal' 
              ? t("social.follow_users") 
              : feedType === 'communities' 
                ? t("social.join_communities")
                : t("social.be_first")
            }
          </p>
        </div>
      )}
      
      {/* Posts List */}
      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((post) => (
            <EnhancedPostCard key={post.id} post={post} />
          ))}
          
          {/* Load More Button */}
          {data.length >= itemLimit && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleLoadMore}
                disabled={isFetching}
                variant="outline"
                className="px-6"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("social.loading")}
                  </>
                ) : (
                  t("social.load_more")
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}