import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Crown, Gem, Lock, MessageCircle, Eye, Users, Star, Shield, Grid3X3, List, ChevronDown, RotateCcw, Plus, Filter } from "lucide-react";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { useLocation } from "wouter";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";



interface DatingProfile {
  id?: number;
  userId: number;
  displayName: string;
  age: number;
  bio: string;
  location: string;
  interests: string[];
  lookingFor: string;
  relationshipType: string;
  profileImages: string[];
  isActive: boolean;
  isPremium: boolean;
  datingRoomTier?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  id: number;
  username: string;
  email?: string;
}

export default function DatingPage() {
  const [selectedTier, setSelectedTier] = useState("normal");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const { showLoginPrompt } = useLoginPrompt();
  const [, setLocation] = useLocation();
  const { formatPrice, formatPriceFromGBP } = useCurrency();

  // Dating Page Master Translation Mega-Batch (116 texts)
  const datingTexts = useMemo(() => [
    // Page Headers & Navigation (21 texts)
    "Dating Rooms", "Find Your Perfect Match", "Connect with like-minded people", "Welcome to Premium Dating",
    "Normal Room", "VIP Room", "VVIP Room", "Exclusive Dating Experience", "Premium Members Only", 
    "Dating Profile", "Browse Profiles", "My Matches", "Filter", "Create Dating Profile", "Show", "Sort by", "Newest", "Popular", "Online", "Nearby",
    
    // Profile Card Elements (18 texts)
    "Message", "View", "Profile", "Age", "Location", "Interests", "Looking for", "Relationship Type",
    "Bio", "more", "Online", "Active", "Premium", "Verified", "New Member", "Popular", "Featured", "Available",
    
    // Tier Information (15 texts)
    "NORMAL", "VIP", "VVIP", "Room Access Required", "Upgrade to", "membership", "exclusive dating room",
    "per month", "For users earning over", "per year", "Upgrade Now", "Join Premium", "Unlock Features",
    "Premium Benefits", "Access Denied",
    
    // Action Buttons & CTAs (12 texts)
    "Get Started", "Create Profile", "Browse Members", "Send Message", "View Profile", "Like", "Pass",
    "Super Like", "Chat Now", "Video Call", "Send Gift", "Report User",
    
    // Status & Notifications (9 texts)
    "Loading profiles...", "No profiles found", "Connection lost", "Profile updated", "Message sent",
    "Match found", "New message", "Profile viewed", "Like received",
    
    // Room Descriptions (12 texts)
    "Open to everyone", "Basic features included", "Enhanced matching", "Priority support", "Advanced filters",
    "Exclusive events", "Personal concierge", "Verified high earners", "Ultra-premium experience", 
    "White-glove service", "Private events", "Elite community",
    
    // Normal Room Specific Content (17 texts)
    "Normal Dating Room", "FREE", "month limited, for unlimited upgrade", "Features Included", 
    "Browse dating profiles", "Send and receive messages", "Basic matching algorithm", "Standard profile visibility",
    "Community chat access", "There is a limited number of gifts you can send; however, for an unlimited quantity, an upgrade is available for",
    "Perfect For", "Anyone starting their dating journey", "Casual dating and friendships", "Exploring the platform features",
    "Building connections", "Create Dating Profile", "Join Normal Room",
    
    // VIP Room Specific Content (20 texts)
    "VIP Dating Room", "For earners over", "Premium Features", "All Normal Room features", "Unlimited gifts",
    "Priority profile visibility", "Advanced matching filters", "Verified income profiles", "Exclusive VIP events",
    "Personal dating concierge", "Exclusive Access", "High-earning professionals", "Verified income verification",
    "Quality over quantity matching", "Private VIP chat rooms", "Premium customer support", "Upgrade to VIP",
    "Join VIP Room", "Elite Dating Experience", "Professionals only",

    // VVIP Room Specific Content (20 texts)
    "VVIP Dating Room", "Ultra-Premium Features", "All VIP Room features", "White-glove dating service",
    "Personal matchmaker assigned", "Luxury date experiences", "Private jet/yacht introductions", "Global elite network access",
    "Elite Lifestyle", "Ultra-high net worth individuals", "Celebrity and VIP profiles", "Absolute privacy and discretion",
    "Bespoke introduction services", "24/7 premium concierge", "Join VVIP Room", "Create Dating Profile",
    "For earners over £1,500,000 per year", "Ultra-exclusive community", "Platinum membership", "Elite matchmaking services"
  ], []);

  // Use Master Translation System for optimal performance
  const { translations: t, isLoading: isTranslating } = useMasterBatchTranslation(datingTexts);

  // Destructure translations in order
  const [
    // Page Headers & Navigation (21 texts)
    datingRoomsText, findMatchText, connectText, welcomePremiumText,
    normalRoomText, vipRoomText, vvipRoomText, exclusiveExpText, premiumOnlyText,
    datingProfileText, browseProfilesText, myMatchesText, filterText, createDatingProfileNavText, showText, sortByText, newestText, popularText, onlineText, nearbyText,
    
    // Profile Card Elements (18 texts)
    messageText, viewText, profileText, ageText, locationText, interestsText, lookingForText, relationshipTypeText,
    bioText, moreText, onlineStatusText, activeText, premiumText, verifiedText, newMemberText, popularStatusText, featuredText, availableText,
    
    // Tier Information (15 texts)
    normalText, vipText, vvipText, roomAccessText, upgradeToText, membershipText, exclusiveRoomText,
    perMonthText, earnersOverText, perYearText, upgradeNowText, joinPremiumText, unlockFeaturesText,
    premiumBenefitsText, accessDeniedText,
    
    // Action Buttons & CTAs (12 texts)
    getStartedText, createProfileText, browseMembersText, sendMessageText, viewProfileText, likeText, passText,
    superLikeText, chatNowText, videoCallText, sendGiftText, reportUserText,
    
    // Status & Notifications (9 texts)
    loadingProfilesText, noProfilesText, connectionLostText, profileUpdatedText, messageSentText,
    matchFoundText, newMessageText, profileViewedText, likeReceivedText,
    
    // Room Descriptions (12 texts)
    openEveryoneText, basicFeaturesText, enhancedMatchingText, prioritySupportText, advancedFiltersText,
    exclusiveEventsText, personalConciergeText, verifiedEarnersText, ultraPremiumText,
    whiteGloveText, privateEventsText, eliteCommunityText,
    
    // Normal Room Specific Content (17 texts)
    normalDatingRoomText, freeText, monthLimitedText, featuresIncludedText,
    browseDatingProfilesText, sendReceiveMessagesText, basicMatchingAlgorithmText, standardProfileVisibilityText,
    communityChatAccessText, limitedGiftsUpgradeText,
    perfectForText, startingJourneyText, casualDatingText, exploringFeaturesText,
    buildingConnectionsText, createDatingProfileText, joinNormalRoomText,
    
    // VIP Room Specific Content (20 texts)
    vipDatingRoomText, forEarnersOverText, premiumFeaturesText, allNormalRoomFeaturesText, unlimitedGiftsText,
    priorityProfileVisibilityText, advancedMatchingFiltersText, verifiedIncomeProfilesText, exclusiveVipEventsText,
    personalDatingConciergeText, exclusiveAccessText, highEarningProfessionalsText, verifiedIncomeVerificationText,
    qualityOverQuantityText, privateVipChatRoomsText, premiumCustomerSupportText, upgradeToVipText,
    joinVipRoomText, eliteDatingExperienceText, professionalsOnlyText,

    // VVIP Room Specific Content (20 texts)
    vvipDatingRoomText, ultraPremiumFeaturesText, allVipRoomFeaturesText, whiteGloveDatingServiceText,
    personalMatchmakerAssignedText, luxuryDateExperiencesText, privateJetYachtIntroductionsText, globalEliteNetworkAccessText,
    eliteLifestyleText, ultraHighNetWorthText, celebrityVipProfilesText, absolutePrivacyDiscretionText,
    bespokeIntroductionServicesText, premiumConcierge24_7Text, joinVvipRoomText, createDatingProfileVvipText,
    forEarnersOver1500000Text, ultraExclusiveCommunityText, platinumMembershipText, eliteMatchmakingServicesText
  ] = t || datingTexts;

  // Fetch current user
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Fetch user's dating profile to get their tier
  const { data: userProfile } = useQuery<DatingProfile>({
    queryKey: ["/api/dating-profile"],
    enabled: !!user,
  });

  // Fetch dating profiles for selected tier
  const { data: allDatingProfiles = [], isLoading } = useQuery<DatingProfile[]>({
    queryKey: ["/api/dating-profiles", selectedTier],
    enabled: !!user && !!userProfile,
  });

  // Apply sorting and pagination
  const sortedProfiles = useMemo(() => {
    if (!allDatingProfiles) return [];
    
    const sorted = [...allDatingProfiles].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
        case "popular":
          return (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0);
        case "online":
          return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
        case "nearby":
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [allDatingProfiles, sortBy]);

  // Calculate pagination
  const totalProfiles = sortedProfiles.length;
  const totalPages = Math.ceil(totalProfiles / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const datingProfiles = sortedProfiles.slice(startIndex, endIndex);

  // Reset current page when changing tiers or items per page
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTier, itemsPerPage]);

  // Get user's tier from their profile
  const userTier = userProfile?.datingRoomTier || "normal";

  // Check if user has access to selected tier
  const hasAccess = (tier: string) => {
    if (tier === "normal") return true;
    if (tier === "vip") return userTier === "vip" || userTier === "vvip";
    if (tier === "vvip") return userTier === "vvip";
    return false;
  };

  // Get tier icon and color
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "vip":
        return { icon: Crown, color: "text-yellow-600", bgColor: "bg-yellow-50" };
      case "vvip":
        return { icon: Gem, color: "text-purple-600", bgColor: "bg-purple-50" };
      default:
        return { icon: Heart, color: "text-red-500", bgColor: "bg-red-50" };
    }
  };

  const ProfileCard = ({ profile }: { profile: DatingProfile }) => {
    const tierInfo = getTierInfo(profile.datingRoomTier || "normal");
    const TierIcon = tierInfo.icon;

    // Handle profile picture display with diverse stock photos
    const getProfilePicture = () => {
      if (profile.profileImages && profile.profileImages.length > 0) {
        return profile.profileImages[0];
      }
      
      // Diverse stock photos based on profile ID for consistent display
      const stockPhotos = [
        "https://images.unsplash.com/photo-1494790108755-2616b332c4cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&h=687&q=80", // Woman with curly hair
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&h=687&q=80", // Man with beard
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&h=687&q=80", // Woman smiling
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&h=687&q=80", // Man in casual shirt
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&h=688&q=80", // Woman with blonde hair
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&h=687&q=80", // Man outdoors
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=764&h=764&q=80", // Woman in professional setting
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&h=687&q=80", // Man smiling
      ];
      
      // Use profile ID to consistently assign a photo
      const photoIndex = (profile.id || 0) % stockPhotos.length;
      return stockPhotos[photoIndex];
    };

    const handleViewProfile = () => {
      if (profile.id) {
        setLocation(`/dating-profile/${profile.id}`);
      }
    };

    return (
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        {/* Large image section at the top */}
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img 
              src={getProfilePicture()} 
              alt={`${profile.displayName}'s profile`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/attached_assets/image_1754808686003.png";
              }}
            />
          </div>
          {/* Tier badge positioned in top-left corner */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className={`${tierInfo.bgColor} border-0 shadow-sm`}>
              <TierIcon className={`h-4 w-4 ${tierInfo.color} mr-1`} />
              {profile.datingRoomTier?.toUpperCase() || normalText}
            </Badge>
          </div>
        </div>

        {/* Footer section with profile information */}
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Name and age */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                {profile.displayName}
                <span className="text-sm font-normal text-gray-500">({profile.age})</span>
              </h3>
            </div>

            {/* Location */}
            {profile.location && (
              <p className="text-sm text-gray-600">{profile.location}</p>
            )}

            {/* Bio - truncated for card view */}
            {profile.bio && (
              <p className="text-sm text-gray-800 line-clamp-2">
                {profile.bio.length > 100 ? `${profile.bio.substring(0, 100)}...` : profile.bio}
              </p>
            )}
            
            {/* Interests tags */}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.interests.slice(0, 3).map((interest) => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{profile.interests.length - 3} {moreText}
                  </Badge>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600">
                <MessageCircle className="h-4 w-4 mr-1" />
                {messageText}
              </Button>
              <Button size="sm" variant="outline" onClick={handleViewProfile} className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {viewText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const AccessDeniedCard = ({ tier }: { tier: string }) => {
    const tierInfo = getTierInfo(tier);
    const TierIcon = tierInfo.icon;
    
    const tierDetails = {
      vip: { price: "£199.99", income: "£150,000" },
      vvip: { price: "£1,999.99", income: "£1,500,000" }
    };

    return (
      <Card className="border-2 border-dashed border-gray-300">
        <CardContent className="text-center py-12">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
            <TierIcon className={`h-5 w-5 ${tierInfo.color}`} />
            {tier.toUpperCase()} Room Access Required
          </h3>
          <p className="text-gray-600 mb-4">
            Upgrade to {tier.toUpperCase()} membership to access this exclusive dating room.
          </p>
          {tier !== "normal" && (
            <div className="space-y-2 mb-6">
              <p className="text-2xl font-bold">{tierDetails[tier as keyof typeof tierDetails]?.price}/month</p>
              <p className="text-sm text-gray-500">
                For users earning over {tierDetails[tier as keyof typeof tierDetails]?.income} per year
              </p>
            </div>
          )}
          <Button className="bg-black text-white hover:bg-gray-800">
            Upgrade to {tier.toUpperCase()}
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Show informational tabs for logged-out users or users without dating profile
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50">      
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">{datingRoomsText}</h1>
            </div>

            <Tabs defaultValue="normal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="normal" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {normalRoomText}
                </TabsTrigger>
                <TabsTrigger value="vip" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  {vipRoomText}
                </TabsTrigger>
                <TabsTrigger value="vvip" className="flex items-center gap-2">
                  <Gem className="h-4 w-4" />
                  {vvipRoomText}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="normal" className="space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Heart className="h-8 w-8 text-blue-500" />
                      <CardTitle className="text-2xl">{normalDatingRoomText}</CardTitle>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{freeText}</p>
                    <p className="text-sm text-gray-600">{monthLimitedText} {formatPrice(25.39)}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {featuresIncludedText}
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• {browseDatingProfilesText}</li>
                          <li>• {sendReceiveMessagesText}</li>
                          <li>• {basicMatchingAlgorithmText}</li>
                          <li>• {standardProfileVisibilityText}</li>
                          <li>• {communityChatAccessText}</li>
                          <li>• {limitedGiftsUpgradeText} {formatPrice(25.39)}</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          {perfectForText}
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• {startingJourneyText}</li>
                          <li>• {casualDatingText}</li>
                          <li>• {exploringFeaturesText}</li>
                          <li>• {buildingConnectionsText}</li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-center pt-4">
                      <Button 
                        onClick={() => user ? setLocation("/dating-profile") : showLoginPrompt()} 
                        className="bg-black text-white hover:bg-gray-800 px-8"
                      >
                        {user ? createDatingProfileText : joinNormalRoomText}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vip" className="space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Crown className="h-8 w-8 text-yellow-600" />
                      <CardTitle className="text-2xl">{vipDatingRoomText}</CardTitle>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{formatPriceFromGBP(199.99)}/month</p>
                    <p className="text-sm text-gray-600">{forEarnersOverText} {formatPriceFromGBP(150000)} per year</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          {premiumFeaturesText}
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• {allNormalRoomFeaturesText}</li>
                          <li>• {unlimitedGiftsText}</li>
                          <li>• {priorityProfileVisibilityText}</li>
                          <li>• {advancedMatchingFiltersText}</li>
                          <li>• {verifiedIncomeProfilesText}</li>
                          <li>• {exclusiveVipEventsText}</li>
                          <li>• {personalDatingConciergeText}</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {exclusiveAccessText}
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• {highEarningProfessionalsText}</li>
                          <li>• {verifiedIncomeVerificationText}</li>
                          <li>• {qualityOverQuantityText}</li>
                          <li>• {privateVipChatRoomsText}</li>
                          <li>• {premiumCustomerSupportText}</li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-center pt-4">
                      <Button 
                        onClick={() => user ? setLocation("/dating-profile") : showLoginPrompt()} 
                        className="bg-yellow-600 text-white hover:bg-yellow-700 px-8"
                      >
                        {user ? createDatingProfileText : joinVipRoomText}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vvip" className="space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Gem className="h-8 w-8 text-purple-600" />
                      <CardTitle className="text-2xl">{vvipDatingRoomText}</CardTitle>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">{formatPriceFromGBP(1999.99)}/{perMonthText}</p>
                    <p className="text-sm text-gray-600">{forEarnersOver1500000Text}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Gem className="h-5 w-5" />
                          {ultraPremiumFeaturesText}
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• {allVipRoomFeaturesText}</li>
                          <li>• {unlimitedGiftsText}</li>
                          <li>• {whiteGloveDatingServiceText}</li>
                          <li>• {personalMatchmakerAssignedText}</li>
                          <li>• {luxuryDateExperiencesText}</li>
                          <li>• {privateJetYachtIntroductionsText}</li>
                          <li>• {globalEliteNetworkAccessText}</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Crown className="h-5 w-5" />
                          {eliteLifestyleText}
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• {ultraHighNetWorthText}</li>
                          <li>• {celebrityVipProfilesText}</li>
                          <li>• {absolutePrivacyDiscretionText}</li>
                          <li>• {bespokeIntroductionServicesText}</li>
                          <li>• {premiumConcierge24_7Text}</li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-center pt-4">
                      <Button 
                        onClick={() => user ? setLocation("/dating-profile") : showLoginPrompt()} 
                        className="bg-purple-600 text-white hover:bg-purple-700 px-8"
                      >
                        {user ? createDatingProfileVvipText : joinVvipRoomText}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dating Rooms</h1>
            <p className="text-gray-600">
              Connect with people in your tier. Your current access: 
              <Badge className="ml-2" variant="secondary">
                {userTier.toUpperCase()}
              </Badge>
            </p>
          </div>

          {/* Tier Navigation */}
          <div className="flex gap-4 mb-8">
            {["normal", "vip", "vvip"].map((tier) => {
              const tierInfo = getTierInfo(tier);
              const TierIcon = tierInfo.icon;
              const accessible = hasAccess(tier);
              
              return (
                <Button
                  key={tier}
                  variant={selectedTier === tier ? "default" : "outline"}
                  onClick={() => setSelectedTier(tier)}
                  className={`flex items-center gap-2 ${!accessible ? "opacity-50" : ""}`}
                  disabled={!accessible}
                >
                  <TierIcon className="h-4 w-4" />
                  {tier.toUpperCase()}
                  {!accessible && <Lock className="h-3 w-3" />}
                </Button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Results */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {totalProfiles} {totalProfiles === 1 ? 'profile' : 'profiles'} found
                </span>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-4">
                {/* Items per page */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{showText}</span>
                  <div className="flex gap-1">
                    {[30, 60, 120].map((count) => (
                      <Button
                        key={count}
                        variant={itemsPerPage === count ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setItemsPerPage(count)}
                        className="min-w-[40px] text-sm"
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* View mode toggles */}
                <div className="flex border rounded">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none border-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none border-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

                {/* Filter button */}
                <Button variant="ghost" size="sm" className="flex items-center gap-2 border-0 hover:bg-transparent">
                  <Filter className="h-4 w-4" />
                  {filterText}
                </Button>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{sortByText}</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none bg-white border rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="newest">{newestText}</option>
                      <option value="popular">{popularText}</option>
                      <option value="online">{onlineText}</option>
                      <option value="nearby">{nearbyText}</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dating Profiles Grid/List */}
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Loading profiles...</p>
              </div>
            ) : hasAccess(selectedTier) ? (
              (datingProfiles?.length || 0) > 0 ? (
                datingProfiles?.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                )) || []
              ) : (
                <div className="col-span-full text-center py-12">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No profiles available</h3>
                  <p className="text-gray-600">Check back later for new matches in this tier.</p>
                </div>
              )
            ) : (
              <div className="col-span-full">
                <AccessDeniedCard tier={selectedTier} />
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}