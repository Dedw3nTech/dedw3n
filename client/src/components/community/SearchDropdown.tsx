import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  FileText, 
  Calendar, 
  Heart,
  ChevronRight,
  Search
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SearchDropdownProps {
  searchTerm: string;
  onClose: () => void;
}

export function SearchDropdown({ searchTerm, onClose }: SearchDropdownProps) {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search/community', { q: searchTerm }],
    enabled: searchTerm.length >= 2,
  });

  useEffect(() => {
    setIsVisible(searchTerm.length >= 2);
  }, [searchTerm]);

  if (!isVisible || searchTerm.length < 2) {
    return null;
  }

  const handleNavigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  const handleViewAll = () => {
    setLocation(`/community-search?q=${encodeURIComponent(searchTerm)}`);
    onClose();
  };

  const posts = searchResults?.posts || [];
  const members = searchResults?.members || [];
  const events = searchResults?.events || [];
  const datingProfiles = searchResults?.datingProfiles || [];
  const total = searchResults?.total || 0;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-50">
      <Card className="w-full max-h-[500px] overflow-y-auto shadow-lg">
        <div className="p-4">
          {isLoading && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 animate-pulse" />
              <p>Searching...</p>
            </div>
          )}

          {!isLoading && total === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p>No results found for "{searchTerm}"</p>
            </div>
          )}

          {!isLoading && total > 0 && (
            <div className="space-y-4">
              {/* Posts */}
              {posts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Posts ({posts.length})
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {posts.slice(0, 3).map((post: any) => (
                      <div
                        key={post.id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleNavigate(`/posts/${post.id}`)}
                        data-testid={`search-result-post-${post.id}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {post.userAvatar ? (
                            <img 
                              src={post.userAvatar} 
                              alt={post.userName}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <User className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {post.title || post.content?.substring(0, 50)}
                          </p>
                          <p className="text-xs text-gray-500">
                            by {post.userName} • {post.likes} likes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {members.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Members ({members.length})
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {members.slice(0, 3).map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleNavigate(`/profile/${member.username}`)}
                        data-testid={`search-result-member-${member.id}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            @{member.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Events */}
              {events.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Events ({events.length})
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 3).map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleNavigate(`/event/${event.id}`)}
                        data-testid={`search-result-event-${event.id}`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.startTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dating Profiles */}
              {datingProfiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Dating Profiles ({datingProfiles.length})
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {datingProfiles.slice(0, 3).map((profile: any) => (
                      <div
                        key={profile.id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleNavigate(`/dating-profile/${profile.userId}`)}
                        data-testid={`search-result-dating-${profile.id}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {profile.profileImages && profile.profileImages.length > 0 ? (
                            <img 
                              src={profile.profileImages[0]} 
                              alt={profile.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Heart className="h-5 w-5 text-pink-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {profile.displayName}, {profile.age}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {profile.location}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View All Results Button */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={handleViewAll}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  data-testid="button-view-all-results"
                >
                  View all {total} results
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
