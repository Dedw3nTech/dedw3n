import { useState, useEffect, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Users, Loader2, RefreshCw, Star, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PostCard from "@/components/social/PostCard";
import CreatePost from "@/components/social/CreatePost";
import { Container } from "@/components/ui/container";
import { useToast } from "@/hooks/use-toast";
import { LatestProductsCard } from "@/components/products/LatestProductsCard";
import { PopularProductsCard } from "@/components/products/PopularProductsCard";
import { SidebarAdCard } from "@/components/SidebarAdCard";
import { ProfileSideCard } from "@/components/ProfileSideCard";
import { AdPostCard } from "@/components/AdPostCard";
import campaignImage from "@assets/Copy of Copy of Pre Launch Campaign  SELL (1).png";

interface Post {
  id: number;
  userId: number;
  content: string;
  title?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: number;
  shares: number;
  user: {
    id: number;
    username: string;
    name: string;
    avatar?: string;
  };
  _count: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked: boolean;
  isShared: boolean;
}

interface CommunityFeedResponse {
  posts: Post[];
  hasMore: boolean;
  nextCursor?: number;
}

const POSTS_PER_PAGE = 10;

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdVisible, setIsAdVisible] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'trending' | 'popular' | 'following' | 'watchlist' | 'suggested'>('new');

  // Use the existing personal feed to show all posts for community feed
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['/api/feed/personal', refreshKey, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/feed/personal?offset=${pageParam}&limit=${POSTS_PER_PAGE}&sort=${sortBy}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch community feed');
      }
      const posts = await response.json();
      
      // Transform the data to match expected CommunityFeedResponse format
      return {
        posts: posts.map((post: any) => ({
          ...post,
          _count: {
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0
          },
          isLiked: false,
          isShared: false
        })),
        hasMore: posts.length === POSTS_PER_PAGE,
        totalCount: posts.length,
        currentOffset: pageParam,
        nextOffset: posts.length === POSTS_PER_PAGE ? pageParam + POSTS_PER_PAGE : null
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * POSTS_PER_PAGE;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount unless data is stale
  });

  // Infinite scroll handler with throttling
  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
    const threshold = document.documentElement.offsetHeight - 800;
    
    if (scrollPosition >= threshold) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Set up scroll listener with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const throttledHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 150);
    };
    
    window.addEventListener('scroll', throttledHandler, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledHandler);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  // Flatten all posts from all pages and deduplicate by ID
  const allPosts = data?.pages?.flatMap(page => page.posts) || [];
  const uniquePosts = allPosts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Community feed refreshed",
      description: "Latest posts have been loaded",
    });
  };

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isError) {
    return (
      <Container className="py-8">
        <div className="text-center">
          <div className="mb-4">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load community feed</h2>
            <p className="text-gray-600 mb-4">
              {error?.message || "There was an error loading the community posts."}
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-6">
      <div className="max-w-7xl mx-auto">


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ProfileSideCard />
            </div>
          </div>

          {/* Main Feed Column */}
          <div className="lg:col-span-4">
            {/* Create Post Section */}
            {user && (
              <div className="mb-6" data-create-post>
                <CreatePost />
              </div>
            )}

            {/* Filter Tabs */}
            <div className="mb-8 flex items-center justify-center relative">
              <div className="flex gap-12 text-[12px]">
                <button
                  onClick={() => setSortBy('new')}
                  className={`text-xl text-black pb-3 transition-all duration-300 relative ${
                    sortBy === 'new' 
                      ? 'font-bold' 
                      : 'font-normal hover:text-blue-500'
                  }`}
                >
                  New
                  {sortBy === 'new' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-black"></div>
                  )}
                </button>
                <button
                  onClick={() => setSortBy('trending')}
                  className={`text-xl text-black pb-3 transition-all duration-300 relative ${
                    sortBy === 'trending' 
                      ? 'font-bold' 
                      : 'font-normal hover:text-blue-500'
                  }`}
                >
                  Trending
                  {sortBy === 'trending' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-black"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Feed Sorting Options */}
            <div className="mb-6 flex items-center justify-center">
              <div className="flex gap-8 text-xs text-gray-600">
                <button
                  onClick={() => setSortBy('popular')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'popular' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >
                  Popular
                </button>
                <button
                  onClick={() => setSortBy('following')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'following' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >Following</button>
                <button
                  onClick={() => setSortBy('watchlist')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'watchlist' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >Watchlist</button>
                <button
                  onClick={() => setSortBy('suggested')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'suggested' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >Suggested</button>
                <button
                  onClick={() => setSortBy('region')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'region' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >My Region</button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600">Loading community posts...</p>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {uniquePosts.map((post, index) => (
                <div key={`${post.id}-${index}`}>
                  <PostCard post={post} />
                  {/* Insert advertisement every 4 posts */}
                  {(index + 1) % 4 === 0 && (
                    <div className="mt-6">
                      <AdPostCard />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Load More Indicator */}
            {isFetchingNextPage && (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-600">Loading more posts...</p>
              </div>
            )}

            {/* End of Feed */}
            {!hasNextPage && uniquePosts.length > 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>You've seen all community posts</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && uniquePosts.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">
                  Be the first to share something with the community!
                </p>
                {user && (
                  <Button onClick={() => document.querySelector('[data-create-post]')?.scrollIntoView({ behavior: 'smooth' })}>
                    Create First Post
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Products Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <LatestProductsCard />
              <PopularProductsCard />
              <SidebarAdCard />
            </div>
          </div>
        </div>
      </div>
      {/* Fixed Bottom Advertisement - Full Width Image */}
      {isAdVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
          <div className="relative w-full bg-black shadow-lg">
            {/* Close button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10 h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsAdVisible(false)}
            >
              ×
            </Button>
            
            {/* Advertisement Image */}
            <div className="w-full h-20 overflow-hidden cursor-pointer">
              <img 
                src={campaignImage}
                alt="Dedw3n - Buy, Sell, Socialize, Love"
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                onClick={() => window.open('https://www.dedw3n.com', '_blank')}
              />
            </div>
            
            {/* Blue Bar with Advertisement Text */}
            <div className="w-full bg-blue-600 py-1 px-4">
              <div className="max-w-7xl mx-auto flex items-center justify-center">
                <span className="text-white text-xs">
                  Advertisement . <a href="/remove-ads" className="underline hover:text-blue-200">Remove ads</a>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}