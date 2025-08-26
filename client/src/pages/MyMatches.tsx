import React, { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, MapPin, Calendar, Users } from "lucide-react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useLocation } from 'wouter';
import { DatingNav } from "@/components/layout/DatingNav";

interface MatchedUser {
  id: number;
  username: string;
  name: string;
  avatar?: string;
  city?: string;
  country?: string;
}

interface MatchedProfile {
  id: number;
  displayName: string;
  age: number;
  bio?: string;
  location?: string;
  interests?: string[];
  profileImages?: string[];
  datingRoomTier: 'normal' | 'vip' | 'vvip';
}

interface DatingMatch {
  id: number;
  user1Id: number;
  user2Id: number;
  matchedAt: string;
  lastMessageAt?: string;
  isActive: boolean;
  matchedWith: MatchedUser;
  matchedProfile: MatchedProfile;
}

export function MyMatches() {
  const [, setLocation] = useLocation();

  // Translation batch for matches page
  const matchesTexts = useMemo(() => [
    "My Matches", "No matches yet", "Keep browsing profiles to find your perfect match!", 
    "Browse Profiles", "Matched on", "Send Message", "View Profile", "interests",
    "years old", "VIP Member", "VVIP Member", "Premium Member"
  ], []);

  const { translations: t } = useMasterBatchTranslation(matchesTexts);
  const [
    myMatchesText, noMatchesText, keepBrowsingText, browseProfilesText, 
    matchedOnText, sendMessageText, viewProfileText, interestsText,
    yearsOldText, vipMemberText, vvipMemberText, premiumMemberText
  ] = t || matchesTexts;

  // Fetch user's matches
  const { data: matches = [], isLoading, error } = useQuery<DatingMatch[]>({
    queryKey: ["/api/dating/matches"],
  });

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'vip':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{vipMemberText}</Badge>;
      case 'vvip':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">{vvipMemberText}</Badge>;
      default:
        return <Badge variant="outline">{premiumMemberText}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load matches. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Dating Navigation Header */}
      <DatingNav />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{myMatchesText}</h1>
          </div>

        {matches.length === 0 ? (
          /* No matches state */
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{noMatchesText}</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{keepBrowsingText}</p>
            <Button 
              onClick={() => setLocation('/dating')}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {browseProfilesText}
            </Button>
          </div>
        ) : (
          /* Matches grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Card key={match.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={match.matchedWith.avatar || '/api/placeholder/60/60'}
                        alt={match.matchedProfile.displayName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1">
                        {getTierBadge(match.matchedProfile.datingRoomTier)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {match.matchedProfile.displayName}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {match.matchedProfile.age} {yearsOldText}
                      </p>
                      {match.matchedProfile.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{match.matchedProfile.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Bio */}
                  {match.matchedProfile.bio && (
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {match.matchedProfile.bio}
                    </p>
                  )}

                  {/* Interests */}
                  {match.matchedProfile.interests && match.matchedProfile.interests.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {interestsText}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {match.matchedProfile.interests.slice(0, 3).map((interest, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {match.matchedProfile.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{match.matchedProfile.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Match date */}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{matchedOnText} {formatMatchDate(match.matchedAt)}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setLocation(`/profile/${match.matchedWith.id}`)}
                    >
                      {viewProfileText}
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => setLocation(`/messages?user=${match.matchedWith.id}`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {sendMessageText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}