import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Heart, ShoppingBag, MapPin, Calendar, UserPlus } from "lucide-react";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  isVendor: boolean | null;
  role: string;
  location: string | null;
  website: string | null;
  isOpenToDate: boolean | null;
  createdAt: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Members() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users/public"],
  });

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.bio && user.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Members</h1>
          <p className="text-muted-foreground">
            Discover and connect with members of our community
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search members by name, username, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="text-2xl font-bold">{users.length}</h3>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="text-2xl font-bold">
                {users.filter(user => user.isVendor).length}
              </h3>
              <p className="text-sm text-muted-foreground">Vendors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="text-2xl font-bold">
                {users.filter(user => user.isOpenToDate).length}
              </h3>
              <p className="text-sm text-muted-foreground">Open to Date</p>
            </CardContent>
          </Card>
        </div>

        {/* Members Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? "No members found" : "No members yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Try adjusting your search terms to find members."
                : "Be the first to join our community!"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-16 w-16">
                      {user.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : null}
                      <AvatarFallback className="text-lg">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-blue-600 text-sm">@{user.username}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.isVendor && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                            Vendor
                          </Badge>
                        )}
                        {user.isOpenToDate && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-600">
                            Open to Date
                          </Badge>
                        )}
                        {user.role === 'admin' && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {user.bio}
                    </p>
                  )}

                  {/* Additional Info */}
                  <div className="space-y-2 mb-4">
                    {user.location && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {user.location}
                      </div>
                    )}
                    {user.createdAt && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full"
                    onClick={() => setLocation(`/profile/${user.username}`)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="text-center mt-8 text-sm text-muted-foreground">
            Showing {filteredUsers.length} of {users.length} members
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}
      </div>
    </div>
  );
}