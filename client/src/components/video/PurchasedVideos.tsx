import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Video, AlertCircle } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VideoPurchase {
  id: number;
  videoId: number;
  amount: number;
  createdAt: string;
  paymentMethod: string;
  video: {
    id: number;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    userId: number;
  };
}

export function PurchasedVideos() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/user/video-purchases'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/video-purchases');
      return res.json();
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchased Premium Content</CardTitle>
          <CardDescription>Sign in to view your purchased content</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">You need to be logged in to view your purchases</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchased Premium Content</CardTitle>
          <CardDescription>Your premium video library</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchased Premium Content</CardTitle>
          <CardDescription>Your premium video library</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40 text-center p-4">
          <div>
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-muted-foreground">An error occurred while loading your purchases</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const purchases = data as VideoPurchase[];

  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchased Premium Content</CardTitle>
          <CardDescription>Your premium video library</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40 text-center">
          <div>
            <Video className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">You haven't purchased any premium content yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchased Premium Content</CardTitle>
        <CardDescription>Your premium video library</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden">
                <div className="relative">
                  <AspectRatio ratio={16 / 9}>
                    {purchase.video.thumbnailUrl ? (
                      <img
                        src={purchase.video.thumbnailUrl}
                        alt={purchase.video.title}
                        className="object-cover w-full h-full rounded-t-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center rounded-t-md">
                        <Video className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </AspectRatio>
                  <Badge className="absolute top-2 right-2 bg-primary">Premium</Badge>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-medium text-lg leading-tight mb-1">{purchase.video.title}</h3>
                  {purchase.video.description && (
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{purchase.video.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>
                      Purchased {formatDistance(new Date(purchase.createdAt), new Date(), { addSuffix: true })}
                    </span>
                    <span className="capitalize">{purchase.paymentMethod}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default PurchasedVideos;