import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, UserCheck, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface SearchUser {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  isVendor: boolean | null;
  role: string;
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  });

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['/api/users/search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedQuery.length > 0
  });

  const handleUserClick = (username: string) => {
    setLocation(`/profile/${username}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Users</h1>
        <p className="text-gray-600">Find and connect with other users and vendors on the platform</p>
      </div>

      {/* Search Input */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search by username, name, or bio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-black rounded-lg"
        />
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {isLoading && debouncedQuery && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Searching users...</p>
          </div>
        )}

        {!isLoading && debouncedQuery && searchResults.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No users found</h3>
            <p className="text-gray-500">Try searching with different keywords</p>
          </div>
        )}

        {!debouncedQuery && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Start searching</h3>
            <p className="text-gray-500">Enter a username, name, or keywords to find users</p>
          </div>
        )}

        {searchResults.map((user: SearchUser) => (
          <Card 
            key={user.id} 
            className="hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-gray-300"
            onClick={() => handleUserClick(user.username)}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-lg font-semibold">
                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{user.name}</h3>
                    <p className="text-blue-600 font-medium">@{user.username}</p>
                    
                    {user.isVendor && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        <Building2 className="h-3 w-3 mr-1" />
                        Vendor
                      </Badge>
                    )}
                    
                    {user.role === 'admin' && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    
                    {user.role === 'moderator' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Moderator
                      </Badge>
                    )}
                  </div>

                  {user.bio && (
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{user.bio}</p>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  size="sm"
                  className="shrink-0 border-gray-300 hover:border-black hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserClick(user.username);
                  }}
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Tips */}
      {!debouncedQuery && (
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Search Tips</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Search by exact username (e.g., @johndoe)</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Search by full name or part of name</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Search by keywords in bio or description</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Look for vendors by searching "vendor" or business names</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}