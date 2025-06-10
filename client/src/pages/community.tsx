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
import { SidebarAdCard } from "@/components/SidebarAdCard";
import { ProfileSideCard } from "@/components/ProfileSideCard";
import { AdPostCard } from "@/components/AdPostCard";

import campaignImage from "@assets/Copy of Copy of Pre Launch Campaign  SELL (1).png";
import { useLocation } from "wouter";

// Community-specific promotional images
import communityTopPromo from "@assets/Dedw3n Business commHeader.png";
import communityBottomPromo from "@assets/Dedw3n comm Footer.png";
import communityMidPromo from "@assets/Dedw3n Business II (1).png";

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

function CommunityMidPromoSection() {
  return null;
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
  const [isAdVisible, setIsAdVisible] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'trending' | 'popular' | 'following' | 'region' | 'country' | 'city'>('new');
  const [searchTerm, setSearchTerm] = useState("");

  // Master Translation System - Community Page Mega-Batch (62 texts)
  const communityTexts = useMemo(() => [
    // Page Headers & Meta (4 texts)
    "Dedwen Community - Connect and Share", "Join the Dedwen Community",
    "Failed to fetch community feed", "Community Feed",
    
    // Navigation & Sorting (8 texts)
    "New", "Trending", "Popular", "Following", "My Region", "My Country", "My City", "Try Again",
    
    // Loading States (6 texts)
    "Loading community posts...", "Loading more posts...", "Refresh Feed",
    "You've reached the end!", "Check back later for new content or try refreshing to see if there are any updates.",
    "You've seen all available posts in the community feed.",
    
    // Empty States & CTAs (6 texts)
    "No posts yet", "Be the first to share something with the community!",
    "Create First Post", "Refresh", "Create Post", "Share your thoughts",
    
    // Post Actions & Interactions (12 texts)
    "Like", "Comment", "Share", "Save", "Report", "Edit Post", "Delete Post",
    "Copy Link", "Hide Post", "Follow", "Unfollow", "Block User",
    
    // Community Features (8 texts)
    "Community Guidelines", "Events", "Groups", "Members", "Discussions",
    "Announcements", "Local Posts", "Global Posts",
    
    // Status Messages (6 texts)
    "Post created successfully", "Failed to create post", "Post deleted",
    "Content reported", "User blocked", "Following user",
    
    // Advertisement Sections (4 texts)
    "Sponsored Content", "Advertisement", "Promoted Post", "Featured Content",
    
    // Content Moderation (4 texts)
    "Inappropriate Content", "Spam", "Harassment", "Submit Report",
    
    // Time & Date (4 texts)
    "Just now", "minutes ago", "hours ago", "days ago"
  ], []);

  const { translations, isLoading: translationsLoading } = useMasterBatchTranslation(communityTexts);
  
  // Extract translations with descriptive variable names
  const [
    // Page Headers & Meta
    communityAltText, joinCommunityAltText, fetchErrorText, communityFeedText,
    
    // Navigation & Sorting
    newText, trendingText, popularText, followingText, myRegionText, myCountryText, myCityText, tryAgainText,
    
    // Loading States
    loadingPostsText, loadingMoreText, refreshFeedText, reachedEndText, checkBackLaterText, seenAllPostsText,
    
    // Empty States & CTAs
    noPostsText, firstPostPromptText, createFirstPostText, refreshText, createPostText, shareThoughtsText,
    
    // Post Actions & Interactions
    likeText, commentText, shareText, saveText, reportText, editPostText, deletePostText,
    copyLinkText, hidePostText, followText, unfollowText, blockUserText,
    
    // Community Features
    guidelinesText, eventsText, groupsText, membersText, discussionsText,
    announcementsText, localPostsText, globalPostsText,
    
    // Status Messages
    postCreatedText, postFailedText, postDeletedText, contentReportedText, userBlockedText, followingUserText,
    
    // Advertisement Sections
    sponsoredText, advertisementText, promotedPostText, featuredContentText,
    
    // Content Moderation
    inappropriateText, spamText, harassmentText, submitReportText,
    
    // Time & Date
    justNowText, minutesAgoText, hoursAgoText, daysAgoText
  ] = translations || communityTexts;

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
    queryClient.invalidateQueries({ queryKey: ['/api/feed/personal'] });
  };

  // Reset end state when sorting changes
  useEffect(() => {
    setHasReachedEnd(false);
    setLastFetchedCount(0);
  }, [sortBy]);

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
    <>
      <Container className="py-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Community Advertisement */}
          <CommunityTopPromoSection altText={communityAltText} />

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
                  {newText}
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
                  {trendingText}
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
                  {popularText}
                </button>
                <button
                  onClick={() => setSortBy('following')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'following' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >
                  {followingText}
                </button>
                <button
                  onClick={() => setSortBy('region')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'region' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >
                  {myRegionText}
                </button>
                <button
                  onClick={() => setSortBy('country')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'country' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >
                  {myCountryText}
                </button>
                <button
                  onClick={() => setSortBy('city')}
                  className={`transition-colors duration-200 ${
                    sortBy === 'city' 
                      ? 'text-black font-medium' 
                      : 'hover:text-gray-800'
                  }`}
                >
                  {myCityText}
                </button>
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
                  {/* Insert community mid advertisement every 6 posts */}
                  {(index + 1) % 6 === 0 && (
                    <div className="mt-6">
                      <CommunityMidPromoSection />
                    </div>
                  )}
                  {/* Insert regular advertisement every 4 posts (offset from mid promo) */}
                  {(index + 1) % 4 === 0 && (index + 1) % 6 !== 0 && (
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
                <p className="text-sm text-gray-600">{loadingMoreText}</p>
              </div>
            )}

            {/* End of Feed */}
            {(!hasNextPage || hasReachedEnd) && uniquePosts.length > 0 && (
              <div className="text-center py-8">
                <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-[14px] font-semibold text-gray-900">
                      {reachedEndText}
                    </h3>
                    <Button 
                      onClick={handleRefresh}
                      variant="ghost"
                      size="sm"
                      className="inline-flex items-center gap-1 p-1 h-auto"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {refreshFeedText}
                    </Button>
                  </div>
                  <p className="text-[12px] text-gray-600">
                    {seenAllPostsText} {checkBackLaterText}
                  </p>
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
              <VideoDisplayCard 
                marketType="b2c" 
                title="Dedw3n Community Features" 
                autoPlay={true}
                showControls={true}
              />
              <TrendingCategoriesCard />

              <LatestProductsCard />
              <PopularProductsCard />
              <SidebarAdCard />
            </div>
          </div>
        </div>

        {/* Bottom Community Advertisement */}
        <CommunityBottomPromoSection altText={joinCommunityAltText} />
      </div>
      </Container>
    </>
  );
}