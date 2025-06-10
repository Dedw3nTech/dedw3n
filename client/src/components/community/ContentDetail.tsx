import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock, Video, FileText, Image as ImageIcon, Music, Crown, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import MembershipPayment from "./MembershipPayment";
import { format } from "date-fns";

interface ContentDetailProps {
  contentId: number;
  communityId: number;
  onBack: () => void;
}

const ContentDetail: React.FC<ContentDetailProps> = ({ contentId, communityId, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Fetch the content item
  const { data: content, isLoading, error } = useQuery({
    queryKey: [`/api/community-content/${contentId}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/community-content/${contentId}`);
        if (!res.ok) {
          if (res.status === 403) {
            const errorData = await res.json();
            throw new Error(errorData.message || "You don't have access to this content");
          } else if (res.status === 404) {
            throw new Error("Content not found");
          }
          throw new Error("Failed to fetch content");
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching content detail:", error);
        throw error;
      }
    },
  });

  // Fetch membership tiers for the community
  const { data: tiers } = useQuery({
    queryKey: [`/api/communities/${communityId}/membership-tiers`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/communities/${communityId}/membership-tiers`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching membership tiers:", error);
        return [];
      }
    }
  });

  const handleJoin = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join this membership tier",
        variant: "destructive",
      });
      return;
    }

    if (!content?.requiredTierId) {
      toast({
        title: "Error",
        description: "Could not determine the required membership tier",
        variant: "destructive",
      });
      return;
    }

    setShowJoinModal(true);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Welcome to your new membership tier! You now have access to exclusive content.",
    });
    setShowJoinModal(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-4/5 mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to load content";
    const isAccessError = errorMessage.includes("access") || errorMessage.includes("upgrade");
    
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {isAccessError ? "Premium Content" : "Error"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            {isAccessError && content?.requiredTierId && (
              <Button 
                onClick={handleJoin}
                className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700"
              >
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Membership
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-muted-foreground mb-4 text-6xl">😕</div>
            <h3 className="text-xl font-medium mb-2">Content Not Found</h3>
            <p className="text-muted-foreground">
              The content you're looking for is not available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contentTypeIcon = {
    video: <Video className="h-4 w-4 mr-1" />,
    article: <FileText className="h-4 w-4 mr-1" />,
    image: <ImageIcon className="h-4 w-4 mr-1" />,
    audio: <Music className="h-4 w-4 mr-1" />
  }[content.contentType];

  const selectedTier = tiers?.find(tier => tier.id === content.requiredTierId);

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{content.title}</CardTitle>
              <div className="flex items-center mt-2 space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={content.creatorAvatar || ""} />
                  <AvatarFallback>{content.creatorName?.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <CardDescription>
                  {content.creatorName} • {format(new Date(content.createdAt), 'MMM d, yyyy')}
                </CardDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Badge variant="outline" className="flex items-center">
                <Crown className="h-3 w-3 mr-1 text-amber-500" />
                {content.tierName}
              </Badge>
              <Badge 
                variant={
                  content.contentType === "video" ? "default" : 
                  content.contentType === "article" ? "outline" : 
                  content.contentType === "image" ? "secondary" : 
                  "destructive"
                }
                className="flex items-center"
              >
                {contentTypeIcon}
                {content.contentType}
              </Badge>
              {content.isFeatured && (
                <Badge variant="secondary">Featured</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Media content based on type */}
          <div className="overflow-hidden rounded-md">
            {content.contentType === "video" && content.videoUrl && (
              <video 
                src={content.videoUrl} 
                controls 
                poster={content.thumbnailUrl}
                className="w-full aspect-video object-cover bg-muted"
              />
            )}
            {content.contentType === "image" && content.imageUrl && (
              <img 
                src={content.imageUrl} 
                alt={content.title}
                className="w-full object-cover bg-muted"
              />
            )}
            {content.contentType === "audio" && content.audioUrl && (
              <div className="p-4 bg-muted rounded-md">
                <audio 
                  src={content.audioUrl} 
                  controls 
                  className="w-full"
                />
                {content.thumbnailUrl && (
                  <img 
                    src={content.thumbnailUrl} 
                    alt={content.title}
                    className="w-full mt-4 rounded-md"
                  />
                )}
              </div>
            )}
          </div>
          
          {/* Description */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p>{content.description}</p>
            
            {/* Article content */}
            {content.contentType === "article" && content.content && (
              <div dangerouslySetInnerHTML={{ __html: content.content }} />
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center text-sm text-muted-foreground space-x-4 border-t pt-4">
            <span>{content.viewCount || 0} views</span>
            <span>{content.likeCount || 0} likes</span>
            <span>{content.commentCount || 0} comments</span>
          </div>
        </CardContent>
      </Card>
      
      {showJoinModal && selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Join {selectedTier.name}</CardTitle>
              <CardDescription>
                Subscribe to gain access to exclusive content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MembershipPayment 
                tier={selectedTier}
                communityId={communityId}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowJoinModal(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ContentDetail;