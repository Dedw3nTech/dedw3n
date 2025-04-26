import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import EnhancedPostCard from "@/components/social/EnhancedPostCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ContentFeedProps {
  initialContentType?: string;
  userId?: number;
  limit?: number;
  userPosts?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function ContentFeed({ initialContentType, userId, limit, userPosts }: ContentFeedProps) {
  const { t } = useTranslation();
  const [contentType, setContentType] = useState<string | null>(initialContentType || null);
  const [page, setPage] = useState(1);
  
  // Get the current user ID for user posts
  const { user } = useAuth();
  const currentUserId = userPosts && user ? user.id : userId;
  
  // Set the item limit
  const itemLimit = limit || ITEMS_PER_PAGE;
  
  // Construct the query key based on filters
  const queryKey = contentType 
    ? ["/api/posts", { contentType, userId: currentUserId, limit: itemLimit, offset: (page - 1) * itemLimit }] 
    : ["/api/posts", { userId: currentUserId, limit: itemLimit, offset: (page - 1) * itemLimit }];
  
  // Fetch posts
  const { data, isLoading, isFetching } = useQuery<Post[]>({
    queryKey,
  });
  
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  const handleContentTypeChange = (type: string) => {
    setContentType(type === "all" ? null : type);
    setPage(1); // Reset to first page when changing content type
  };
  
  return (
    <div className="space-y-4">
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
            {t("social.be_first")}
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
          {data.length >= ITEMS_PER_PAGE && (
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