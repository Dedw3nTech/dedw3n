import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Search, Plus, Users, Lock, Globe, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CommunitiesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("");
  
  // Fetch all communities with optional filters
  const {
    data: communities,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/communities", visibilityFilter],
    queryFn: async () => {
      let url = "/api/communities";
      const params = new URLSearchParams();
      
      if (visibilityFilter) {
        params.append("visibility", visibilityFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch communities");
      }
      return response.json();
    },
  });

  // Filter communities by search query
  const filteredCommunities = communities?.filter(
    (community: any) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (community.description && community.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateCommunity = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a community",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }
    
    setLocation("/communities/create");
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Communities</h1>
        <Button onClick={handleCreateCommunity}>
          <Plus className="h-4 w-4 mr-2" /> Create Community
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All communities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All communities</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          <p>Failed to load communities. Please try again later.</p>
        </div>
      ) : filteredCommunities?.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>No communities found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities?.map((community: any) => (
            <Card key={community.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{community.name}</CardTitle>
                  <Badge 
                    variant={community.visibility === "public" ? "outline" : "secondary"}
                    className="flex items-center"
                  >
                    {getVisibilityIcon(community.visibility)}
                    {community.visibility}
                  </Badge>
                </div>
                <CardDescription className="flex items-center mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  {community.memberCount || 0} members
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">
                  {community.description || "No description provided."}
                </p>
                {community.topics && community.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {community.topics.map((topic: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full"
                >
                  <Link to={`/communities/${community.id}`}>View Community</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}