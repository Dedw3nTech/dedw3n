import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users, Globe, Lock, Eye, Info, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitials } from "@/lib/utils";

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortOption, setSortOption] = useState("popular");

  // Fetch all communities
  const { data: communities, isLoading, error } = useQuery({
    queryKey: ["/api/communities"],
    queryFn: async () => {
      const response = await fetch("/api/communities");
      if (!response.ok) {
        throw new Error("Failed to fetch communities");
      }
      return response.json();
    },
  });

  // Fetch user's joined communities (if logged in)
  const { data: joinedCommunities } = useQuery({
    queryKey: ["/api/users/me/communities"],
    queryFn: async () => {
      const response = await fetch("/api/users/me/communities");
      if (!response.ok) {
        throw new Error("Failed to fetch joined communities");
      }
      return response.json();
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  const handleCreateCommunity = () => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    setLocation("/communities/create");
  };

  const handleCommunityClick = (communityId: number) => {
    setLocation(`/communities/${communityId}`);
  };

  // Get visibility icon based on visibility type
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

  // Check if user is a member of a community
  const isUserMember = (communityId: number) => {
    if (!joinedCommunities) return false;
    return joinedCommunities.some((community: any) => community.id === communityId);
  };

  // Filter and sort communities
  const filteredCommunities = communities
    ? communities
        .filter((community: any) => {
          // Filter by search query
          const matchesSearch =
            searchQuery === "" ||
            community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (community.description &&
              community.description.toLowerCase().includes(searchQuery.toLowerCase()));

          // Filter by type
          let matchesFilter = true;
          if (filterType === "joined" && !isUserMember(community.id)) {
            matchesFilter = false;
          } else if (
            filterType === "public" &&
            community.visibility !== "public"
          ) {
            matchesFilter = false;
          } else if (
            filterType === "private" &&
            community.visibility !== "private"
          ) {
            matchesFilter = false;
          }

          return matchesSearch && matchesFilter;
        })
        .sort((a: any, b: any) => {
          // Sort by selected option
          if (sortOption === "popular") {
            return (b.memberCount || 0) - (a.memberCount || 0);
          } else if (sortOption === "newest") {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } else if (sortOption === "alphabetical") {
            return a.name.localeCompare(b.name);
          }
          return 0;
        })
    : [];

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Communities</h1>
          <p className="text-muted-foreground mt-1">
            Discover and join communities based on your interests
          </p>
        </div>
        <Button onClick={handleCreateCommunity}>
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Communities</SelectItem>
              <SelectItem value="joined">My Communities</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <Info className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <h3 className="text-xl font-medium">Error loading communities</h3>
          <p className="text-muted-foreground mt-2">
            Please try again later or refresh the page.
          </p>
        </div>
      ) : filteredCommunities.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-xl font-medium">No communities found</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : filterType === "joined"
              ? "You haven't joined any communities yet"
              : "No communities match your current filters"}
          </p>
          {filterType === "joined" && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setFilterType("all")}
            >
              Browse All Communities
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community: any) => (
            <Card 
              key={community.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCommunityClick(community.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={community.logo || ""} alt={community.name} />
                      <AvatarFallback>
                        {getInitials(community.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      <div className="flex items-center mt-1">
                        <Badge 
                          variant={community.visibility === "public" ? "outline" : "secondary"}
                          className="text-xs flex items-center"
                        >
                          {getVisibilityIcon(community.visibility)}
                          {community.visibility}
                        </Badge>
                        {community.isVerified && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                  {community.description}
                </p>
                
                {community.topics && community.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {community.topics.slice(0, 3).map((topic: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {community.topics.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{community.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                <div className="text-sm flex items-center">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{community.memberCount || 0} members</span>
                </div>
                {isUserMember(community.id) && (
                  <Badge variant="outline" className="bg-primary/10">
                    Joined
                  </Badge>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}