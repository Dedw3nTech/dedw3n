import { useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { PremiumVideoPaywall } from '@/components/video/PremiumVideoPaywall';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PurchasedVideos } from '@/components/video/PurchasedVideos';
import { CreatorVideoRevenue } from '@/components/video/CreatorVideoRevenue';
import { AlertCircle, ArrowLeft, Loader2, Play } from 'lucide-react';

export default function PremiumVideoPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const videoId = id ? parseInt(id) : 0;
  
  // Fetch video details
  const { data: video, isLoading, error } = useQuery({
    queryKey: [`/api/videos/${videoId}`],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/videos/${videoId}`);
      return res.json();
    },
    enabled: !!videoId,
  });
  
  // Check video access
  const { data: accessData } = useQuery({
    queryKey: [`/api/videos/${videoId}/access`],
    queryFn: async () => {
      if (!user || !videoId) return { hasAccess: false };
      const res = await apiRequest('GET', `/api/videos/${videoId}/access`);
      return res.json();
    },
    enabled: !!user && !!videoId,
    onSuccess: (data) => {
      if (data?.hasAccess) {
        setHasAccess(true);
      }
    }
  });

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container max-w-6xl py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/social')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to feed
        </Button>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Video Not Found</h2>
          <p className="text-muted-foreground mb-6">The video you're looking for doesn't exist or may have been removed</p>
          <Button onClick={() => navigate('/social')}>
            Return to Feed
          </Button>
        </div>
      </div>
    );
  }

  // If not viewing a specific video, show the premium dashboard
  if (!videoId) {
    return (
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-6">Premium Content</h1>
        
        <Tabs defaultValue="purchased">
          <TabsList className="mb-6">
            <TabsTrigger value="purchased">My Purchases</TabsTrigger>
            {user?.isVendor && <TabsTrigger value="revenue">My Revenue</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="purchased">
            <PurchasedVideos />
          </TabsContent>
          
          {user?.isVendor && (
            <TabsContent value="revenue">
              <CreatorVideoRevenue />
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  }

  // Display video content or paywall
  return (
    <div className="container max-w-6xl py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate('/social')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to feed
      </Button>
      
      <div className="flex flex-col gap-6">
        {/* Video player area */}
        <div className="relative w-full bg-black aspect-video rounded-lg overflow-hidden">
          {(hasAccess || accessData?.hasAccess || !video.isPremium) ? (
            // Video content (accessible)
            <>
              {video.videoUrl ? (
                <video 
                  src={video.videoUrl} 
                  controls
                  poster={video.thumbnailUrl}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Play className="h-16 w-16 text-white/50 mb-4" />
                  <p className="text-white/70">Video playback not available</p>
                </div>
              )}
            </>
          ) : (
            // Premium paywall
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <PremiumVideoPaywall
                videoId={video.id}
                title={video.title || 'Premium Video'}
                creator={video.creatorName || 'Creator'}
                price={video.price || 4.99}
                thumbnailUrl={video.thumbnailUrl}
                onPurchaseComplete={() => setHasAccess(true)}
              />
            </div>
          )}
        </div>
        
        {/* Video information */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{video.title || 'Untitled Video'}</h1>
          {video.creatorName && (
            <Link href={`/profile/${video.userId}`}>
              <a className="text-primary hover:underline">{video.creatorName}</a>
            </Link>
          )}
          
          {video.description && (
            <p className="mt-4 text-muted-foreground">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}