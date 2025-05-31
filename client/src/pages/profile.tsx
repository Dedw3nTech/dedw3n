import { useParams, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  Share2, 
  Gift,
  MapPin,
  Calendar,
  UserCheck,
  Star,
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Clock
} from "lucide-react";

// Dating Profile Info Component
interface DatingProfileInfoProps {
  userId: number;
}

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
  createdAt?: string;
  updatedAt?: string;
}

function DatingProfileInfo({ userId }: DatingProfileInfoProps) {
  const { data: datingProfile, isLoading, error } = useQuery({
    queryKey: ["/api/dating-profile"],
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Dating Profile Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Dating Profile Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No dating profile found</p>
        </CardContent>
      </Card>
    );
  }

  if (!datingProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Dating Profile Info
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No dating profile available</p>
        </CardContent>
      </Card>
    );
  }

  const profile = datingProfile as DatingProfile;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Dating Profile Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display Name & Age */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{profile.displayName}</h3>
            <p className="text-gray-600">{profile.age} years old</p>
          </div>
          <Badge variant={profile.isActive ? "default" : "secondary"}>
            {profile.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Location */}
        {profile.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{profile.location}</span>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-1">About</h4>
            <p className="text-sm text-gray-600">{profile.bio}</p>
          </div>
        )}

        {/* Relationship Type */}
        {profile.relationshipType && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm">Looking for: {profile.relationshipType}</span>
          </div>
        )}

        {/* Looking For */}
        {profile.lookingFor && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-1">Preferences</h4>
            <p className="text-sm text-gray-600">{profile.lookingFor}</p>
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Dating Interests</h4>
            <div className="flex flex-wrap gap-1">
              {profile.interests.map((interest, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Profile Images Count */}
        {profile.profileImages && profile.profileImages.length > 0 && (
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{profile.profileImages.length} dating photos</span>
          </div>
        )}

        {/* Premium Badge */}
        {profile.isPremium && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              Premium Member
            </Badge>
          </div>
        )}

        {/* Last Updated */}
        {profile.updatedAt && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>Updated {new Date(profile.updatedAt).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mock data - in production this would come from an API
const mockProfiles = [
  {
    id: 1,
    name: "Sarah Chen",
    username: "sarahc",
    age: 28,
    location: "New York, NY",
    isActive: true,
    relationshipPreference: "dating" as const,
    bio: "Adventure seeker and coffee enthusiast. Love exploring new places, trying different cuisines, and having deep conversations about life. Currently reading 'The Seven Husbands of Evelyn Hugo' and always looking for book recommendations!",
    interests: ["Travel", "Photography", "Cooking", "Reading", "Hiking", "Coffee", "Art", "Music"],
    photos: [
      "https://images.unsplash.com/photo-1494790108755-2616b612b0e7?w=400&h=400&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face"
    ],
    wishlist: [
      { id: 1, name: "Vintage Camera", price: 299.99 },
      { id: 2, name: "Travel Journal", price: 24.99 },
      { id: 3, name: "Coffee Bean Subscription", price: 49.99 }
    ],
    verified: true,
    memberSince: "2024",
    rating: 4.9,
    totalReviews: 23
  }
];

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Find profile by username
  const profile = mockProfiles.find(p => p.username === username) || mockProfiles[0];

  useEffect(() => {
    if (!profile) {
      toast({
        title: "Profile not found",
        description: "The profile you're looking for doesn't exist.",
        variant: "destructive"
      });
      setLocation("/dating");
    }
  }, [profile, toast, setLocation]);

  const handleStartConversation = () => {
    toast({
      title: "Starting conversation",
      description: `Opening chat with ${profile.name}...`
    });
    setLocation("/messages?type=dating&user=" + profile.username);
  };

  const handleSendGift = (itemId: number) => {
    const item = profile.wishlist.find(w => w.id === itemId);
    toast({
      title: "Gift Sent!",
      description: `You sent ${item?.name} to ${profile.name}!`
    });
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === profile.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? profile.photos.length - 1 : prev - 1
    );
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/dating")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
            <div className="flex-1">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{profile.name}'s Profile</h1>
                <p className="text-sm text-gray-500">@{profile.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={profile.isActive ? "default" : "secondary"}>
                {profile.isActive ? "Online" : "Away"}
              </Badge>
              {profile.verified && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Photo Gallery */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {/* Main Photo with Navigation */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                  <img 
                    src={profile.photos[currentPhotoIndex]} 
                    alt={`${profile.name}'s photo ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {profile.photos.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80"
                        onClick={prevPhoto}
                      >
                        <ChevronLeft className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80"
                        onClick={nextPhoto}
                      >
                        <ChevronRight className="h-4 w-4 text-white" />
                      </Button>
                    </>
                  )}
                  
                  {/* Photo Counter */}
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="secondary" className="bg-black/60 text-white">
                      <Camera className="h-3 w-3 mr-1" />
                      {currentPhotoIndex + 1} / {profile.photos.length}
                    </Badge>
                  </div>
                </div>
                
                {/* Photo Thumbnails */}
                {profile.photos.length > 1 && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2 overflow-x-auto">
                      {profile.photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPhotoIndex(index)}
                          className={`flex-shrink-0 relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                            index === currentPhotoIndex 
                              ? "border-blue-500 ring-1 ring-blue-500" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <img 
                            src={photo} 
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bio & Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  About {profile.name}
                  <Badge className="bg-blue-500 text-white border-blue-500 hover:bg-blue-600" style={{ fontSize: '14px' }}>
                    {profile.relationshipPreference === "dating" ? "Looking to Date" :
                     profile.relationshipPreference === "meeting" ? "Open to Meeting" :
                     profile.relationshipPreference === "marriage" ? "Seeking Marriage" :
                     profile.relationshipPreference === "casual" ? "Casual Relationship" : "Looking to Date"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, i) => (
                      <Badge key={i} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Profile Info Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage src={profile.photos[0]} alt={profile.name} />
                    <AvatarFallback className="text-2xl">
                      {profile.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                    <p className="text-gray-500">@{profile.username}</p>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {profile.age} years old
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.location}
                    </div>
                  </div>



                  <Badge variant="outline" className="mx-auto">
                    {profile.relationshipPreference === "dating" ? "Looking to Date" :
                     profile.relationshipPreference === "meeting" ? "Open to Meeting" :
                     profile.relationshipPreference === "marriage" ? "Seeking Marriage" :
                     profile.relationshipPreference === "casual" ? "Casual Relationship" : "Looking to Date"}
                  </Badge>
                </div>

                <Separator className="my-6" />

                {/* Gift Products List */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Connect with <span className="text-blue-600">{profile.name}</span> by Sending Gift</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 1, name: "Wireless Headphones", price: 89.99, image: "https://placehold.co/100x100/blue/white?text=Headphones" },
                      { id: 2, name: "Smart Watch", price: 199.99, image: "https://placehold.co/100x100/green/white?text=Watch" },
                      { id: 3, name: "Coffee Mug", price: 24.99, image: "https://placehold.co/100x100/brown/white?text=Mug" },
                      { id: 4, name: "Notebook Set", price: 15.99, image: "https://placehold.co/100x100/orange/white?text=Notes" }
                    ].map((product) => (
                      <div key={product.id} className="relative bg-gray-50 rounded-lg p-3 border hover:border-gray-300 transition-colors">
                        <div className="aspect-square mb-2 overflow-hidden rounded">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</p>
                        <div className="flex items-center gap-1 mb-2">
                          <Gift className="h-3 w-3 text-green-600" />
                          <p className="text-sm font-bold text-green-600">${product.price}</p>
                        </div>
                        <Link href={`/product/${product.id}`} className="text-xs text-blue-600 hover:text-blue-800">
                          Product info
                        </Link>
                        
                        {/* Send Gift Button - Right Corner */}
                        <Button
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0 bg-black hover:bg-gray-800"
                          onClick={() => {
                            toast({
                              title: "Gift Sent!",
                              description: `You sent ${product.name} to ${profile.name}`
                            });
                          }}
                        >
                          <Gift className="h-4 w-4 text-white" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="text-xs text-gray-500 text-center mt-4">
                  Member since {profile.memberSince}
                </div>
              </CardContent>
            </Card>

            {/* Dating Profile Info */}
            <DatingProfileInfo userId={profile.id} />

          </div>
        </div>
      </div>
    </div>
  );
}