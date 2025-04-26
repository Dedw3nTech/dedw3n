import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { Loader2, Users, Settings, Globe, Lock, Eye, CalendarDays, MessageSquare, BarChart4, PlusCircle } from "lucide-react";

export default function CommunityDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("posts");

  // Fetch community details
  const {
    data: community,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/communities/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch community details");
      }
      return response.json();
    },
  });

  // Fetch community members
  const {
    data: members,
    isLoading: isLoadingMembers,
  } = useQuery({
    queryKey: [`/api/communities/${id}/members`],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${id}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch community members");
      }
      return response.json();
    },
    enabled: !!community,
  });

  // Check if current user is a member
  const currentUserMembership = members?.find(
    (member: any) => member.userId === user?.id
  );

  // Check if current user is the owner
  const isOwner = community?.ownerId === user?.id;

  // Join community mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/communities/${id}/members`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join community");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have joined the community!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/members`] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join community",
        variant: "destructive",
      });
    },
  });

  // Leave community mutation
  const leaveCommunityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "DELETE",
        `/api/communities/${id}/members/${user?.id}`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to leave community");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have left the community",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/members`] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave community",
        variant: "destructive",
      });
    },
  });

  const handleJoinCommunity = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to join a community",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    joinCommunityMutation.mutate();
  };

  const handleLeaveCommunity = () => {
    if (isOwner) {
      toast({
        title: "Cannot leave community",
        description: "As the owner, you cannot leave this community. Transfer ownership first.",
        variant: "destructive",
      });
      return;
    }

    leaveCommunityMutation.mutate();
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="h-4 w-4 mr-1" />;
      case "private":
        return <Lock className="h-4 w-4 mr-1" />;
      case "secret":
        return <Eye className="h-4 w-4 mr-1" />;
      default:
        return <Globe className="h-4 w-4 mr-1" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl text-red-500 mb-4">Error</h1>
        <p>Failed to load community. Please try again later.</p>
        <Button 
          onClick={() => setLocation("/communities")} 
          className="mt-4"
        >
          Back to Communities
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Community header */}
      <div className="bg-card rounded-lg p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{community.name}</h1>
              <Badge 
                variant={community.visibility === "public" ? "outline" : "secondary"}
                className="flex items-center"
              >
                {getVisibilityIcon(community.visibility)}
                {community.visibility}
              </Badge>
              {community.isVerified && (
                <Badge variant="default">Verified</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              <Users className="h-4 w-4 inline mr-1" />
              {community.memberCount || 0} members
            </p>
          </div>
          
          <div className="flex gap-2">
            {isOwner && (
              <Button 
                variant="outline" 
                onClick={() => setLocation(`/communities/${id}/manage`)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
            
            {!currentUserMembership ? (
              <Button 
                onClick={handleJoinCommunity}
                disabled={joinCommunityMutation.isPending}
              >
                {joinCommunityMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-2" />
                )}
                Join Community
              </Button>
            ) : !isOwner && (
              <Button 
                variant="outline" 
                onClick={handleLeaveCommunity}
                disabled={leaveCommunityMutation.isPending}
              >
                {leaveCommunityMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  "Leave Community"
                )}
              </Button>
            )}
          </div>
        </div>
        
        {community.description && (
          <div className="mt-4">
            <p>{community.description}</p>
          </div>
        )}
        
        {community.topics && community.topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {community.topics.map((topic: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="posts">
            <MessageSquare className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="events">
            <CalendarDays className="h-4 w-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          {currentUserMembership && (
            <TabsTrigger value="analytics">
              <BarChart4 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Community Posts</CardTitle>
              <CardDescription>
                Share and discuss topics with other members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentUserMembership ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground mb-4">
                    No posts yet. Be the first to post in this community!
                  </p>
                  <Button>Create Post</Button>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    Join this community to see and create posts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Community Events</CardTitle>
              <CardDescription>
                Upcoming meetings, workshops, and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">
                  No upcoming events scheduled.
                </p>
                {currentUserMembership && (
                  <Button>Create Event</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Community Members</CardTitle>
              <CardDescription>
                People who are part of this community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : members && members.length > 0 ? (
                <ul className="space-y-4">
                  {members.map((member: any) => (
                    <li key={member.id} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage 
                          src={member.user?.avatar || ""} 
                          alt={member.user?.name || "Member"} 
                        />
                        <AvatarFallback>
                          {getInitials(member.user?.name || "Member")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.user?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{member.user?.username}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Badge variant="outline">
                          {member.role === "owner" ? "Owner" : "Member"}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No members found.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {currentUserMembership && (
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Community Analytics</CardTitle>
                <CardDescription>
                  Insights and statistics about this community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    Analytics will be available once there's more activity in the community.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {community.rules && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{community.rules}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}