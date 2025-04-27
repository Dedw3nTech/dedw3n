import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lock, 
  Video, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Crown, 
  Sparkles,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import MembershipPayment from "./MembershipPayment";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type ContentType = "video" | "article" | "image" | "audio";

interface ExclusiveContentProps {
  communityId: number;
}

interface ContentItem {
  id: number;
  title: string;
  description: string;
  contentType: ContentType;
  thumbnailUrl: string;
  tierId: number;
  tierName: string;
  createdAt: string;
  creatorId: number;
  creatorName: string;
  creatorAvatar: string | null;
}

interface ContentSection {
  title: string;
  items: ContentItem[];
}

const ContentPreview = ({ item, onJoin }: { item: ContentItem, onJoin: (tierId: number) => void }) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="aspect-video bg-muted relative overflow-hidden">
          <img 
            src={item.thumbnailUrl || "/placeholder-content.jpg"} 
            alt={item.title}
            className="object-cover w-full h-full opacity-40 blur-sm"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/60 text-white">
            <Lock className="h-12 w-12 mb-2 text-primary" />
            <p className="text-lg font-medium text-center">Exclusive Content</p>
            <p className="text-sm opacity-80 text-center mb-4">Join {item.tierName} to unlock</p>
            <Button 
              onClick={() => onJoin(item.tierId)} 
              variant="premium" 
              size="sm"
              className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-700"
            >
              <Crown className="mr-2 h-4 w-4" />
              Join {item.tierName}
            </Button>
          </div>
        </div>
        <Badge 
          className="absolute top-2 right-2" 
          variant={
            item.contentType === "video" ? "default" : 
            item.contentType === "article" ? "outline" : 
            item.contentType === "image" ? "secondary" : 
            "destructive"
          }
        >
          {item.contentType === "video" && <Video className="h-3 w-3 mr-1" />}
          {item.contentType === "article" && <FileText className="h-3 w-3 mr-1" />}
          {item.contentType === "image" && <ImageIcon className="h-3 w-3 mr-1" />}
          {item.contentType === "audio" && <Music className="h-3 w-3 mr-1" />}
          {item.contentType}
        </Badge>
      </div>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
        </div>
        <div className="flex items-center mt-1">
          <Avatar className="h-5 w-5 mr-1">
            <AvatarImage src={item.creatorAvatar || ""} />
            <AvatarFallback className="text-xs">{item.creatorName?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <CardDescription className="text-xs">{item.creatorName}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-2">
        <p className="text-sm line-clamp-2 text-muted-foreground">{item.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground">
        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        <Badge variant="outline" className="text-xs">
          <Crown className="h-3 w-3 mr-1 text-amber-500" />
          {item.tierName}
        </Badge>
      </CardFooter>
    </Card>
  );
};

const ContentGrid = ({ items, onJoin }: { items: ContentItem[], onJoin: (tierId: number) => void }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ContentPreview key={item.id} item={item} onJoin={onJoin} />
      ))}
    </div>
  );
};

const ExclusiveContent: React.FC<ExclusiveContentProps> = ({ communityId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("featured");

  const { data: sections, isLoading } = useQuery({
    queryKey: [`/api/communities/${communityId}/exclusive-content`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/communities/${communityId}/exclusive-content`);
        return await res.json();
      } catch (error) {
        console.error("Error fetching exclusive content:", error);
        return {
          featured: [],
          recentContent: [],
          byContentType: {
            video: [],
            article: [],
            image: [],
            audio: []
          }
        };
      }
    }
  });

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

  const { data: userMembership } = useQuery({
    queryKey: [`/api/communities/${communityId}/memberships/me`],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await apiRequest("GET", `/api/communities/${communityId}/memberships/me`);
        if (!res.ok) {
          if (res.status === 404) {
            // Not a member, but not an error
            return null;
          }
          throw new Error("Failed to fetch membership");
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching user membership:", error);
        return null;
      }
    },
    enabled: !!user
  });

  const handleJoin = (tierId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join this membership tier",
        variant: "destructive",
      });
      return;
    }

    setSelectedTierId(tierId);
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
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const selectedTier = tiers?.find(tier => tier.id === selectedTierId);
  
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
          Exclusive Content
        </h2>
        <p className="text-muted-foreground">
          Premium content available exclusively to community members with paid subscriptions.
        </p>
      </div>

      <Tabs 
        defaultValue="featured" 
        className="space-y-4"
        value={currentTab}
        onValueChange={setCurrentTab}
      >
        <TabsList>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="others">Other Media</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-4">
          {sections?.featured?.length > 0 ? (
            <ContentGrid items={sections.featured} onJoin={handleJoin} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Crown className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No featured exclusive content</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Featured premium content will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {sections?.recentContent?.length > 0 ? (
            <ContentGrid items={sections.recentContent} onJoin={handleJoin} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No recent exclusive content</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Recent premium content will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          {sections?.byContentType?.video?.length > 0 ? (
            <ContentGrid items={sections.byContentType.video} onJoin={handleJoin} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No exclusive videos</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Premium video content will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          {sections?.byContentType?.article?.length > 0 ? (
            <ContentGrid items={sections.byContentType.article} onJoin={handleJoin} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No exclusive articles</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Premium article content will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="others" className="space-y-4">
          {(sections?.byContentType?.image?.length > 0 || sections?.byContentType?.audio?.length > 0) ? (
            <ContentGrid 
              items={[
                ...(sections?.byContentType?.image || []),
                ...(sections?.byContentType?.audio || [])
              ]} 
              onJoin={handleJoin} 
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Music className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No other exclusive media</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Other premium content types will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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

export default ExclusiveContent;