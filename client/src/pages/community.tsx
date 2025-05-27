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
    queryKey: ['/api/feed/personal', refreshKey],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(`/api/feed/personal?offset=${pageParam}&limit=${POSTS_PER_PAGE}`);
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
  });

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop
      >= document.documentElement.offsetHeight - 1000
    ) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Set up scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Flatten all posts from all pages
  const allPosts = data?.pages?.flatMap(page => page.posts) || [];

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
    toast({
      title: "Community feed refreshed",
      description: "Latest posts have been loaded",
    });
  };

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-white rounded-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Community</h1>
                <p className="text-sm text-gray-600">
                  See what everyone in our community is sharing
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-3">
            {/* Create Post Section */}
            {user && (
              <div className="mb-6" data-create-post>
                <CreatePost />
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-gray-600">Loading community posts...</p>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {allPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                />
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
            {!hasNextPage && allPosts.length > 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>You've seen all community posts</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && allPosts.length === 0 && (
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

          {/* Advertisement Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">



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
            <div className="w-full h-16 md:h-20 lg:h-24 overflow-hidden cursor-pointer">
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