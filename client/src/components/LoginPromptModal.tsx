import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import dedw3nLogo from "@assets/Dedw3n Logo.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import RegionSelector from "@/components/RegionSelector";
import { useUnifiedTranslation, useUnifiedBatchTranslation } from "@/hooks/use-unified-translation";
import { 
  User, 
  Eye, 
  EyeOff, 
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  Users,
  Globe,
  Calendar
} from "lucide-react";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string; // What action triggered this popup
}

export function LoginPromptModal({ isOpen, onClose, action = "continue" }: LoginPromptModalProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    region: "",
    country: "",
    city: "",
    dateOfBirth: "",
    gender: ""
  });

  const [ageError, setAgeError] = useState("");

  // Use stable modal texts to prevent infinite re-renders
  const stableModalTexts = useMemo(() => [
    "Join Dedw3n",
    "Welcome back! Sign in to your account.",
    "Create your account to get started with Dedw3n.",
    "Full Name",
    "Enter your full name",
    "Username",
    "Enter your username",
    "Email",
    "Enter your email",
    "Date of Birth",
    "Gender",
    "Select your gender",
    "Male",
    "Female",
    "Other",
    "Location",
    "Password",
    "Enter your password",
    "Please wait...",
    "Sign In",
    "Create Account",
    "Don't have an account?",
    "Already have an account?",
    "Sign up",
    "Sign in",
    "By continuing, you agree to our",
    "Terms of Service",
    "and",
    "Privacy Policy",
    "You must be at least 13 years old to register"
  ], []);
  const { translations, isLoading } = useUnifiedBatchTranslation(stableModalTexts, 'instant');

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Validate age when date of birth changes
  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setFormData({ ...formData, dateOfBirth: dateValue });
    
    if (dateValue) {
      const age = calculateAge(dateValue);
      if (age < 18) {
        setAgeError(translations["You must be at least 13 years old to register"] || "You must be at least 18 years old to create an account.");
      } else {
        setAgeError("");
      }
    } else {
      setAgeError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Age verification for signup
    if (!isLogin && formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        toast({
          title: "Age Verification Failed",
          description: "You must be at least 18 years old to create an account.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({
          username: formData.username,
          password: formData.password
        });
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      } else {
        await registerMutation.mutateAsync({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender as "male" | "female" | "other" | null,
          region: formData.region as "Africa" | "South Asia" | "East Asia" | "Oceania" | "North America" | "Central America" | "South America" | "Middle East" | "Europe" | "Central Asia" | null,
          country: formData.country,
          city: formData.city,
        });
        toast({
          title: "Account created!",
          description: "Welcome to Dedw3n! You can now enjoy all features.",
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getActionMessage = () => {
    switch (action) {
      case "like":
        return "like posts and show your appreciation";
      case "comment":
        return "comment and join conversations";
      case "share":
        return "share amazing content with others";
      case "message":
        return "send messages and connect with people";
      case "follow":
        return "follow users and build your network";
      case "create":
        return "create posts and share your thoughts";
      case "buy":
        return "purchase products from our marketplace";
      case "sell":
        return "sell your products and services";
      default:
        return "access all the amazing features";
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case "like":
        return <Heart className="h-6 w-6 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-6 w-6 text-blue-500" />;
      case "share":
        return <Share2 className="h-6 w-6 text-green-500" />;
      case "message":
        return <MessageCircle className="h-6 w-6 text-purple-500" />;
      case "follow":
        return <Users className="h-6 w-6 text-indigo-500" />;
      case "buy":
      case "sell":
        return <ShoppingBag className="h-6 w-6 text-orange-500" />;
      default:
        return <User className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex-shrink-0">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {translations["Join Dedw3n"] || "Join Dedw3n"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {isLogin ? 
                (translations["Welcome back! Sign in to your account."] || "Welcome back! Sign in to your account.") : 
                (translations["Create your account to get started with Dedw3n."] || "Create your account to get started with Dedw3n.")
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">{translations["Full Name"] || "Full Name"}</Label>
              <Input
                id="name"
                type="text"
                placeholder={translations["Enter your full name"] || "Enter your full name"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">{translations["Username"] || "Username"}</Label>
            <Input
              id="username"
              type="text"
              placeholder={translations["Enter your username"] || "Enter your username"}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="email">{translations["Email"] || "Email"}</Label>
              <Input
                id="email"
                type="email"
                placeholder={translations["Enter your email"] || "Enter your email"}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {translations["Date of Birth"] || "Date of Birth"}
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleDateOfBirthChange}
                required={!isLogin}
                max={new Date().toISOString().split('T')[0]}
                className={ageError ? "border-red-500" : ""}
              />
              {ageError && (
                <p className="text-sm text-red-500 flex items-center mt-1">
                  <Calendar className="mr-1 h-3 w-3" />
                  {ageError}
                </p>
              )}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="gender">{translations["Gender"] || "Gender"}</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={translations["Select your gender"] || "Select your gender"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{translations["Male"] || "Male"}</SelectItem>
                  <SelectItem value="female">{translations["Female"] || "Female"}</SelectItem>
                  <SelectItem value="other">{translations["Other"] || "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                {translations["Location"] || "Location"}
              </Label>
              <RegionSelector 
                currentRegion={formData.region}
                currentCountry={formData.country}
                currentCity={formData.city}
                onRegionChange={(region) => {
                  setFormData(prev => ({ ...prev, region }));
                }}
                onCountryChange={(country) => {
                  setFormData(prev => ({ ...prev, country }));
                }}
                onCityChange={(city) => {
                  setFormData(prev => ({ ...prev, city }));
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{translations["Password"] || "Password"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={translations["Enter your password"] || "Enter your password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-900 text-white" 
              disabled={Boolean(loginMutation.isPending || registerMutation.isPending || (!isLogin && ageError))}
            >
              {(loginMutation.isPending || registerMutation.isPending) ? 
                (translations["Please wait..."] || "Please wait...") : 
                isLogin ? 
                  (translations["Sign In"] || "Sign In") : 
                  (translations["Create Account"] || "Create Account")
              }
            </Button>
          </form>

          <div className="text-center">
            <Separator className="my-4" />
            <p className="text-sm text-gray-600">
              {isLogin ? 
                (translations["Don't have an account?"] || "Don't have an account?") : 
                (translations["Already have an account?"] || "Already have an account?")
              }{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold text-blue-600"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 
                  (translations["Sign up"] || "Sign up") : 
                  (translations["Sign in"] || "Sign in")
                }
              </Button>
            </p>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              {translations["By continuing, you agree to our"] || "By continuing, you agree to our"}{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-blue-600 underline"
                onClick={() => setLocation("/terms")}
              >
                {translations["Terms of Service"] || "Terms of Service"}
              </Button>{" "}
              {translations["and"] || "and"}{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-blue-600 underline"
                onClick={() => setLocation("/privacy")}
              >
                {translations["Privacy Policy"] || "Privacy Policy"}
              </Button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}