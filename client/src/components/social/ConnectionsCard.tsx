import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { User, UsersRound, UserPlus, UserCheck, Mail, Store, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface ConnectionsCardProps {
  profileId: number;
  profileUsername: string;
  showRecommendations?: boolean;
  isSidebar?: boolean;
  className?: string;
}

export default function ConnectionsCard({
  profileId,
  profileUsername,
  showRecommendations = true,
  isSidebar = false,
  className = "",
}: ConnectionsCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'connections' | 'followers'>('connections');

  // Fetch user's connections
  const {
    data: connections,
    isLoading: isLoadingConnections,
    refetch: refetchConnections,
  } = useQuery({
    queryKey: [`/api/users/${profileUsername}/connections`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${profileUsername}/connections`);
      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }
      return response.json();
    },
  });

  // Fetch user's followers
  const {
    data: followers,
    isLoading: isLoadingFollowers,
    refetch: refetchFollowers,
  } = useQuery({
    queryKey: [`/api/social/followers/${profileId}`],
    queryFn: async () => {
      const response = await fetch(`/api/social/followers/${profileId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch followers");
      }
      return response.json();
    },
  });

  // Fetch recommendations (only for current user's profile)
  const isCurrentUserProfile = currentUser?.id === profileId;
  const {
    data: recommendations,
    isLoading: isLoadingRecommendations,
  } = useQuery({
    queryKey: ["/api/users/recommendations"],
    queryFn: async () => {
      const response = await fetch("/api/users/recommendations");
      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }
      return response.json();
    },
    enabled: showRecommendations && isCurrentUserProfile,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/users/${userId}/connect`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to connect with user");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Connection request sent",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUsername}/connections`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/recommendations"] });
      refetchConnections();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect with user",
        variant: "destructive",
      });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/users/${userId}/connect`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to disconnect from user");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Connection removed",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileUsername}/connections`] });
      refetchConnections();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect from user",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (userId: number) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to connect with users",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    connectMutation.mutate(userId);
  };

  const handleDisconnect = (userId: number) => {
    disconnectMutation.mutate(userId);
  };

  const handleViewProfile = (username: string) => {
    setLocation(`/profile/${username}`);
  };

  const handleSendMessage = (username: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to send messages",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    setLocation(`/messages/${username}`);
  };

  // Check if a user is connected to the current user
  const isConnected = (userId: number) => {
    // This will be implemented when the user schema includes connections
    // For now, we'll check against the fetched connections
    return connections?.some((connection: any) => connection.id === userId);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <UsersRound className="h-5 w-5 text-primary" />
          Connections
          {connections && (
            <Badge variant="outline" className="ml-2">
              {connections.length}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <button 
            className={`flex items-center gap-1 ${activeTab === 'connections' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('connections')}
          >
            <UserCheck className="h-4 w-4" />
            Connections
          </button>
          <button 
            className={`flex items-center gap-1 ${activeTab === 'followers' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('followers')}
          >
            <User className="h-4 w-4" />
            Followers
            {followers && <span className="ml-1">({followers.length})</span>}
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <>
            {isLoadingConnections ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !connections || connections.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-muted-foreground text-sm mb-2">
                  {isCurrentUserProfile
                    ? "You don't have any connections yet"
                    : `${profileUsername} doesn't have any connections yet`}
                </p>
                {isCurrentUserProfile && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation("/members")}
                  >
                    Find People
                  </Button>
                )}
              </div>
            ) : (
              <div className={`space-y-3 ${isSidebar ? "max-h-[220px] overflow-y-auto" : ""}`}>
                {connections.slice(0, isSidebar ? 5 : undefined).map((connection: any) => (
                  <div 
                    key={connection.id} 
                    className="flex items-center justify-between"
                  >
                    <div 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => handleViewProfile(connection.username)}
                    >
                      <Avatar className="h-8 w-8">
                        {connection.avatar ? (
                          <AvatarImage 
                            src={connection.avatar} 
                            alt={connection.name} 
                          />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(connection.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{connection.name}</p>
                        <div className="flex items-center">
                          <p className="text-xs text-muted-foreground">@{connection.username}</p>
                          {connection.isVendor && (
                            <Badge 
                              variant="outline" 
                              className="ml-2 h-4 text-[10px]"
                            >
                              <Store className="h-2 w-2 mr-1" />
                              Vendor
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSendMessage(connection.username)}
                        title="Send Message"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      
                      {isCurrentUserProfile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDisconnect(connection.id)}
                          disabled={disconnectMutation.isPending}
                          title="Remove Connection"
                        >
                          {disconnectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isSidebar && connections.length > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setLocation(`/profile/${profileUsername}`)}
                  >
                    View all {connections.length} connections
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Followers Tab */}
        {activeTab === 'followers' && (
          <>
            {isLoadingFollowers ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !followers || followers.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-muted-foreground text-sm mb-2">
                  {isCurrentUserProfile
                    ? "You don't have any followers yet"
                    : `${profileUsername} doesn't have any followers yet`}
                </p>
                {isCurrentUserProfile && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation("/explore")}
                  >
                    Explore Content
                  </Button>
                )}
              </div>
            ) : (
              <div className={`space-y-3 ${isSidebar ? "max-h-[220px] overflow-y-auto" : ""}`}>
                {followers.slice(0, isSidebar ? 5 : undefined).map((follower: any) => (
                  <div 
                    key={follower.id} 
                    className="flex items-center justify-between"
                  >
                    <div 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => handleViewProfile(follower.username)}
                    >
                      <Avatar className="h-8 w-8">
                        {follower.avatar ? (
                          <AvatarImage 
                            src={follower.avatar} 
                            alt={follower.name} 
                          />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(follower.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{follower.name}</p>
                        <div className="flex items-center">
                          <p className="text-xs text-muted-foreground">@{follower.username}</p>
                          {follower.isVendor && (
                            <Badge 
                              variant="outline" 
                              className="ml-2 h-4 text-[10px]"
                            >
                              <Store className="h-2 w-2 mr-1" />
                              Vendor
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleSendMessage(follower.username)}
                        title="Send Message"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      
                      {isCurrentUserProfile && !isConnected(follower.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleConnect(follower.id)}
                          disabled={connectMutation.isPending}
                          title="Connect"
                        >
                          {connectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isSidebar && followers.length > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => {
                      setLocation(`/profile/${profileUsername}`);
                      // Ensure followers tab is active when navigating to profile
                      setActiveTab('followers');
                    }}
                  >
                    View all {followers.length} followers
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* People you may know section (only for current user) */}
        {showRecommendations && isCurrentUserProfile && (
          <>
            <div className="mt-6 mb-2">
              <h3 className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-2 text-primary" />
                People you may know
              </h3>
            </div>
            
            {isLoadingRecommendations ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !recommendations || recommendations.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  No recommendations available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, isSidebar ? 3 : 5).map((user: any) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between"
                  >
                    <div 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => handleViewProfile(user.username)}
                    >
                      <Avatar className="h-8 w-8">
                        {user.avatar ? (
                          <AvatarImage 
                            src={user.avatar} 
                            alt={user.name} 
                          />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <div className="flex items-center">
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                          {user.isVendor && (
                            <Badge 
                              variant="outline" 
                              className="ml-2 h-4 text-[10px]"
                            >
                              <Store className="h-2 w-2 mr-1" />
                              Vendor
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => handleConnect(user.id)}
                      disabled={connectMutation.isPending}
                    >
                      {connectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-1" />
                      )}
                      Connect
                    </Button>
                  </div>
                ))}
                
                {isSidebar && recommendations.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setLocation("/members")}
                  >
                    View more recommendations
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}