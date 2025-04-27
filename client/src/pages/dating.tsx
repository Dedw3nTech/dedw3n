import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import PageHeader from "@/components/layout/PageHeader";
import { Heart, Gift, MessageCircle, User, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { SubscriptionWall } from "@/components/subscription/SubscriptionWall";

// Dating preferences types
type RelationshipPreference = "dating" | "meeting" | "marriage" | "casual";
type DatingProfile = {
  id: number;
  userId: number;
  username: string;
  name: string;
  avatar: string | null;
  photos: string[]; // Array of photo URLs
  bio: string;
  relationshipPreference: RelationshipPreference;
  isActive: boolean;
  interests: string[];
  wishlist: WishlistItem[];
  isMatch?: boolean; // Added to track match status
};

type WishlistItem = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  link: string;
};

// Match type for when gift is accepted
type Match = {
  id: number;
  userId: number;
  matchedUserId: number;
  username: string;
  name: string;
  avatar: string | null;
  matchDate: Date;
  giftId: number;
  giftName: string;
};

// Dummy data for demonstration
const sampleProfiles: DatingProfile[] = [
  {
    id: 1,
    userId: 101,
    username: "jessica_m",
    name: "Jessica Miller",
    avatar: null,
    photos: [
      "/images/profile1-photo1.jpg", 
      "/images/profile1-photo2.jpg", 
      "/images/profile1-photo3.jpg"
    ],
    bio: "Love hiking and outdoor activities. Looking for someone who shares my passion for adventure!",
    relationshipPreference: "dating",
    isActive: true,
    interests: ["Hiking", "Photography", "Travel"],
    wishlist: [
      {
        id: 1,
        name: "Hiking Boots",
        price: 129.99,
        imageUrl: "/images/hiking-boots.jpg",
        link: "/product/123"
      }
    ]
  },
  {
    id: 2,
    userId: 102,
    username: "mark_johnson",
    name: "Mark Johnson",
    avatar: null,
    photos: [
      "/images/profile2-photo1.jpg", 
      "/images/profile2-photo2.jpg", 
      "/images/profile2-photo3.jpg",
      "/images/profile2-photo4.jpg"
    ],
    bio: "Tech enthusiast and coffee lover. Looking for meaningful connections.",
    relationshipPreference: "meeting",
    isActive: true,
    interests: ["Technology", "Coffee", "Movies"],
    wishlist: [
      {
        id: 2,
        name: "Coffee Machine",
        price: 199.99,
        imageUrl: "/images/coffee-machine.jpg",
        link: "/product/456"
      }
    ]
  },
  {
    id: 3,
    userId: 103,
    username: "sara_p",
    name: "Sara Parker",
    avatar: null,
    photos: [
      "/images/profile3-photo1.jpg", 
      "/images/profile3-photo2.jpg", 
      "/images/profile3-photo3.jpg"
    ],
    bio: "Art teacher who loves painting and good conversations. Looking for someone special.",
    relationshipPreference: "marriage",
    isActive: true,
    interests: ["Art", "Reading", "Cooking"],
    wishlist: [
      {
        id: 3,
        name: "Art Supplies Set",
        price: 79.99,
        imageUrl: "/images/art-supplies.jpg",
        link: "/product/789"
      }
    ]
  }
];

// Example match for demonstration
const sampleMatch: Match = {
  id: 1,
  userId: 2, // Current user's ID
  matchedUserId: 103,
  username: "sara_p",
  name: "Sara Parker",
  avatar: null,
  matchDate: new Date(),
  giftId: 3,
  giftName: "Art Supplies Set"
};

export default function DatingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [relationshipPreference, setRelationshipPreference] = useState<RelationshipPreference>("dating");
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [wishlistItem, setWishlistItem] = useState("");
  const [wishlistItemPrice, setWishlistItemPrice] = useState("");
  const [myWishlist, setMyWishlist] = useState<WishlistItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([sampleMatch]); // Sample match data
  const [myPhotos, setMyPhotos] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  
  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    const newPhotos = [...photoUrls];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPhotos.push(e.target.result as string);
          setPhotoUrls([...newPhotos]);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  // Remove a photo
  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photoUrls];
    newPhotos.splice(index, 1);
    setPhotoUrls(newPhotos);
  };
  
  // Handling form submission
  const handleSaveProfile = () => {
    // Photo validation - require at least 3 photos
    if (photoUrls.length < 3) {
      toast({
        title: "More photos needed",
        description: "Please upload at least 3 photos to your profile.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send data to the backend
    toast({
      title: "Profile Updated",
      description: "Your dating profile has been updated successfully.",
    });
    
    // Set photos to the profile
    setMyPhotos(photoUrls);
    
    // Toggle profile active status
    setIsProfileActive(true);
  };
  
  // Handling gift purchases
  const handleSendGift = (profileId: number, giftId: number) => {
    // In a real app, this would add the gift to cart first
    toast({
      title: "Gift Added to Cart",
      description: "Redirecting to checkout...",
    });
    
    // Redirect to checkout page
    setLocation("/checkout");
  };
  
  // Handling message initiation
  const handleStartConversation = (username: string) => {
    toast({
      title: "Conversation Started",
      description: `Starting a conversation with ${username}.`,
    });
    
    // Navigate to messages with the specific user
    setLocation(`/messages/${username}`);
  };
  
  // Add item to wishlist
  const handleAddToWishlist = () => {
    if (!wishlistItem || !wishlistItemPrice) {
      toast({
        title: "Missing information",
        description: "Please provide both a gift name and price.",
        variant: "destructive"
      });
      return;
    }
    
    const newItem: WishlistItem = {
      id: myWishlist.length + 1,
      name: wishlistItem,
      price: parseFloat(wishlistItemPrice),
      imageUrl: "/images/gift-placeholder.jpg",
      link: `/product/${wishlistItem.toLowerCase().replace(/\s+/g, '-')}`
    };
    
    setMyWishlist([...myWishlist, newItem]);
    
    // Clear the inputs
    setWishlistItem("");
    setWishlistItemPrice("");
    
    toast({
      title: "Wishlist Updated",
      description: `${newItem.name} has been added to your wishlist.`,
    });
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Dating & Relationships" 
        description="Connect with others, exchange gifts, and find your match"
        icon={<Heart className="h-6 w-6" />}
      />
      
      <SubscriptionWall featureName="Dating & Relationships">
        <div className="mt-8">
          <Tabs defaultValue="browse">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">
                <Users className="h-4 w-4 mr-2" />
                Browse Profiles
              </TabsTrigger>
              <TabsTrigger value="myprofile">
                <User className="h-4 w-4 mr-2" />
                My Profile
              </TabsTrigger>
              <TabsTrigger value="matches">
                <Heart className="h-4 w-4 mr-2" />
                My Matches
              </TabsTrigger>
            </TabsList>
          
          {/* Browse Profiles Tab */}
          <TabsContent value="browse" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sampleProfiles.map((profile) => (
                <Card key={profile.id} className="overflow-hidden">
                  {/* Photo Gallery */}
                  <div className="relative">
                    {/* Main profile photo */}
                    <div className="relative w-full h-48 overflow-hidden">
                      <img 
                        src={profile.photos[0] || "/images/profile-placeholder.jpg"} 
                        alt={`${profile.name}'s profile`}
                        className="w-full h-full object-cover transition-all hover:scale-105"
                      />
                    </div>
                    
                    {/* Photo thumbnails */}
                    <div className="absolute bottom-2 right-2 flex space-x-1">
                      {profile.photos.slice(1, 4).map((photo, index) => (
                        <div key={index} className="w-8 h-8 rounded-md overflow-hidden border border-white">
                          <img 
                            src={photo} 
                            alt={`${profile.name}'s photo ${index + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {profile.photos.length > 4 && (
                        <div className="w-8 h-8 rounded-md bg-black/60 flex items-center justify-center text-white text-xs border border-white">
                          +{profile.photos.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar || ""} alt={profile.name} />
                        <AvatarFallback>{profile.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{profile.name}</CardTitle>
                        <CardDescription>@{profile.username}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {profile.relationshipPreference === "dating" && "Looking to Date"}
                        {profile.relationshipPreference === "meeting" && "Open to Meeting"}
                        {profile.relationshipPreference === "marriage" && "Seeking Marriage"}
                        {profile.relationshipPreference === "casual" && "Casual Relationship"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-4">{profile.bio}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-1">
                        {profile.interests.map((interest, i) => (
                          <span key={i} className="inline-block px-2 py-1 rounded-md text-xs bg-gray-100">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {profile.wishlist.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Wishlist</h4>
                        {profile.wishlist.map((item) => (
                          <div key={item.id} className="flex items-center justify-between border rounded-md p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                                <Gift className="h-5 w-5 text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSendGift(profile.id, item.id)}
                            >
                              Send Gift
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* My Profile Tab */}
          <TabsContent value="myprofile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Dating Profile</CardTitle>
                <CardDescription>
                  Set up your dating preferences and let others discover you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="profile-active">Active Dating Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, others can discover your profile
                    </p>
                  </div>
                  <Switch
                    id="profile-active"
                    checked={isProfileActive}
                    onCheckedChange={setIsProfileActive}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>I am looking for:</Label>
                  <RadioGroup 
                    value={relationshipPreference} 
                    onValueChange={(value) => setRelationshipPreference(value as RelationshipPreference)}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dating" id="dating" />
                      <Label htmlFor="dating">Dating</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="meeting" id="meeting" />
                      <Label htmlFor="meeting">Meeting New People</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="marriage" id="marriage" />
                      <Label htmlFor="marriage">Marriage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="casual" id="casual" />
                      <Label htmlFor="casual">Casual Relationship</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">About Me</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell others about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)} 
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests (comma separated)</Label>
                  <Input 
                    id="interests" 
                    placeholder="Travel, Music, Cooking..."
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)} 
                  />
                </div>
                
                {/* Photo Upload Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Profile Photos</Label>
                    <Badge variant={photoUrls.length >= 3 ? "default" : "destructive"}>
                      {photoUrls.length >= 3 ? `${photoUrls.length} Photos Added` : `At least 3 photos required (${photoUrls.length}/3)`}
                    </Badge>
                  </div>
                  
                  {/* Photo Gallery Grid */}
                  {photoUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {photoUrls.map((photo, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden aspect-square">
                          <img 
                            src={photo} 
                            alt={`Profile photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full"
                            onClick={() => handleRemovePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {index === 0 && (
                            <Badge className="absolute bottom-1 left-1">
                              Main Photo
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="photos" className="text-sm text-muted-foreground">
                      Upload at least 3 photos for your profile (first photo will be your main profile picture)
                    </Label>
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      className="cursor-pointer"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Wishlist (Gift ideas others can buy for you)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      placeholder="Gift name"
                      value={wishlistItem}
                      onChange={(e) => setWishlistItem(e.target.value)} 
                    />
                    <Input 
                      placeholder="Price ($)"
                      type="number"
                      value={wishlistItemPrice}
                      onChange={(e) => setWishlistItemPrice(e.target.value)} 
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={handleAddToWishlist}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Add to Wishlist
                  </Button>
                  
                  {myWishlist.length > 0 && (
                    <div className="mt-4 border rounded-md p-4">
                      <h4 className="text-sm font-medium mb-2">My Current Wishlist</h4>
                      <div className="space-y-2">
                        {myWishlist.map((item) => (
                          <div key={item.id} className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} className="w-full">
                  Save Dating Profile
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Matches Tab */}
          <TabsContent value="matches" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Matches</CardTitle>
                <CardDescription>
                  People who accepted your gifts and want to connect with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center max-w-sm">
                      You don't have any matches yet. Browse profiles and send gifts to start making connections!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div key={match.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={match.avatar || ""} alt={match.name} />
                              <AvatarFallback>{match.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{match.name}</h3>
                              <p className="text-sm text-muted-foreground">@{match.username}</p>
                              <div className="flex items-center mt-1 text-xs text-muted-foreground">
                                <Gift className="h-3 w-3 mr-1" />
                                <span>Matched via gift: {match.giftName}</span>
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleStartConversation(match.username)}
                            size="sm"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Message
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </SubscriptionWall>
    </div>
  );
}