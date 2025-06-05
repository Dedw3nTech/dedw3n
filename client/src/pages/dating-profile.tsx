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
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2, Heart, User, MapPin, Calendar, Eye, EyeOff, Save, Upload, X, CreditCard, Gift, Check, Star, GripVertical, Trash2, Camera, FileText, Paperclip } from "lucide-react";
import { useLocation, Link } from "wouter";

// Product interface for marketplace gifts
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  category?: string;
}

// GiftsSelection component
interface GiftsSelectionProps {
  selectedGifts: number[];
  onGiftsChange: (gifts: number[]) => void;
}

function GiftsSelection({ selectedGifts, onGiftsChange }: GiftsSelectionProps) {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const toggleGift = (productId: number) => {
    if (selectedGifts.includes(productId)) {
      onGiftsChange(selectedGifts.filter(id => id !== productId));
    } else {
      onGiftsChange([...selectedGifts, productId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading gifts...</span>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8">
        <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No gifts available in the marketplace</p>
        <p className="text-sm text-gray-400 mt-2">
          Visit the <Link href="/marketplace" className="text-blue-600 hover:underline">marketplace</Link> to browse available items
        </p>
      </div>
    );
  }

  const selectedCount = selectedGifts.length;
  const isValidSelection = selectedCount >= 3;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Select at least 3 gifts to showcase on your profile
        </p>
        <Badge variant={isValidSelection ? "default" : "secondary"}>
          {selectedCount}/3+ selected
        </Badge>
      </div>

      {!isValidSelection && selectedCount > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            Please select at least {3 - selectedCount} more gift{3 - selectedCount !== 1 ? 's' : ''} to complete this section.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.slice(0, 12).map((product) => {
          const isSelected = selectedGifts.includes(product.id);
          return (
            <div
              key={product.id}
              className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleGift(product.id)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              
              <div className="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <Gift className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              <h4 className="text-sm font-medium truncate mb-1">{product.name}</h4>
              <p className="text-xs text-gray-600">£{product.price.toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {products.length > 12 && (
        <div className="text-center pt-4">
          <Link href="/marketplace">
            <Button variant="outline" size="sm">
              View More Gifts in Marketplace
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

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
  secondaryLanguage?: string;
  roots?: string;
  selectedGifts?: number[];
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

const INCOME_TIERS = [
  { value: "tier1", label: "Tier 1: £0 - £149,999", tier: 1, min: 0, max: 149999 },
  { value: "tier2", label: "Tier 2: £150,000 - £1,499,999", tier: 2, min: 150000, max: 1499999 },
  { value: "tier3", label: "Tier 3: £1,500,000+", tier: 3, min: 1500000, max: Infinity },
];

const ETHNICITY_OPTIONS = [
  "Arab",
  "Asian (East Asian)",
  "Asian (South Asian)",
  "Black, American, Caribbean or African",
  "Mixed",
  "Native American",
  "Persian",
  "White",
  "Other"
];

const LANGUAGE_OPTIONS = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani",
  "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Burmese",
  "Catalan", "Chinese (Mandarin)", "Chinese (Cantonese)", "Croatian", "Czech",
  "Danish", "Dutch", "English", "Estonian", "Finnish", "French", "Fulani",
  "Georgian", "German", "Greek", "Gujarati", "Hausa", "Hebrew", "Hindi", "Hungarian",
  "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese",
  "Kannada", "Kazakh", "Khmer", "Kikongo", "Korean", "Kurdish", "Kyrgyz",
  "Lao", "Latvian", "Lingala", "Lithuanian", "Macedonian", "Malay", "Malayalam", "Maltese", "Manding", "Marathi", "Mongolian",
  "Nepali", "Norwegian", "Oromo", "Pashto", "Persian (Farsi)", "Polish", "Portuguese", "Punjabi",
  "Romanian", "Russian", "Serbian", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili", "Swedish",
  "Tagalog", "Tamil", "Telugu", "Thai", "Turkish", "Twi", "Ukrainian", "Urdu", "Uzbek",
  "Vietnamese", "Welsh", "Yoruba", "Zulu", "Other"
];

const EDUCATION_LEVELS = [
  "High School",
  "Bachelor's",
  "Master's",
  "Doctorate"
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Helper function to get accessible dating rooms based on income tier
const getAccessibleDatingRooms = (incomeRange: string): string[] => {
  const tier = INCOME_TIERS.find(t => t.value === incomeRange);
  if (!tier) return ["normal"]; // Default to normal room only
  
  switch (tier.tier) {
    case 3: // Tier 3: Access to all rooms
      return ["normal", "vip", "vvip"];
    case 2: // Tier 2: Access to VIP and Normal
      return ["normal", "vip"];
    case 1: // Tier 1: Access to Normal only
    default:
      return ["normal"];
  }
};

export default function DatingProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatPriceFromGBP } = useCurrency();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<number>(18);
  const [gender, setGender] = useState("");
  const [sexualOrientation, setSexualOrientation] = useState("");
  const [height, setHeight] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
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
  const [secondaryLanguage, setSecondaryLanguage] = useState("");
  const [income, setIncome] = useState("");
  const [education, setEducation] = useState("");
  const [roots, setRoots] = useState("");
  const [selectedGifts, setSelectedGifts] = useState<number[]>([]);
  
  // File upload states
  const [incomeDocuments, setIncomeDocuments] = useState<File[]>([]);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
      // Load gender, sexual orientation, and income range from existing profile if available
      if (profile.gender) setGender(profile.gender);
      if (profile.sexualOrientation) setSexualOrientation(profile.sexualOrientation);
      if (profile.incomeRange) setIncomeRange(profile.incomeRange);
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
      if (profile.secondaryLanguage) setSecondaryLanguage(profile.secondaryLanguage);
      if (profile.income) setIncome(profile.income);
      if (profile.education) setEducation(profile.education);
      if (profile.roots) setRoots(profile.roots);
      if (profile.selectedGifts) setSelectedGifts(profile.selectedGifts);
      if (profile.profileImages) setProfileImages(profile.profileImages);
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

    if (selectedGifts.length < 3) {
      toast({
        title: "Error",
        description: "Please select at least 3 gifts to showcase on your profile",
        variant: "destructive",
      });
      return;
    }

    if (profileImages.length < 3) {
      toast({
        title: "Error",
        description: "Please upload at least 3 photos for your dating profile",
        variant: "destructive",
      });
      return;
    }

    const profileData = {
      displayName: displayName.trim(),
      age,
      gender: gender.trim(),
      sexualOrientation: sexualOrientation.trim(),
      incomeRange: incomeRange.trim(),
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
      secondaryLanguage: secondaryLanguage.trim(),
      income: income.trim(),
      education: education.trim(),
      roots: roots.trim(),
      selectedGifts,
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

  // Photo upload functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setProfileImages(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setProfileImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setProfileImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== toIndex) {
      moveImage(fromIndex, toIndex);
    }
  };

  // Payment processing for dating room tiers
  const processDatingRoomPayment = async (tier: string) => {
    if (tier === "normal") {
      setDatingRoomTier(tier);
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Redirect to payment gateway to select payment method
      navigateTo(`/payment-gateway?tier=${tier}&type=dating_room`);
      
    } catch (error) {
      toast({
        title: "Navigation Error",
        description: "Failed to navigate to payment gateway. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Submit application with tier-based validation
  const submitApplication = async () => {
    // First validate profile completeness
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Display name is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedGifts.length < 3) {
      toast({
        title: "Error",
        description: "Please select at least 3 gifts to showcase on your profile",
        variant: "destructive",
      });
      return;
    }

    if (profileImages.length < 3) {
      toast({
        title: "Error",
        description: "Please upload at least 3 photos for your dating profile",
        variant: "destructive",
      });
      return;
    }

    if (!income) {
      toast({
        title: "Error",
        description: "Please select your income range to determine your tier",
        variant: "destructive",
      });
      return;
    }

    // Determine tier based on income
    const incomeValue = parseInt(income.replace(/[£,]/g, ''));
    let tier = 1;
    let tierName = "Tier 1 (£0 - £149,999)";
    let requiresProof = false;

    if (incomeValue >= 1500000) {
      tier = 3;
      tierName = "Tier 3 (£1,500,000+)";
      requiresProof = true;
    } else if (incomeValue >= 150000) {
      tier = 2;
      tierName = "Tier 2 (£150,000 - £1,499,999)";
      requiresProof = true;
    }

    if (requiresProof && incomeDocuments.length === 0) {
      toast({
        title: "Proof of Income Required",
        description: `As a ${tierName} applicant, you must provide proof of income before your application can be approved. Please upload documentation such as payslips, tax returns, or bank statements.`,
        variant: "destructive",
      });
      return;
    }

    // Auto-approve tier 1 accounts
    setIsProcessingPayment(true);
    try {
      const profileData = {
        displayName: displayName.trim(),
        age,
        gender: gender.trim(),
        sexualOrientation: sexualOrientation.trim(),
        incomeRange: incomeRange.trim(),
        bio: bio.trim(),
        location: location.trim(),
        interests,
        lookingFor: lookingFor.trim(),
        relationshipType,
        profileImages,
        isActive: true, // Auto-activate for tier 1
        datingRoomTier: "normal",
        // Geographic Information
        country: country.trim(),
        region: region.trim(),
        city: city.trim(),
        // Demographic Information
        tribe: tribe.trim(),
        language: language.trim(),
        secondaryLanguage: secondaryLanguage.trim(),
        income: income.trim(),
        education: education.trim(),
        roots: roots.trim(),
        selectedGifts,
      };

      await updateProfileMutation.mutateAsync(profileData);
      
      toast({
        title: "Application Approved!",
        description: `Your ${tierName} dating profile has been automatically approved and activated. You can now access the dating rooms.`,
      });

      // Update local state
      setIsActive(true);

    } catch (error) {
      toast({
        title: "Application Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Document upload handlers
  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        // Validate file type (PDF, JPG, PNG)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        return allowedTypes.includes(file.type);
      });
      
      if (newFiles.length !== files.length) {
        toast({
          title: "Invalid File Type",
          description: "Only PDF, JPG, and PNG files are allowed for income verification.",
          variant: "destructive",
        });
      }
      
      setIncomeDocuments(prev => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setIncomeDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Dating Dashboard
          </h1>
          {user && (
            <Link href={`/profile/${user.id}`}>
              <Button variant="outline" className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50">
                <User className="h-4 w-4" />
                View My Dating Profile
              </Button>
            </Link>
          )}
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
                    <p className="text-2xl font-bold">{formatPriceFromGBP(199.99)}</p>
                    <p className="text-xs text-gray-500">/ month</p>
                    <p className="text-sm text-gray-600">For users who make over {formatPriceFromGBP(150000)} per year</p>
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
                    <p className="text-2xl font-bold">{formatPriceFromGBP(1999.99)}</p>
                    <p className="text-xs text-gray-500">/ month</p>
                    <p className="text-sm text-gray-600">For users who make over {formatPriceFromGBP(1500000)} per year</p>
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
                    <p className="text-xs text-black">
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
                    <p className="text-xs text-black">
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
                <div className="space-y-2">
                  <Label htmlFor="incomeRange">Income Range</Label>
                  <Select value={incomeRange} onValueChange={setIncomeRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your income range" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_TIERS.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          {tier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Income tier determines dating room access
                  </p>
                  {incomeRange && (
                    <div className="text-xs bg-blue-50 p-2 rounded">
                      <p className="font-medium text-blue-800">Dating Room Access:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getAccessibleDatingRooms(incomeRange).map((room) => (
                          <span 
                            key={room} 
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {room.charAt(0).toUpperCase() + room.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                    <p className="text-xs text-black">
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
                    <p className="text-xs text-black">
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
                    <p className="text-xs text-black">
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
                  <Label htmlFor="tribe">Ethnicity</Label>
                  <Select value={tribe} onValueChange={setTribe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your ethnicity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHNICITY_OPTIONS.map((ethnicity) => (
                        <SelectItem key={ethnicity} value={ethnicity}>
                          {ethnicity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roots">Roots</Label>
                  <Select value={roots} onValueChange={setRoots}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country of origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Primary Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryLanguage">Secondary Language</Label>
                  <Select value={secondaryLanguage} onValueChange={setSecondaryLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your secondary language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Education Level</Label>
                  <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          {/* Gifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Gifts
              </CardTitle>
              <CardDescription>
                Select at least 3 gifts from the marketplace or events to showcase on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <GiftsSelection 
                selectedGifts={selectedGifts}
                onGiftsChange={setSelectedGifts}
              />
            </CardContent>
          </Card>

          {/* Profile Pictures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Pictures
              </CardTitle>
              <CardDescription>
                Upload at least 3 photos for your dating profile. First photo will be your main profile picture. Drag to reorder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="image-upload"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload photos or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                </div>
              </div>

              {/* Photo Gallery */}
              {profileImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {profileImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-move"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <img
                        src={image}
                        alt={`Profile ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Main Photo Badge */}
                      {index === 0 && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-600 text-white text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Main
                          </Badge>
                        </div>
                      )}
                      
                      {/* Drag Handle */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 rounded p-1">
                          <GripVertical className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Position Indicator */}
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          {index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Photo Requirements Info */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${profileImages.length >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={profileImages.length >= 3 ? 'text-green-600' : 'text-gray-500'}>
                    {profileImages.length}/3 minimum photos
                  </span>
                </div>
                
                {profileImages.length > 0 && (
                  <p className="text-gray-500">
                    Drag photos to reorder • First photo is your main picture
                  </p>
                )}
              </div>

              {profileImages.length < 3 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Required:</strong> Please upload at least 3 photos to activate your dating profile.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income Verification Upload - Only for Tier 2 and Tier 3 */}
          {income && (() => {
            const incomeValue = parseInt(income.replace(/[£,]/g, ''));
            const requiresProof = incomeValue >= 150000;
            
            if (!requiresProof) return null;
            
            return (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-800">
                    <FileText className="h-5 w-5" />
                    Income Verification Required
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    {incomeValue >= 1500000 
                      ? "As a Tier 3 applicant (£1,500,000+), please upload proof of income to verify your eligibility for all dating rooms."
                      : "As a Tier 2 applicant (£150,000 - £1,499,999), please upload proof of income to verify your eligibility for VIP dating rooms."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                        className="hidden"
                        id="income-documents"
                      />
                      <label htmlFor="income-documents" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Paperclip className="h-8 w-8 text-orange-500" />
                          <p className="text-sm font-medium text-orange-800">
                            Click to upload documents
                          </p>
                          <p className="text-xs text-orange-600">
                            PDF, JPG, PNG files only • Max 10MB per file
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Document List */}
                    {incomeDocuments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-orange-800">Uploaded Documents:</h4>
                        {incomeDocuments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-orange-200">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-orange-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => removeDocument(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Requirements */}
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-800 mb-2">Acceptable Documents:</h4>
                      <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Recent payslips (last 3 months)</li>
                        <li>• Tax returns or P60</li>
                        <li>• Bank statements showing salary deposits</li>
                        <li>• Employment contract with salary details</li>
                        <li>• Accountant's letter for self-employed</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Action Buttons */}
          <Card>
            <CardFooter className="flex justify-between pt-6">
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending || isProcessingPayment}
                variant="outline"
                className="flex items-center gap-2"
              >
                {updateProfileMutation.isPending ? (
                  "Saving..."
                ) : (
                  "Save Changes"
                )}
              </Button>

              <Button
                onClick={submitApplication}
                disabled={updateProfileMutation.isPending || isProcessingPayment}
                className="bg-black text-white hover:bg-gray-800 flex items-center gap-2"
              >
                {isProcessingPayment ? (
                  "Processing..."
                ) : (
                  "Submit Application"
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Tier Information */}
          {income && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Your Application Tier
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Based on your income range, you qualify for:
                  </p>
                  
                  {(() => {
                    const incomeValue = parseInt(income.replace(/[£,]/g, ''));
                    if (incomeValue >= 1500000) {
                      return (
                        <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
                          <Badge className="bg-purple-600 text-white mb-2">Tier 3</Badge>
                          <p className="text-purple-800 font-medium">{formatPriceFromGBP(1500000)}+ Annual Income</p>
                          <p className="text-sm text-purple-700 mt-2">
                            Access to all dating rooms • Requires income verification
                          </p>
                        </div>
                      );
                    } else if (incomeValue >= 150000) {
                      return (
                        <div className="bg-gold-100 border border-yellow-400 rounded-lg p-4">
                          <Badge className="bg-yellow-600 text-white mb-2">Tier 2</Badge>
                          <p className="text-yellow-800 font-medium">{formatPriceFromGBP(150000)} - {formatPriceFromGBP(1499999)} Annual Income</p>
                          <p className="text-sm text-yellow-700 mt-2">
                            Access to VIP and Normal rooms • Requires income verification
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                          <Badge className="bg-green-600 text-white mb-2">Tier 1</Badge>
                          <p className="text-green-800 font-medium">{formatPriceFromGBP(0)} - {formatPriceFromGBP(149999)} Annual Income</p>
                          <p className="text-sm text-green-700 mt-2">
                            Access to Normal dating room • Auto-approved
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}