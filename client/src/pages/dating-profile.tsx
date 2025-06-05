import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, User, MapPin, Calendar, Eye, EyeOff, Save, Upload, X, CreditCard } from "lucide-react";
import { useLocation } from "wouter";

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 18;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 18 ? age : 18;
};

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

const RELATIONSHIP_TYPES = [
  { value: "casual", label: "Casual Dating" },
  { value: "serious", label: "Serious Relationship" },
  { value: "friendship", label: "Friendship" },
  { value: "hookup", label: "Hookup" },
  { value: "marriage", label: "Marriage" }
];

const INTEREST_OPTIONS = [
  "Travel", "Music", "Movies", "Sports", "Reading", "Cooking", "Dancing", 
  "Photography", "Art", "Fitness", "Gaming", "Technology", "Nature", 
  "Fashion", "Food", "Animals", "Adventure", "Beach", "Hiking", "Yoga"
];

// Generate height options from 4'0" (125cm) to 8'11" (272cm)
const HEIGHT_OPTIONS = (() => {
  const heights = [];
  for (let feet = 4; feet <= 8; feet++) {
    const maxInches = feet === 8 ? 11 : 11;
    for (let inches = 0; inches <= maxInches; inches++) {
      const totalInches = feet * 12 + inches;
      const cm = Math.round(totalInches * 2.54);
      const display = `${feet}'${inches}" (${cm}cm)`;
      heights.push({ value: display, label: display });
    }
  }
  return heights;
})();

export default function DatingProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<number>(18);
  const [gender, setGender] = useState("");
  const [sexualOrientation, setSexualOrientation] = useState("");
  const [height, setHeight] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");
  const [relationshipType, setRelationshipType] = useState("");
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [showOnWall, setShowOnWall] = useState(false);
  const [datingRoomTier, setDatingRoomTier] = useState("normal");
  const [newInterest, setNewInterest] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [, navigateTo] = useLocation();

  // Geographic Information
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");

  // Demographic Information
  const [tribe, setTribe] = useState("");
  const [language, setLanguage] = useState("");
  const [income, setIncome] = useState("");
  const [education, setEducation] = useState("");

  // Fetch existing dating profile
  const { data: datingProfile, isLoading } = useQuery<DatingProfile>({
    queryKey: ["/api/dating-profile"],
    enabled: !!user,
  });

  // Auto-populate fields from user's main profile (excluding bio and display name)
  useEffect(() => {
    if (user) {
      // Auto-populate age from dateOfBirth
      if (user.dateOfBirth) {
        const calculatedAge = calculateAge(user.dateOfBirth);
        setAge(calculatedAge);
      }
      
      // Auto-populate gender from main profile
      if (user.gender && !gender) {
        setGender(user.gender);
      }
      
      // Auto-populate geographic information
      if (user.country && !country) {
        setCountry(user.country);
      }
      if (user.region && !region) {
        setRegion(user.region);
      }
      if (user.city && !city) {
        setCity(user.city);
      }
    }
  }, [user, gender, country, region, city]);

  // Load profile data when fetched
  useEffect(() => {
    if (datingProfile) {
      const profile = datingProfile as any;
      setDisplayName(profile.displayName || "");
      // Only set age from profile if user doesn't have dateOfBirth
      if (!user || !user.dateOfBirth) {
        setAge(profile.age || 18);
      }
      // Load gender and sexual orientation from existing profile if available
      if (profile.gender) setGender(profile.gender);
      if (profile.sexualOrientation) setSexualOrientation(profile.sexualOrientation);
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setInterests(profile.interests || []);
      setLookingFor(profile.lookingFor || "");
      setRelationshipType(profile.relationshipType || "");
      setProfileImages(profile.profileImages || []);
      setIsActive(profile.isActive || false);
      
      // Load geographic and demographic data if available
      if (profile.country) setCountry(profile.country);
      if (profile.region) setRegion(profile.region);
      if (profile.city) setCity(profile.city);
      if (profile.tribe) setTribe(profile.tribe);
      if (profile.language) setLanguage(profile.language);
      if (profile.income) setIncome(profile.income);
      if (profile.education) setEducation(profile.education);
    }
  }, [datingProfile, user]);

  // Update/Create dating profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<DatingProfile>) => {
      const response = await apiRequest(
        datingProfile ? "PUT" : "POST",
        "/api/dating-profile",
        profileData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dating-profile"] });
      toast({
        title: "Success",
        description: "Dating profile updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSaveProfile = () => {
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Display name is required",
        variant: "destructive",
      });
      return;
    }

    const profileData = {
      displayName: displayName.trim(),
      age,
      gender: gender.trim(),
      sexualOrientation: sexualOrientation.trim(),
      bio: bio.trim(),
      location: location.trim(),
      interests,
      lookingFor: lookingFor.trim(),
      relationshipType,
      profileImages,
      isActive,
      datingRoomTier,
      // Geographic Information
      country: country.trim(),
      region: region.trim(),
      city: city.trim(),
      // Demographic Information
      tribe: tribe.trim(),
      language: language.trim(),
      income: income.trim(),
      education: education.trim(),
    };

    updateProfileMutation.mutate(profileData);
  };

  // Add interest
  const addInterest = (interest: string) => {
    if (interest && !interests.includes(interest) && interests.length < 10) {
      setInterests([...interests, interest]);
      setNewInterest("");
    }
  };

  // Remove interest
  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  // Payment processing for dating room tiers
  const processDatingRoomPayment = async (tier: string) => {
    if (tier === "normal") {
      setDatingRoomTier(tier);
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Create payment intent for the selected tier
      const amount = tier === "vip" ? 199.99 : 1999.99;
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount,
        currency: "gbp",
        metadata: {
          type: "dating_room_subscription",
          tier,
          userId: user?.id
        }
      });

      const { clientSecret } = await response.json();
      
      // Redirect to payment page with client secret
      navigateTo(`/checkout?clientSecret=${clientSecret}&type=dating_room&tier=${tier}`);
      
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            Dating Profile
          </h1>
        </div>

        <div className="space-y-6">
          {/* Profile Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isActive ? <Eye className="h-5 w-5 text-green-500" /> : <EyeOff className="h-5 w-5 text-gray-400" />}
                Profile Status
              </CardTitle>

            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Activate Dating Profile</Label>
                  <p className="text-sm text-gray-500">
                    {isActive ? "Your profile is visible to others" : "Your profile is not active"}
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Add Open To Badge Button On Your Wall</Label>
                  <p className="text-sm text-gray-500">
                    {showOnWall ? "Dating button will appear on your wall" : "Dating button hidden from wall"}
                  </p>
                </div>
                <Switch
                  checked={showOnWall}
                  onCheckedChange={setShowOnWall}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dating Room */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dating Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Normal Tier */}
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    datingRoomTier === "normal" 
                      ? "border-black bg-gray-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => processDatingRoomPayment("normal")}
                >
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">Normal</h3>
                    <p className="text-2xl font-bold">Free</p>
                    <p className="text-sm text-gray-600">Basic dating features</p>
                  </div>
                </div>

                {/* VIP Tier */}
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    datingRoomTier === "vip" 
                      ? "border-black bg-gray-50" 
                      : "border-gray-200 hover:border-gray-300"
                  } ${isProcessingPayment ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => processDatingRoomPayment("vip")}
                >
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">VIP</h3>
                    <p className="text-2xl font-bold">£199.99</p>
                    <p className="text-xs text-gray-500">/ month</p>
                    <p className="text-sm text-gray-600">For users who make over £150,000 per year</p>
                    {isProcessingPayment && datingRoomTier === "vip" && (
                      <div className="flex items-center justify-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-xs">Processing...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* VVIP Tier */}
                <div 
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    datingRoomTier === "vvip" 
                      ? "border-black bg-gray-50" 
                      : "border-gray-200 hover:border-gray-300"
                  } ${isProcessingPayment ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => processDatingRoomPayment("vvip")}
                >
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">VVIP</h3>
                    <p className="text-2xl font-bold">£1,999.99</p>
                    <p className="text-xs text-gray-500">/ month</p>
                    <p className="text-sm text-gray-600">For users who make over £1,500,000 per year</p>
                    {isProcessingPayment && datingRoomTier === "vvip" && (
                      <div className="flex items-center justify-center mt-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-xs">Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How others will see your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={age}
                    readOnly={!!(user && user.dateOfBirth)}
                    onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                    className={user && user.dateOfBirth ? "bg-gray-50 cursor-not-allowed" : ""}
                  />
                  {user && user.dateOfBirth && (
                    <p className="text-xs text-green-600">
                      Age automatically calculated from your date of birth in profile settings
                    </p>
                  )}
                  {(!user || !user.dateOfBirth) && (
                    <p className="text-xs text-amber-600">
                      Add your date of birth in profile settings for automatic age calculation
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={gender} 
                    onValueChange={setGender}
                    disabled={!!(user && user.gender)}
                  >
                    <SelectTrigger className={user && user.gender ? "bg-gray-50 cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {user && user.gender && gender === user.gender && (
                    <p className="text-xs text-green-600">
                      Auto-filled from your profile settings
                    </p>
                  )}
                  {(!user || !user.gender) && (
                    <p className="text-xs text-amber-600">
                      Add your gender in profile settings for automatic fill
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexualOrientation">Sexual Orientation</Label>
                  <Select value={sexualOrientation} onValueChange={setSexualOrientation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your sexual orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heterosexual">Heterosexual</SelectItem>
                      <SelectItem value="asexual">Asexual</SelectItem>
                      <SelectItem value="autosexual">Autosexual</SelectItem>
                      <SelectItem value="bisexual">Bisexual</SelectItem>
                      <SelectItem value="demisexual">Demisexual</SelectItem>
                      <SelectItem value="gray-asexual">Gray-asexual</SelectItem>
                      <SelectItem value="homosexual">Homosexual</SelectItem>
                      <SelectItem value="pansexual">Pansexual</SelectItem>
                      <SelectItem value="queer">Queer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Select value={height} onValueChange={setHeight}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your height" />
                    </SelectTrigger>
                    <SelectContent>
                      {HEIGHT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              


              <div className="space-y-2">
                <Label htmlFor="bio">About you</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">{bio.length}/500 characters</p>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Information</CardTitle>
              <CardDescription>
                Help others find you based on your location preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., United States"
                  />
                  {user && user.country && country === user.country && (
                    <p className="text-xs text-green-600">
                      Auto-filled from your profile
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g., California"
                  />
                  {user && user.region && region === user.region && (
                    <p className="text-xs text-green-600">
                      Auto-filled from your profile
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Los Angeles"
                  />
                  {user && user.city && city === user.city && (
                    <p className="text-xs text-green-600">
                      Auto-filled from your profile
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Demographic Information</CardTitle>
              <CardDescription>
                Share demographic details to help with better matching
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tribe">Tribe/Ethnicity</Label>
                  <Input
                    id="tribe"
                    value={tribe}
                    onChange={(e) => setTribe(e.target.value)}
                    placeholder="e.g., African American, Hispanic, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Primary Language</Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g., English, Spanish, French"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income">Income Range</Label>
                  <Input
                    id="income"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="e.g., $50,000 - $75,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education Level</Label>
                  <Input
                    id="education"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g., Bachelor's Degree"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Interests</CardTitle>
              <CardDescription>
                Add up to 10 interests to help others find you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {interest}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Select value={newInterest} onValueChange={setNewInterest}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add an interest" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEREST_OPTIONS.filter(option => !interests.includes(option)).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => addInterest(newInterest)}
                  disabled={!newInterest || interests.includes(newInterest) || interests.length >= 10}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              
              {interests.length >= 10 && (
                <p className="text-sm text-amber-600">You can add up to 10 interests</p>
              )}
            </CardContent>
          </Card>

          {/* Dating Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Dating Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="relationshipType">Looking For</Label>
                <Select value={relationshipType} onValueChange={setRelationshipType}>
                  <SelectTrigger>
                    <SelectValue placeholder="What type of relationship are you seeking?" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lookingFor">Ideal Partner</Label>
                <Textarea
                  id="lookingFor"
                  value={lookingFor}
                  onChange={(e) => setLookingFor(e.target.value)}
                  placeholder="Describe what you're looking for in a partner..."
                  rows={3}
                  maxLength={300}
                />
                <p className="text-xs text-gray-500">{lookingFor.length}/300 characters</p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Pictures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Profile Pictures
              </CardTitle>
              <CardDescription>
                Add photos to make your profile more attractive (Coming Soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Photo upload feature coming soon</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardFooter className="flex justify-end pt-6">
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Dating Profile
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}