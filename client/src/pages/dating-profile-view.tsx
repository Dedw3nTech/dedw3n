import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  Crown, 
  Gem,
  MapPin,
  Calendar,
  GraduationCap,
  Banknote,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

interface DatingProfile {
  id: number;
  userId: number;
  displayName: string;
  age: number;
  gender?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  lookingFor?: string;
  relationshipType?: string;
  profileImages?: string[];
  isActive: boolean;
  isPremium: boolean;
  datingRoomTier: string;
  height?: string;
  education?: string;
  incomeRange?: string;
  createdAt?: string;
}

export default function DatingProfileView() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const profileId = params.profileId;

  // Fetch the individual dating profile
  const { data: profile, isLoading, error } = useQuery<DatingProfile>({
    queryKey: [`/api/dating-profile/${profileId}`],
    enabled: !!profileId && !!user,
  });

  // Translation keys
  const backToDatingText = t('backToDating', 'Back to Dating');
  const messageText = t('message', 'Message');
  const likeText = t('like', 'Like');
  const aboutText = t('about', 'About');
  const interestsText = t('interests', 'Interests');
  const lookingForText = t('lookingFor', 'Looking For');
  const relationshipTypeText = t('relationshipType', 'Relationship Type');
  const heightText = t('height', 'Height');
  const educationText = t('education', 'Education');
  const incomeRangeText = t('incomeRange', 'Income Range');
  const memberSinceText = t('memberSince', 'Member Since');
  const normalText = t('normal', 'NORMAL');
  const vipText = t('vip', 'VIP');
  const vvipText = t('vvip', 'VVIP');
  const profileNotFoundText = t('profileNotFound', 'Dating profile not found');
  const loadingText = t('loading', 'Loading...');

  // Get tier icon and color
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "vip":
        return { icon: Crown, color: "text-yellow-600", bgColor: "bg-yellow-50", label: vipText };
      case "vvip":
        return { icon: Gem, color: "text-purple-600", bgColor: "bg-purple-50", label: vvipText };
      default:
        return { icon: Heart, color: "text-red-500", bgColor: "bg-red-50", label: normalText };
    }
  };

  const handleMessage = () => {
    // Navigate to messaging with this profile
    console.log('Messaging profile:', profile?.displayName);
  };

  const handleLike = () => {
    // Handle like action
    console.log('Liking profile:', profile?.displayName);
  };

  // Handle profile picture display
  const getProfilePicture = () => {
    if (profile?.profileImages && profile.profileImages.length > 0) {
      return profile.profileImages[0];
    }
    // Default placeholder image
    return "/attached_assets/image_1754808686003.png";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch {
      return 'Recently';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to view dating profiles</p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{profileNotFoundText}</p>
          <Link href="/dating">
            <Button variant="outline">{backToDatingText}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tierInfo = getTierInfo(profile.datingRoomTier || "normal");
  const TierIcon = tierInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back navigation */}
        <div className="mb-6">
          <Link href="/dating">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {backToDatingText}
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Image */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
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
                
                {/* Action buttons */}
                <div className="space-y-3">
                  <Button onClick={handleMessage} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {messageText}
                  </Button>
                  <Button onClick={handleLike} variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    {likeText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      <TierIcon className={`h-6 w-6 ${tierInfo.color}`} />
                      {profile.displayName}
                      <span className="text-xl text-gray-500">({profile.age})</span>
                    </h1>
                    {profile.location && (
                      <p className="text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className={`${tierInfo.bgColor} ${tierInfo.color}`}>
                    {tierInfo.label}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* About */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {aboutText}
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">{interestsText}</h2>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <Badge key={interest} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Details</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.lookingFor && (
                  <div className="flex justify-between">
                    <span className="font-medium">{lookingForText}:</span>
                    <span className="text-gray-700">{profile.lookingFor}</span>
                  </div>
                )}
                
                {profile.relationshipType && (
                  <div className="flex justify-between">
                    <span className="font-medium">{relationshipTypeText}:</span>
                    <span className="text-gray-700 capitalize">{profile.relationshipType}</span>
                  </div>
                )}

                {profile.height && (
                  <div className="flex justify-between">
                    <span className="font-medium">{heightText}:</span>
                    <span className="text-gray-700">{profile.height}</span>
                  </div>
                )}

                {profile.education && (
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {educationText}:
                    </span>
                    <span className="text-gray-700">{profile.education}</span>
                  </div>
                )}

                {profile.incomeRange && (
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      {incomeRangeText}:
                    </span>
                    <span className="text-gray-700">{profile.incomeRange}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {memberSinceText}:
                  </span>
                  <span className="text-gray-700">{formatDate(profile.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}