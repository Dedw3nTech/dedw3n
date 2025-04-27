import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, AlertCircle, PoundSterling, Users, Video } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface VideoRevenue {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  price: number;
  revenue: number;
  purchaseCount?: number;
}

interface RevenueStats {
  totalRevenue: number;
  premiumVideoCount: number;
  premiumVideos: VideoRevenue[];
}

export function CreatorVideoRevenue() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/creator/video-revenue'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/creator/video-revenue');
      return res.json();
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creator Revenue</CardTitle>
          <CardDescription>Sign in to view your revenue statistics</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">You need to be logged in to view your revenue</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creator Revenue</CardTitle>
          <CardDescription>Your premium content earnings</CardDescription>
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
          <CardTitle>Creator Revenue</CardTitle>
          <CardDescription>Your premium content earnings</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40 text-center p-4">
          <div>
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-muted-foreground">An error occurred while loading your revenue data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data as RevenueStats;
  
  // Calculate the highest revenue for progress bars
  const maxRevenue = stats.premiumVideos.length > 0 
    ? Math.max(...stats.premiumVideos.map(video => video.revenue))
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Creator Revenue</CardTitle>
        <CardDescription>Your premium content earnings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <PoundSterling className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-2xl font-bold">£{stats.totalRevenue.toFixed(2)}</h3>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <Video className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-2xl font-bold">{stats.premiumVideoCount}</h3>
              <p className="text-sm text-muted-foreground">Premium Videos</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="text-2xl font-bold">
                {stats.premiumVideos.reduce((sum, video) => sum + (video.purchaseCount || 0), 0)}
              </h3>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
            </CardContent>
          </Card>
        </div>
        
        {stats.premiumVideos.length === 0 ? (
          <div className="text-center py-10">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-2">You don't have any revenue from premium videos yet</p>
            <p className="text-sm text-muted-foreground">Set your videos as premium to start earning revenue</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="hidden md:table-cell">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.premiumVideos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell className="font-medium">{video.title}</TableCell>
                  <TableCell>£{video.price.toFixed(2)}</TableCell>
                  <TableCell>£{video.revenue.toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="w-full">
                      <Progress 
                        value={maxRevenue > 0 ? (video.revenue / maxRevenue) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default CreatorVideoRevenue;