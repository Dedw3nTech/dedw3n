import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export interface Video {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  videoType: 'short' | 'story' | 'live' | 'regular' | 'commercial';
  duration: number | null;
  views: number;
  likes: number;
  shares: number;
  status: 'processing' | 'published' | 'draft' | 'archived';
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoEngagement {
  id: number;
  videoId: number;
  userId: number;
  type: 'view' | 'like' | 'share' | 'comment';
  data: Record<string, any> | null;
  createdAt: Date;
}

export interface VideoAnalytics {
  id: number;
  videoId: number;
  totalViews: number;
  uniqueViewers: number;
  averageWatchTime: number;
  completionRate: number;
  engagementRate: number;
  demographics: Record<string, any>;
  viewsByCountry: Record<string, number>;
  updatedAt: Date;
}

export function useVideos() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Get trending videos
  const { 
    data: trendingVideos = [], 
    isLoading: isLoadingTrending,
    refetch: refetchTrending
  } = useQuery<Video[]>({
    queryKey: ['/api/videos/trending'],
    enabled: true,
  });

  // Get user videos
  const { 
    data: userVideos = [], 
    isLoading: isLoadingUserVideos,
    refetch: refetchUserVideos
  } = useQuery<Video[]>({
    queryKey: ['/api/videos/user', user?.id],
    enabled: !!user,
  });

  // Get video by ID
  const getVideo = useCallback((videoId: number) => {
    return useQuery<Video>({
      queryKey: ['/api/videos', videoId],
      enabled: !!videoId,
    });
  }, []);

  // Get videos by type
  const getVideosByType = useCallback((videoType: string) => {
    return useQuery<Video[]>({
      queryKey: ['/api/videos/type', videoType],
      enabled: !!videoType,
    });
  }, []);

  // Create video mutation
  const createVideoMutation = useMutation({
    mutationFn: async (videoData: Partial<Video> & { videoFile: File }) => {
      // First, create video entry with metadata
      const { videoFile, ...videoMetadata } = videoData;
      
      const response = await apiRequest(
        'POST', 
        '/api/videos', 
        videoMetadata
      );
      
      const newVideo = await response.json();
      
      // Then upload the actual video file
      if (videoFile && newVideo.id) {
        const formData = new FormData();
        formData.append('video', videoFile);
        
        // Create XHR request to track upload progress
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setVideoUploadProgress(progress);
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(newVideo);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('An error occurred during the upload'));
          });
          
          xhr.open('POST', `/api/videos/${newVideo.id}/upload`);
          xhr.send(formData);
        });
      }
      
      return newVideo;
    },
    onSuccess: () => {
      toast({
        title: 'Video created!',
        description: 'Your video has been uploaded successfully.',
      });
      
      // Reset progress
      setVideoUploadProgress(0);
      
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/videos/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos/trending'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      
      // Reset progress
      setVideoUploadProgress(0);
    },
  });

  // Like/Unlike video
  const likeVideoMutation = useMutation({
    mutationFn: async ({ videoId, action }: { videoId: number; action: 'like' | 'unlike' }) => {
      const response = await apiRequest(
        'POST', 
        `/api/videos/${videoId}/${action}`, 
        {}
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos/trending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos/user', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Action failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Share video
  const shareVideoMutation = useMutation({
    mutationFn: async ({ videoId, platform }: { videoId: number; platform: string }) => {
      const response = await apiRequest(
        'POST', 
        `/api/videos/${videoId}/share`, 
        { platform }
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Video shared!',
        description: 'The video has been shared successfully.',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/videos', variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos/trending'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Share failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // View video (register view)
  const viewVideoMutation = useMutation({
    mutationFn: async ({ videoId, watchTimeSeconds }: { videoId: number; watchTimeSeconds: number }) => {
      const response = await apiRequest(
        'POST', 
        `/api/videos/${videoId}/view`, 
        { watchTimeSeconds }
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', variables.videoId] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos/trending'] });
    },
  });

  return {
    // Data
    trendingVideos,
    userVideos,
    videoUploadProgress,
    
    // Loading states
    isLoadingTrending,
    isLoadingUserVideos,
    
    // Actions
    createVideoMutation,
    likeVideoMutation,
    shareVideoMutation,
    viewVideoMutation,
    
    // Helper functions
    getVideo,
    getVideosByType,
    refetchTrending,
    refetchUserVideos,
  };
}