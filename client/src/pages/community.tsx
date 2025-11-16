import { useState, useEffect, useCallback, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Users, Loader2, RefreshCw, Star, Zap, TrendingUp, MessageCircle, Video, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PostCard from "@/components/social/PostCard";
import CreatePost from "@/components/social/CreatePost";
import { Container } from "@/components/ui/container";
import { useToast } from "@/hooks/use-toast";
import { LatestProductsCard } from "@/components/products/LatestProductsCard";
import { PopularProductsCard } from "@/components/products/PopularProductsCard";
import { TrendingCategoriesCard } from "@/components/products/TrendingCategoriesCard";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

import { VideoDisplayCard } from "@/components/products/VideoDisplayCard";

import { TrendingProductsToolbar } from "@/components/products/TrendingProductsToolbar";
import { ProfileSideCard } from "@/components/ProfileSideCard";

const campaignImage = "/attached_assets/Copy of Copy of Pre Launch Campaign  SELL (1).png";
import { useLocation } from "wouter";
import leopardVideo from "@assets/Generated File November 09, 2025 - 8_24PM (1)_1762805360661.mp4";

// Community-specific promotional images
const communityTopPromo = "/attached_assets/Dedw3n Business commHeader.png";
const communityBottomPromo = "/attached_assets/_Dedw3n Business comm footer _1749580313800.png";

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

// Community Advertisement Components
function CommunityTopPromoSection({ altText }: { altText: string }) {
  return (
    <div className="w-full mb-6">
      <img 
        src={communityTopPromo}
        alt={altText}
        className="w-full h-[200px] sm:h-[250px] md:h-[300px] object-cover rounded-lg"
      />
    </div>
  );
}

function CommunityBottomPromoSection({ altText }: { altText: string }) {
  return (
    <div className="w-full mt-8">
      <img 
        src={communityBottomPromo}
        alt={altText}
        className="w-full h-[200px] sm:h-[250px] md:h-[300px] object-cover rounded-lg"
      />
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'new' | 'trending' | 'popular' | 'following' | 'region' | 'country' | 'city'>('new');
  const [searchTerm, setSearchTerm] = useState("");

  // Optimized Translation System - Split into smaller manageable batches
  const coreTexts = [
    "Community Feed", "New", "Trending", "Popular", "Following", 
    "Thinking", "No posts yet", "Create Post", 
    "Refresh", "Try Again", "Failed to fetch community feed"
  ];

  const { translations: coreTranslations } = useMasterBatchTranslation(coreTexts, 'normal');
  
  // Helper function to get translation safely
  const getTranslation = useCallback((text: string, fallback?: string) => {
    if (coreTranslations && Array.isArray(coreTranslations)) {
      const textIndex = coreTexts.indexOf(text);
      if (textIndex !== -1 && coreTranslations[textIndex]) {
        return coreTranslations[textIndex];
      }
    }
    return fallback || text;
  }, [coreTranslations, coreTexts]);

  // Track if we've reached the end of feed to prevent unnecessary calls
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [lastFetchedCount, setLastFetchedCount] = useState(0);

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
    queryKey: ['/api/feed/community', sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/feed/community?offset=${pageParam}&limit=${POSTS_PER_PAGE}&sortBy=${sortBy}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch community feed');
      }
      const result = await response.json();
      const posts = result.posts || result;
      
      // Check if we've reached the end of posts
      const isEndOfFeed = posts.length < POSTS_PER_PAGE;
      if (isEndOfFeed && posts.length > 0) {
        setHasReachedEnd(true);
      }
      
      // Track consecutive empty fetches
      if (posts.length === 0) {
        setLastFetchedCount(prev => prev + 1);
        if (lastFetchedCount >= 2) {
          setHasReachedEnd(true);
        }
      } else {
        setLastFetchedCount(0);
      }
      
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
        hasMore: !isEndOfFeed && posts.length === POSTS_PER_PAGE,
        totalCount: posts.length,
        currentOffset: pageParam,
        nextOffset: !isEndOfFeed && posts.length === POSTS_PER_PAGE ? pageParam + POSTS_PER_PAGE : null,
        isEndOfFeed
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore || lastPage.isEndOfFeed || hasReachedEnd) return undefined;
      return allPages.length * POSTS_PER_PAGE;
    },
    initialPageParam: 0,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount unless data is stale
    refetchInterval: false, // Disable automatic refetching
  });

  // Infinite scroll handler with improved throttling and end detection
  const handleScroll = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || hasReachedEnd) return;
    
    const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
    const threshold = document.documentElement.offsetHeight - 1000;
    
    if (scrollPosition >= threshold) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, hasReachedEnd]);

  // Set up scroll listener with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isScrolling = false;
    
    const debouncedHandler = () => {
      if (isScrolling) return;
      isScrolling = true;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleScroll();
        isScrolling = false;
      }, 200);
    };
    
    window.addEventListener('scroll', debouncedHandler, { passive: true });
    return () => {
      window.removeEventListener('scroll', debouncedHandler);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  // Flatten all posts from all pages and deduplicate by ID
  const allPosts = data?.pages?.flatMap(page => page.posts) || [];
  const uniquePosts = allPosts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );

  const handleRefresh = () => {
    setHasReachedEnd(false);
    setLastFetchedCount(0);
    queryClient.invalidateQueries({ queryKey: ['/api/feed/personal'] });
    toast({
      title: "Community feed refreshed",
      description: "Latest posts have been loaded",
    });
  };

  const handlePostCreated = () => {
    setHasReachedEnd(false);
    setLastFetchedCount(0);
    // Refetch the community feed immediately to show new post
    refetch();
    // Also invalidate other feed queries
    queryClient.invalidateQueries({ queryKey: ['/api/feed/personal'] });
    queryClient.invalidateQueries({ queryKey: ['/api/feed/communities'] });
  };

  // Reset end state when sorting changes
  useEffect(() => {
    setHasReachedEnd(false);
    setLastFetchedCount(0);
  }, [sortBy]);

  if (isError) {
    return (
      <Container className="py-8 bg-white">
        <div className="text-center">
          <div className="mb-4">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to load community feed</h2>
            <p className="text-gray-600 mb-4">
              {error?.message || getTranslation("Failed to fetch community feed")}
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {getTranslation("Try Again")}
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="py-6 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 pb-20">
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
                <CreatePost onSuccess={handlePostCreated} />
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
                  {getTranslation("New")}
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
                  {getTranslation("Trending")}
                  {sortBy === 'trending' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-1 bg-black"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <video 
                  src={leopardVideo} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="h-24 w-auto object-contain mx-auto mb-4"
                />
                <p className="text-gray-600">
                  {getTranslation("Thinking")}
                  <span className="inline-flex ml-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </p>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">

              
              {uniquePosts.map((post, index) => (
                <div key={`${post.id}-${index}`}>
                  <PostCard post={post} />
                </div>
              ))}
            </div>

            {/* Load More Indicator */}
            {isFetchingNextPage && (
              <div className="text-center py-8">
                <video 
                  src={leopardVideo} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="h-16 w-auto object-contain mx-auto mb-2"
                />
                <p className="text-sm text-gray-600">
                  {getTranslation("Thinking")}
                  <span className="inline-flex ml-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </p>
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
            </div>
          </div>
        </div>
      </div>
      </Container>
    </>
  );
}