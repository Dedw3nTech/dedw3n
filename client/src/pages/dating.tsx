import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Crown, Gem, Lock, MessageCircle, Eye } from "lucide-react";
import OptimizedNavigation from "@/components/layout/OptimizedNavigation";

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
  const { data: datingProfiles = [], isLoading } = useQuery<DatingProfile[]>({
    queryKey: ["/api/dating-profiles", selectedTier],
    enabled: !!user && !!userProfile,
  });

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

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TierIcon className={`h-5 w-5 ${tierInfo.color}`} />
              {profile.displayName}
              <span className="text-sm font-normal text-gray-500">({profile.age})</span>
            </CardTitle>
            <Badge variant="secondary" className={tierInfo.bgColor}>
              {profile.datingRoomTier?.toUpperCase() || "NORMAL"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">{profile.location}</p>
          <p className="text-sm">{profile.bio}</p>
          
          <div className="flex flex-wrap gap-1">
            {profile.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
            {profile.interests.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{profile.interests.length - 3} more
              </Badge>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <OptimizedNavigation />
      
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

          {/* Dating Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Loading profiles...</p>
              </div>
            ) : hasAccess(selectedTier) ? (
              datingProfiles.length > 0 ? (
                datingProfiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))
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
        </div>
      </div>
    </div>
  );
}