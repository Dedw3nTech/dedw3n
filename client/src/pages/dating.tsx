import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Crown, Gem, Lock, MessageCircle, Eye, Users, Star, Shield } from "lucide-react";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { useLocation } from "wouter";


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
  const { showLoginPrompt } = useLoginPrompt();
  const [, setLocation] = useLocation();

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

  // Show informational tabs for logged-out users or users without dating profile
  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50">      
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-4">Our Dating Rooms</h1>
              <p className="text-gray-600 mb-6">
                Discover exclusive dating experiences tailored to your lifestyle and income level
              </p>
            </div>

            <Tabs defaultValue="normal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="normal" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Normal Room
                </TabsTrigger>
                <TabsTrigger value="vip" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  VIP Room
                </TabsTrigger>
                <TabsTrigger value="vvip" className="flex items-center gap-2">
                  <Gem className="h-4 w-4" />
                  VVIP Room
                </TabsTrigger>
              </TabsList>

              <TabsContent value="normal" className="space-y-6">
                <Card>
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Heart className="h-8 w-8 text-red-500" />
                      <CardTitle className="text-2xl">Normal Dating Room</CardTitle>
                    </div>
                    <p className="text-3xl font-bold text-green-600">FREE</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Features Included
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• Browse dating profiles</li>
                          <li>• Send and receive messages</li>
                          <li>• Basic matching algorithm</li>
                          <li>• Standard profile visibility</li>
                          <li>• Community chat access</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Heart className="h-5 w-5" />
                          Perfect For
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• Anyone starting their dating journey</li>
                          <li>• Casual dating and friendships</li>
                          <li>• Exploring the platform features</li>
                          <li>• Building connections</li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-center pt-4">
                      <Button 
                        onClick={() => user ? setLocation("/dating-profile") : showLoginPrompt()} 
                        className="bg-black text-white hover:bg-gray-800 px-8"
                      >
                        {user ? "Create Dating Profile" : "Join Normal Room"}
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
                      <CardTitle className="text-2xl">VIP Dating Room</CardTitle>
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">£199.99/month</p>
                    <p className="text-sm text-gray-600">For earners over £150,000 per year</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Star className="h-5 w-5" />
                          Premium Features
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• All Normal Room features</li>
                          <li>• Priority profile visibility</li>
                          <li>• Advanced matching filters</li>
                          <li>• Verified income profiles</li>
                          <li>• Exclusive VIP events</li>
                          <li>• Personal dating concierge</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Exclusive Access
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• High-earning professionals</li>
                          <li>• Verified income verification</li>
                          <li>• Quality over quantity matching</li>
                          <li>• Private VIP chat rooms</li>
                          <li>• Premium customer support</li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-center pt-4">
                      <Button 
                        onClick={() => user ? setLocation("/dating-profile") : showLoginPrompt()} 
                        className="bg-yellow-600 text-white hover:bg-yellow-700 px-8"
                      >
                        {user ? "Create Dating Profile" : "Join VIP Room"}
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
                      <CardTitle className="text-2xl">VVIP Dating Room</CardTitle>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">£1,999.99/month</p>
                    <p className="text-sm text-gray-600">For earners over £1,500,000 per year</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Gem className="h-5 w-5" />
                          Ultra-Premium Features
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• All VIP Room features</li>
                          <li>• White-glove dating service</li>
                          <li>• Personal matchmaker assigned</li>
                          <li>• Luxury date experiences</li>
                          <li>• Private jet/yacht introductions</li>
                          <li>• Global elite network access</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Crown className="h-5 w-5" />
                          Elite Lifestyle
                        </h3>
                        <ul className="space-y-2 text-sm">
                          <li>• Ultra-high net worth individuals</li>
                          <li>• Celebrity and VIP profiles</li>
                          <li>• Absolute privacy and discretion</li>
                          <li>• Bespoke introduction services</li>
                          <li>• 24/7 premium concierge</li>
                        </ul>
                      </div>
                    </div>
                    <div className="text-center pt-4">
                      <Button 
                        onClick={() => user ? setLocation("/dating-profile") : showLoginPrompt()} 
                        className="bg-purple-600 text-white hover:bg-purple-700 px-8"
                      >
                        {user ? "Create Dating Profile" : "Join VVIP Room"}
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