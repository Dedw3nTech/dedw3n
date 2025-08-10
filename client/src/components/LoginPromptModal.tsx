import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
const dedw3nLogo = "/attached_assets/Dedw3n Logo.png";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import RegionSelector from "@/components/RegionSelector";
import { useTypedTranslation, useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { PasswordStrengthValidator } from "@/components/PasswordStrengthValidator";

import { useEmailValidation } from "@/hooks/use-email-validation";
import { useUnifiedRecaptcha } from '@/components/UnifiedRecaptchaProvider';

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
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Mail
} from "lucide-react";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string; // What action triggered this popup
}

export function LoginPromptModal({ isOpen, onClose, action = "continue" }: LoginPromptModalProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(action !== "register");
  const [showPassword, setShowPassword] = useState(false);
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const { executeRecaptcha } = useUnifiedRecaptcha();

  const { 
    validateEmail, 
    isValidating, 
    isValid: emailIsValid, 
    getValidationMessage,
    resetValidation 
  } = useEmailValidation();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    affiliatePartner: "",
    region: "",
    country: "",
    city: "",
    dateOfBirth: "",
    gender: ""
  });

  const [rememberPassword, setRememberPassword] = useState(false);

  const [ageError, setAgeError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);


  // Translation using typed hook
  const t = useTypedTranslation();

  // Load remembered credentials on component mount
  useEffect(() => {
    if (isLogin) {
      const rememberedCredentials = localStorage.getItem('dedwen_remembered_credentials');
      if (rememberedCredentials) {
        try {
          const credentials = JSON.parse(rememberedCredentials);
          
          // Check if credentials are not older than 30 days (for security)
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
          const isExpired = credentials.timestamp && (Date.now() - credentials.timestamp > thirtyDaysInMs);
          
          if (isExpired) {
            // Remove expired credentials
            localStorage.removeItem('dedwen_remembered_credentials');
          } else {
            // Load valid credentials
            setFormData(prev => ({
              ...prev,
              username: credentials.username || '',
              password: credentials.password || ''
            }));
            setRememberPassword(true);
          }
        } catch (error) {
          console.error('Failed to load remembered credentials:', error);
          localStorage.removeItem('dedwen_remembered_credentials');
        }
      }
    }
  }, [isLogin]);

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
        setAgeError(t["You must be at least 13 years old to register"] || "You must be at least 18 years old to create an account.");
      } else {
        setAgeError("");
      }
    } else {
      setAgeError("");
    }
  };

  // Email validation effect with debouncing
  useEffect(() => {
    if (formData.email && emailTouched && !isLogin) {
      validateEmail(formData.email);
    } else if (!formData.email || isLogin) {
      resetValidation();
    }
  }, [formData.email, emailTouched, isLogin, validateEmail, resetValidation]);

  // Reset email validation when switching between login/register
  useEffect(() => {
    resetValidation();
    setEmailTouched(false);
  }, [isLogin, resetValidation]);

  // No longer need CAPTCHA validation handler for Google reCAPTCHA v3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Age verification for signup
    if (!isLogin && formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        toast({
          title: t["Age Verification Failed"] || "Age Verification Failed",
          description: t["You must be at least 18 years old to create an account."] || "You must be at least 18 years old to create an account.",
          variant: "destructive",
        });
        return;
      }
    }

    // Email validation for signup
    if (!isLogin && emailTouched && emailIsValid === false) {
      toast({
        title: t["Email Validation Failed"] || "Email Validation Failed",
        description: getValidationMessage() || t["Please enter a valid email address."] || "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Prevent submission while email is being validated
    if (!isLogin && isValidating) {
      toast({
        title: t["Please wait"] || "Please wait",
        description: t["Email validation in progress..."] || "Email validation in progress...",
        variant: "default"
      });
      return;
    }

    try {
      // Get reCAPTCHA token invisibly (no UI displayed)
      let recaptchaToken = null;
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha(isLogin ? 'login' : 'register');
          console.log(`[RECAPTCHA] Generated invisible token for ${isLogin ? 'login' : 'register'}`);
        } catch (recaptchaError) {
          console.warn('[RECAPTCHA] Token generation failed, proceeding without token:', recaptchaError);
        }
      }

      if (isLogin) {
        await loginMutation.mutateAsync({
          username: formData.username,
          password: formData.password,
          recaptchaToken
        });
        
        // Handle remember password functionality
        if (rememberPassword) {
          // Save credentials to localStorage
          const credentialsToSave = {
            username: formData.username,
            password: formData.password,
            timestamp: Date.now()
          };
          localStorage.setItem('dedwen_remembered_credentials', JSON.stringify(credentialsToSave));
        } else {
          // Clear remembered credentials if checkbox is unchecked
          localStorage.removeItem('dedwen_remembered_credentials');
        }
        
        toast({
          title: t["Welcome back!"] || "Welcome back!",
          description: t["You've successfully logged in."] || "You've successfully logged in.",
        });
      } else {
        await registerMutation.mutateAsync({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          affiliatePartner: formData.affiliatePartner,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender as "male" | "female" | "other" | null,
          region: formData.region as "Africa" | "South Asia" | "East Asia" | "Oceania" | "North America" | "Central America" | "South America" | "Middle East" | "Europe" | "Central Asia" | null,
          country: formData.country,
          city: formData.city,
          recaptchaToken
        });
        toast({
          title: t["Account created!"] || "Account created!",
          description: t["Welcome to Dedw3n! You can now enjoy all features."] || "Welcome to Dedw3n! You can now enjoy all features.",
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
              {t["Dedw3n"] || "Dedw3n"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {isLogin ? 
                (t["Welcome back! Sign in to your account."] || "Welcome back! Sign in to your account.") : 
                (t["Create your account to get started with Dedw3n."] || "Create your account to get started with Dedw3n.")
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">{t["Full Name"] || "Full Name"}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t["Enter your full name"] || "Enter your full name"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">{t["Username"] || "Username"}</Label>
            <Input
              id="username"
              type="text"
              placeholder={t["Choose a username"] || "Choose a username"}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                {t["Email"] || "Email"}
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder={t["Enter your email"] || "Enter your email"}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (!emailTouched) setEmailTouched(true);
                  }}
                  onBlur={() => setEmailTouched(true)}
                  required={!isLogin}
                  className={`pr-10 ${
                    emailTouched && formData.email ? (
                      emailIsValid === true ? "border-green-500 focus:ring-green-500" :
                      emailIsValid === false ? "border-red-500 focus:ring-red-500" :
                      "border-blue-500 focus:ring-blue-500"
                    ) : ""
                  }`}
                />
                {emailTouched && formData.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isValidating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : emailIsValid === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : emailIsValid === false ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {emailTouched && formData.email && (
                <div className="text-sm">
                  {isValidating ? (
                    <p className="text-blue-600 flex items-center">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      {t["Validating email..."] || "Validating email..."}
                    </p>
                  ) : emailIsValid === true ? (
                    <p className="text-green-600 flex items-center">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {t["Email is valid and deliverable"] || "Email is valid and deliverable"}
                    </p>
                  ) : emailIsValid === false ? (
                    <p className="text-red-500 flex items-center">
                      <XCircle className="mr-1 h-3 w-3" />
                      {getValidationMessage() || t["Invalid email address"] || "Invalid email address"}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {t["Date of Birth"] || "Date of Birth"}
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
              <Label htmlFor="gender">{t["Gender"] || "Gender"}</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t["Select your gender"] || "Select your gender"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t["Male"] || "Male"}</SelectItem>
                  <SelectItem value="female">{t["Female"] || "Female"}</SelectItem>
                  <SelectItem value="other">{t["Other"] || "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-2">
              <Label className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                {t["Location"] || "Location"}
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
            <Label htmlFor="password">{t["Password"] || "Password"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t["Enter your password"] || "Enter your password"}
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

          {/* Affiliate Partner Field - Only show for registration */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="affiliatePartner">{t["Affiliate Partner"] || "Affiliate Partner"}</Label>
              <Input
                id="affiliatePartner"
                type="text"
                placeholder={t["Enter affiliate partner code (optional)"] || "Enter affiliate partner code (optional)"}
                value={formData.affiliatePartner}
                onChange={(e) => setFormData({ ...formData, affiliatePartner: e.target.value })}
              />
            </div>
          )}

          {/* Remember Password Checkbox - Only show for login */}
          {isLogin && (
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="remember-password"
                checked={rememberPassword}
                onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                className="scale-75"
              />
              <Label 
                htmlFor="remember-password" 
                className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                style={{ fontSize: '10px', fontWeight: 'normal' }}
              >
                {t["Remember Password"] || "Remember Password"}
              </Label>
            </div>
          )}



          <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-900 text-white" 
              disabled={Boolean(
                loginMutation.isPending || 
                registerMutation.isPending || 
                (!isLogin && ageError) ||
                (!isLogin && isValidating) ||
                (!isLogin && emailTouched && emailIsValid === false)
              )}
            >
              {(loginMutation.isPending || registerMutation.isPending) ? 
                (t["Please wait..."] || "Please wait...") : 
                isLogin ? 
                  (t["Sign In"] || "Sign In") : 
                  (t["Create Account"] || "Create Account")
              }
            </Button>
          </form>

          <div className="text-center">
            <Separator className="my-4" />
            <p className="text-sm text-gray-600">
              {isLogin ? 
                (t["Don't have an account?"] || "Don't have an account?") : 
                (t["Already have an account?"] || "Already have an account?")
              }{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-semibold text-blue-600"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 
                  (t["Sign up"] || "Sign up") : 
                  (t["Sign in"] || "Sign in")
                }
              </Button>
            </p>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              {t["By continuing, you agree to our"] || "By continuing, you agree to our"}{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-blue-600 underline"
                onClick={() => setLocation("/terms")}
              >
                {t["Terms of Service"] || "Terms of Service"}
              </Button>{" "}
              {t["and"] || "and"}{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-xs text-blue-600 underline"
                onClick={() => setLocation("/privacy")}
              >
                {t["Privacy Policy"] || "Privacy Policy"}
              </Button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}