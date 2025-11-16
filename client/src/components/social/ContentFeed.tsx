import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Post } from "@shared/schema";
import EnhancedPostCard from "@/components/social/EnhancedPostCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Sparkles, User, Clock } from "lucide-react";
import { useMasterTranslation } from "@/hooks/use-master-translation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";

interface ContentFeedProps {
  initialFeedType?: 'personal' | 'communities' | 'recommended';
  initialSortType?: 'relevant' | 'recent';
  userId?: number;
  limit?: number;
  userPosts?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function ContentFeed({ 
  initialFeedType = 'personal', 
  initialSortType = 'relevant',
  userId, 
  limit, 
  userPosts 
}: ContentFeedProps) {
  const { translateText } = useMasterTranslation();
  const [feedType, setFeedType] = useState<'personal' | 'communities' | 'recommended'>(initialFeedType);
  const [sortType, setSortType] = useState<'relevant' | 'recent'>(initialSortType);
  const [page, setPage] = useState(1);
  
  // Get the current user ID for user posts
  const { user } = useAuth();
  const currentUserId = userPosts && user ? user.id : userId;
  
  // Set the item limit
  const itemLimit = limit || ITEMS_PER_PAGE;
  const offset = (page - 1) * itemLimit;
  
  // Build the API URL based on the feed type and sort type
  const getFeedEndpoint = () => {
    // Add sort param based on the selected sort type
    const sortParam = sortType === 'recent' ? '&sort=recent' : '';
    
    if (userPosts && currentUserId) {
      return `/api/posts?userId=${currentUserId}&limit=${itemLimit}&offset=${offset}${sortParam}`;
    }
    
    switch (feedType) {
      case 'personal':
        return `/api/feed/personal?limit=${itemLimit}&offset=${offset}${sortParam}`;
      case 'communities':
        return `/api/feed/communities?limit=${itemLimit}&offset=${offset}${sortParam}`;
      case 'recommended':
        return `/api/feed/recommended?limit=${itemLimit}&offset=${offset}${sortParam}`;
      default:
        return `/api/feed/personal?limit=${itemLimit}&offset=${offset}${sortParam}`;
    }
  };

  // Fetch posts using the appropriate feed endpoint
  const queryKey = [getFeedEndpoint()];
  
  const { data, isLoading, isFetching, refetch, error } = useQuery<Post[]>({
    queryKey,
    enabled: !userPosts || !!currentUserId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch on mount unless data is stale
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchInterval: 0, // Disable automatic polling
    // Using the default QueryClient's queryFn which adds auth headers
  });
  

  

  
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  const handleSortChange = (type: 'relevant' | 'recent') => {
    setSortType(type);
    setPage(1); // Reset to first page when changing sort type
    refetch(); // Refetch data with the new sort type
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
        <div className="mb-4 text-center pb-2 border-b">
          <div className="flex justify-center gap-6">
            <span 
              className={`cursor-pointer text-lg ${feedType === 'personal' ? "font-bold text-black" : "text-gray-600 hover:text-gray-900"}`} 
              onClick={() => handleFeedTypeChange('personal')}
            >
              <User className={`h-4 w-4 inline mr-1 ${feedType === 'personal' ? "text-black font-bold" : ""}`} />
              {translateText("My Feed")}
            </span>
            <span 
              className={`cursor-pointer text-lg ${feedType === 'communities' ? "font-bold text-black" : "text-gray-600 hover:text-gray-900"}`} 
              onClick={() => handleFeedTypeChange('communities')}
            >
              <Users className={`h-4 w-4 inline mr-1 ${feedType === 'communities' ? "text-black font-bold" : ""}`} />
              {translateText("Communities")}
            </span>
          </div>
        </div>
      )}
      
      {/* Sort Options */}
      <div className="mb-4 text-center">
        <div className="flex justify-center gap-6">
          <span 
            className={`cursor-pointer ${sortType === 'relevant' ? "font-bold text-black" : "text-gray-600 hover:text-gray-900"}`} 
            onClick={() => handleSortChange('relevant')}
          >
            <Sparkles className={`h-4 w-4 inline mr-1 ${sortType === 'relevant' ? "text-black font-bold" : ""}`} />
            {translateText("Most Relevant")}
          </span>
          <span 
            className={`cursor-pointer ${sortType === 'recent' ? "font-bold text-black" : "text-gray-600 hover:text-gray-900"}`} 
            onClick={() => handleSortChange('recent')}
          >
            <Clock className={`h-4 w-4 inline mr-1 ${sortType === 'recent' ? "text-black font-bold" : ""}`} />
            {translateText("Most Recent")}
          </span>
        </div>
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* No Posts State */}
      {!isLoading && (!data || data.length === 0) && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">{translateText("No posts yet")}</h3>
          <p className="mt-2 text-sm text-gray-500">
            {feedType === 'personal' 
              ? translateText("Follow users to see their posts in your feed") 
              : feedType === 'communities' 
                ? translateText("Join communities to see their posts")
                : translateText("Be the first to post!")
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
                    {translateText("Loading...")}
                  </>
                ) : (
                  translateText("Load More")
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}