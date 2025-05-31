import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Gift, MessageCircle, User, Users, X, Search, SlidersHorizontal, MapPin, Calendar, ChevronDown, Share2, Plus, Flag } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { DatingRoomWall } from "@/components/DatingRoomWall";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


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
  lastActive?: Date; // When the user was last active
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
      "https://placehold.co/400x400/purple/white?text=Jessica+1", 
      "https://placehold.co/400x400/purple/white?text=Jessica+2", 
      "https://placehold.co/400x400/purple/white?text=Jessica+3"
    ],
    bio: "Love hiking and outdoor activities. Looking for someone who shares my passion for adventure!",
    relationshipPreference: "dating",
    isActive: true,
    lastActive: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago (online)
    interests: ["Hiking", "Photography", "Travel"],
    wishlist: [
      {
        id: 1,
        name: "Hiking Boots",
        price: 129.99,
        imageUrl: "https://placehold.co/100x100/green/white?text=Hiking+Boots",
        link: "/product/123"
      },
      {
        id: 2,
        name: "Camera Backpack",
        price: 89.99,
        imageUrl: "https://placehold.co/100x100/gray/white?text=Camera+Bag",
        link: "/product/124"
      },
      {
        id: 3,
        name: "Travel Journal",
        price: 24.99,
        imageUrl: "https://placehold.co/100x100/blue/white?text=Journal",
        link: "/product/125"
      },
      {
        id: 4,
        name: "Waterproof Jacket",
        price: 159.99,
        imageUrl: "https://placehold.co/100x100/orange/white?text=Jacket",
        link: "/product/126"
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
      "https://placehold.co/400x400/blue/white?text=Mark+1", 
      "https://placehold.co/400x400/blue/white?text=Mark+2", 
      "https://placehold.co/400x400/blue/white?text=Mark+3",
      "https://placehold.co/400x400/blue/white?text=Mark+4"
    ],
    bio: "Tech enthusiast and coffee lover. Looking for meaningful connections.",
    relationshipPreference: "meeting",
    isActive: true,
    lastActive: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago (online)
    interests: ["Technology", "Coffee", "Movies"],
    wishlist: [
      {
        id: 2,
        name: "Coffee Machine",
        price: 199.99,
        imageUrl: "https://placehold.co/100x100/brown/white?text=Coffee+Machine",
        link: "/product/456"
      },
      {
        id: 5,
        name: "Wireless Headphones",
        price: 149.99,
        imageUrl: "https://placehold.co/100x100/black/white?text=Headphones",
        link: "/product/457"
      },
      {
        id: 6,
        name: "Smart Watch",
        price: 299.99,
        imageUrl: "https://placehold.co/100x100/silver/black?text=Watch",
        link: "/product/458"
      },
      {
        id: 7,
        name: "Programming Books",
        price: 79.99,
        imageUrl: "https://placehold.co/100x100/red/white?text=Books",
        link: "/product/459"
      },
      {
        id: 8,
        name: "Laptop Stand",
        price: 59.99,
        imageUrl: "https://placehold.co/100x100/gray/white?text=Stand",
        link: "/product/460"
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
      "https://placehold.co/400x400/pink/white?text=Sara+1", 
      "https://placehold.co/400x400/pink/white?text=Sara+2", 
      "https://placehold.co/400x400/pink/white?text=Sara+3"
    ],
    bio: "Art teacher who loves painting and good conversations. Looking for someone special.",
    relationshipPreference: "marriage",
    isActive: true,
    lastActive: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago (away)
    interests: ["Art", "Reading", "Cooking"],
    wishlist: [
      {
        id: 3,
        name: "Art Supplies Set",
        price: 79.99,
        imageUrl: "https://placehold.co/100x100/purple/white?text=Art+Supplies",
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
  

  
  // Dating profile filters and search (matching marketplace structure)
  const [searchTerm, setSearchTerm] = useState('');
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 65]);
  const [selectedRelationshipTypes, setSelectedRelationshipTypes] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [profilesPerPage, setProfilesPerPage] = useState<number>(12);
  const [columnsPerRow, setColumnsPerRow] = useState<number>(3);
  const [currentTab, setCurrentTab] = useState('browse');
  
  // Profile management
  const [relationshipPreference, setRelationshipPreference] = useState<RelationshipPreference>("dating");
  const [isProfileActive, setIsProfileActive] = useState(false);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [wishlistItem, setWishlistItem] = useState("");
  const [wishlistItemPrice, setWishlistItemPrice] = useState("");
  const [myWishlist, setMyWishlist] = useState<WishlistItem[]>([]);
  
  // Gift selection popup state
  const [giftPopupOpen, setGiftPopupOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<DatingProfile | null>(null);
  const [selectedGift, setSelectedGift] = useState<WishlistItem | null>(null);
  const [matches, setMatches] = useState<Match[]>([sampleMatch]);
  const [myPhotos, setMyPhotos] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  
  // Available filter options
  const relationshipTypes = ["Dating", "Meeting", "Marriage", "Casual"];
  const interestOptions = ["Hiking", "Photography", "Travel", "Technology", "Coffee", "Movies", "Art", "Reading", "Cooking", "Music", "Sports", "Gaming"];
  const locationOptions = ["London", "Manchester", "Birmingham", "Edinburgh", "Cardiff", "Belfast", "Bristol", "Liverpool"];
  
  // Function to check if user is online (within last 5 minutes)
  const isUserOnline = (lastActive?: Date) => {
    if (!lastActive) return false;
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return new Date(lastActive) > fiveMinutesAgo;
  };
  
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
  const handleSendGift = (profile: DatingProfile) => {
    setSelectedProfile(profile);
    setGiftPopupOpen(true);
  };

  const handleGiftSelection = (gift: WishlistItem) => {
    setSelectedGift(gift);
    // Add gift to cart and redirect to checkout
    toast({
      title: "Gift Added to Cart",
      description: `${gift.name} for ${selectedProfile?.name} - Redirecting to checkout...`,
    });
    
    setGiftPopupOpen(false);
    setSelectedProfile(null);
    setSelectedGift(null);
    setLocation("/checkout");
  };

  const handleViewProfile = (username: string) => {
    setLocation(`/profile/${username}`);
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
      imageUrl: "https://placehold.co/100x100/teal/white?text=Gift",
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

  // Filter profiles based on search and filters
  const filteredProfiles = sampleProfiles.filter(profile => {
    // Search term filter
    if (searchTerm && !profile.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !profile.bio.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !profile.interests.some(interest => interest.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    // Relationship type filter
    if (selectedRelationshipTypes.length > 0 && 
        !selectedRelationshipTypes.some(type => 
          type.toLowerCase() === profile.relationshipPreference.toLowerCase())) {
      return false;
    }
    
    // Interest filter
    if (selectedInterests.length > 0 && 
        !selectedInterests.some(interest => 
          profile.interests.includes(interest))) {
      return false;
    }
    
    // Active profiles only
    if (showActiveOnly && !profile.isActive) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <DatingRoomWall>
        {/* Header Section with Search */}
        <div className="bg-white border-b border-gray-200 py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Search Bar */}
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search profiles by name, interests, or bio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Dating Room Tabs */}
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-auto">
                  <TabsList className="grid grid-cols-3 h-10">
                    <TabsTrigger value="browse" className="flex items-center gap-2 text-sm px-3">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      Browse
                    </TabsTrigger>
                    <TabsTrigger value="myprofile" className="flex items-center gap-2 text-sm px-3">
                      <User className="h-4 w-4 flex-shrink-0" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="matches" className="flex items-center gap-2 text-sm px-3">
                      <Heart className="h-4 w-4 flex-shrink-0" />
                      Matches
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar (matching marketplace style) */}
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Results count */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Showing {filteredProfiles.length} profiles
                </span>
              </div>
              
              {/* Profiles per page, view controls, and sort */}
              <div className="flex items-center gap-6">
                {/* Profiles per page selector */}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span>Show</span>
                  <button
                    onClick={() => setProfilesPerPage(30)}
                    className={`px-2 py-1 hover:text-black transition-colors ${profilesPerPage === 30 ? 'text-black font-medium' : ''}`}
                  >
                    30
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => setProfilesPerPage(60)}
                    className={`px-2 py-1 hover:text-black transition-colors ${profilesPerPage === 60 ? 'text-black font-medium' : ''}`}
                  >
                    60
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => setProfilesPerPage(120)}
                    className={`px-2 py-1 hover:text-black transition-colors ${profilesPerPage === 120 ? 'text-black font-medium' : ''}`}
                  >
                    120
                  </button>
                </div>

                {/* Grid layout controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setColumnsPerRow(2)}
                    className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 2 ? 'opacity-100' : 'opacity-50'}`}
                    title="2 columns"
                  >
                    <div className="w-1 h-4 bg-black"></div>
                    <div className="w-1 h-4 bg-black"></div>
                  </button>
                  <button
                    onClick={() => setColumnsPerRow(3)}
                    className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 3 ? 'opacity-100' : 'opacity-50'}`}
                    title="3 columns"
                  >
                    <div className="w-1 h-4 bg-black"></div>
                    <div className="w-1 h-4 bg-black"></div>
                    <div className="w-1 h-4 bg-black"></div>
                  </button>
                  <button
                    onClick={() => setColumnsPerRow(4)}
                    className={`flex gap-1 p-2 hover:opacity-80 transition-opacity ${columnsPerRow === 4 ? 'opacity-100' : 'opacity-50'}`}
                    title="4 columns"
                  >
                    <div className="w-1 h-4 bg-black"></div>
                    <div className="w-1 h-4 bg-black"></div>
                    <div className="w-1 h-4 bg-black"></div>
                    <div className="w-1 h-4 bg-black"></div>
                  </button>
                </div>

                {/* Sort dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors">
                      Sort by: {
                        sortBy === 'global' ? 'Global' :
                        sortBy === 'region' ? 'My Region' :
                        sortBy === 'country' ? 'My Country' :
                        sortBy === 'city' ? 'My City' :
                        sortBy === 'tribe' ? 'Tribe' :
                        sortBy === 'language' ? 'Language' :
                        sortBy === 'income' ? 'Income' :
                        'Global'
                      }
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setSortBy('small-to-tall')}>
                      Small to Tall
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('tall-to-small')}>
                      Tall to Small
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('high-income-to-low')}>
                      High Income to Low Income
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('low-income-to-high')}>
                      Low Income to High Income
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('low-kids-to-high')}>
                      Low Number of Kids to High Number of Kids
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('high-kids-to-low')}>
                      High Number of Kids to Low Number of Kids
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Browse Profiles Tab */}
          {currentTab === "browse" && (
            <div className={`grid gap-6 ${
              columnsPerRow === 2 ? 'grid-cols-1 md:grid-cols-2' :
              columnsPerRow === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {filteredProfiles.map((profile) => (
                <Card key={profile.id} className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300">
                  {/* Main Profile Image */}
                  <div className="relative">
                    <div 
                      className="aspect-square overflow-hidden cursor-pointer"
                      onClick={() => handleViewProfile(profile.username)}
                    >
                      <img 
                        src={profile.photos[0] || "https://placehold.co/400x400/f3f4f6/9ca3af?text=Profile"} 
                        alt={`${profile.name}'s profile`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge 
                        variant={isUserOnline(profile.lastActive) ? "default" : "secondary"} 
                        className={`text-xs ${isUserOnline(profile.lastActive) ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-500 text-white"}`}
                      >
                        {isUserOnline(profile.lastActive) ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    
                    {/* Photo Count */}
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="text-xs bg-black/60 text-white">
                        {profile.photos.length} photos
                      </Badge>
                    </div>
                    

                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Profile Header */}
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleViewProfile(profile.username)}
                        >
                          <h3 className="font-semibold text-lg text-gray-900 truncate hover:text-blue-600 transition-colors">{profile.name}</h3>
                          <p className="text-sm text-gray-500 hover:text-blue-500 transition-colors">@{profile.username}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <Flag className="mr-2 h-4 w-4 text-red-600" />
                              Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Relationship Preference */}
                      <div>
                        <Badge className="text-xs bg-blue-500 text-white hover:bg-blue-600">
                          {profile.relationshipPreference === "dating" && "Looking to Date"}
                          {profile.relationshipPreference === "meeting" && "Open to Meeting"}
                          {profile.relationshipPreference === "marriage" && "Seeking Marriage"}
                          {profile.relationshipPreference === "casual" && "Casual Relationship"}
                        </Badge>
                      </div>
                      
                      {/* Bio */}
                      <p className="text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
                      
                      {/* Interests */}
                      <div className="flex flex-wrap gap-1">
                        {profile.interests.slice(0, 3).map((interest, i) => (
                          <span key={i} className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            {interest}
                          </span>
                        ))}
                        {profile.interests.length > 3 && (
                          <span className="inline-block px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            +{profile.interests.length - 3}
                          </span>
                        )}
                      </div>
                      
                      {/* Wishlist Preview */}
                      {profile.wishlist.length > 0 && (
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">
                              {profile.wishlist.length} wishlist item{profile.wishlist.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          {/* Wishlist Product Images */}
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {profile.wishlist.slice(0, 3).map((item, index) => (
                              <a
                                key={index}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative rounded-md overflow-hidden aspect-square border hover:border-blue-500 transition-colors group"
                              >
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1">
                                  <p className="text-xs font-medium truncate">{item.name}</p>
                                  <p className="text-xs text-gray-200">${item.price.toFixed(2)}</p>
                                </div>
                              </a>
                            ))}
                          </div>
                          
                          {/* Show More Link */}
                          {profile.wishlist.length > 3 && (
                            <div className="text-center">
                              <button
                                onClick={() => handleViewProfile(profile.username)}
                                className="text-xs text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                              >
                                Show more ({profile.wishlist.length - 3} more items)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  {/* Action Footer */}
                  <CardFooter className="p-4 pt-0">
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewProfile(profile.username)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        onClick={() => handleSendGift(profile)}
                      >
                        <Gift className="mr-2 h-4 w-4" />
                        Send Gift
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* My Profile Tab */}
          {currentTab === "myprofile" && (
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
          )}
          
          {/* Matches Tab */}
          {currentTab === "matches" && (
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
          )}
        </div>
      </DatingRoomWall>
      
      {/* Gift Selection Popup */}
      <Dialog open={giftPopupOpen} onOpenChange={setGiftPopupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send a Gift to {selectedProfile?.name}</DialogTitle>
            <DialogDescription>
              Choose a gift from {selectedProfile?.name}'s wishlist
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedProfile?.wishlist.map((gift) => (
              <div
                key={gift.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleGiftSelection(gift)}
              >
                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                  {gift.imageUrl ? (
                    <img 
                      src={gift.imageUrl} 
                      alt={gift.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Gift className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{gift.name}</h4>
                  <p className="text-sm font-semibold text-green-600">${gift.price.toFixed(2)}</p>
                  {gift.link && (
                    <p className="text-xs text-gray-500 truncate">From: {gift.link}</p>
                  )}
                </div>
                
                <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                  Select
                </Button>
              </div>
            ))}
          </div>
          
          {selectedProfile?.wishlist.length === 0 && (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No gifts in wishlist</p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setGiftPopupOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}