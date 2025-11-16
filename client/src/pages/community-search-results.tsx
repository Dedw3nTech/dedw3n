import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  FileText, 
  Calendar, 
  Heart,
  Search
} from 'lucide-react';
import { CommunityNav } from '@/components/layout/CommunityNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/ui/user-avatar';

export default function CommunitySearchResults() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    setSearchTerm(query);
  }, [location]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search/community', { q: searchTerm }],
    enabled: searchTerm.length >= 2,
  });

  const posts = searchResults?.posts || [];
  const members = searchResults?.members || [];
  const events = searchResults?.events || [];
  const datingProfiles = searchResults?.datingProfiles || [];
  const total = searchResults?.total || 0;

  if (!searchTerm) {
    return (
      <>
        <CommunityNav searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Community Search</h1>
            <p className="text-gray-600">Enter a search term to find posts, members, events, and dating profiles.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CommunityNav searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results for "{searchTerm}"
          </h1>
          <p className="text-sm text-gray-600">
            Found {total} total results
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Searching...</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && total === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No results found for "{searchTerm}"
            </h2>
            <p className="text-gray-600">
              Try adjusting your search terms or search for something else.
            </p>
          </div>
        )}

        {/* Results Tabs */}
        {!isLoading && total > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all" data-testid="tab-all">
                All ({total})
              </TabsTrigger>
              <TabsTrigger value="posts" data-testid="tab-posts">
                Posts ({posts.length})
              </TabsTrigger>
              <TabsTrigger value="members" data-testid="tab-members">
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="events" data-testid="tab-events">
                Events ({events.length})
              </TabsTrigger>
              <TabsTrigger value="dating" data-testid="tab-dating">
                Dating ({datingProfiles.length})
              </TabsTrigger>
            </TabsList>

            {/* All Tab */}
            <TabsContent value="all" className="space-y-8">
              {posts.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Posts
                  </h2>
                  <div className="grid gap-4">
                    {posts.map((post: any) => (
                      <Card 
                        key={post.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/posts/${post.id}`)}
                        data-testid={`post-card-${post.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {post.userAvatar ? (
                                <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                              ) : (
                                <User className="h-6 w-6 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {post.title || 'Post'}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {post.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>by {post.userName}</span>
                                <span>•</span>
                                <span>{post.likes} likes</span>
                                <span>•</span>
                                <span>{post.comments} comments</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {members.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Members
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {members.map((member: any) => (
                      <Card 
                        key={member.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/profile/${member.username}`)}
                        data-testid={`member-card-${member.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar userId={member.id} username={member.username} size="md" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                              <p className="text-sm text-gray-500 truncate">@{member.username}</p>
                              {member.bio && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">{member.bio}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}


              {events.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Events
                  </h2>
                  <div className="grid gap-4">
                    {events.map((event: any) => (
                      <Card 
                        key={event.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/event/${event.id}`)}
                        data-testid={`event-card-${event.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {event.description}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>{new Date(event.startTime).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{event.eventType}</span>
                                <span>•</span>
                                <span>By {event.hostName}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {datingProfiles.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Dating Profiles
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {datingProfiles.map((profile: any) => (
                      <Card 
                        key={profile.id} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/dating-profile/${profile.userId}`)}
                        data-testid={`dating-card-${profile.id}`}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square bg-pink-100 flex items-center justify-center overflow-hidden rounded-t-lg">
                            {profile.profileImages && profile.profileImages.length > 0 ? (
                              <img src={profile.profileImages[0]} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <Heart className="h-12 w-12 text-pink-600" />
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-gray-900">
                              {profile.displayName}, {profile.age}
                            </h3>
                            <p className="text-sm text-gray-500">{profile.location}</p>
                            {profile.bio && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Individual Tabs - Similar structure for each */}
            <TabsContent value="posts" className="space-y-4">
              {posts.map((post: any) => (
                <Card 
                  key={post.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/posts/${post.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {post.userAvatar ? (
                          <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {post.title || 'Post'}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>by {post.userName}</span>
                          <span>•</span>
                          <span>{post.likes} likes</span>
                          <span>•</span>
                          <span>{post.comments} comments</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>No posts found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member: any) => (
                <Card 
                  key={member.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/profile/${member.username}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar userId={member.id} username={member.username} size="md" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                        <p className="text-sm text-gray-500 truncate">@{member.username}</p>
                        {member.bio && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{member.bio}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {members.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-2" />
                  <p>No members found</p>
                </div>
              )}
            </TabsContent>


            <TabsContent value="events" className="space-y-4">
              {events.map((event: any) => (
                <Card 
                  key={event.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/event/${event.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(event.startTime).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{event.eventType}</span>
                          <span>•</span>
                          <span>By {event.hostName}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {events.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2" />
                  <p>No events found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dating" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {datingProfiles.map((profile: any) => (
                <Card 
                  key={profile.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/dating-profile/${profile.userId}`)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-pink-100 flex items-center justify-center overflow-hidden rounded-t-lg">
                      {profile.profileImages && profile.profileImages.length > 0 ? (
                        <img src={profile.profileImages[0]} alt={profile.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <Heart className="h-12 w-12 text-pink-600" />
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900">
                        {profile.displayName}, {profile.age}
                      </h3>
                      <p className="text-sm text-gray-500">{profile.location}</p>
                      {profile.bio && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {datingProfiles.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Heart className="h-12 w-12 mx-auto mb-2" />
                  <p>No dating profiles found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
