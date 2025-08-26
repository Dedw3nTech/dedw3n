import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
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
import { useNameValidation } from "@/hooks/use-name-validation";
import { useUnifiedRecaptcha } from '@/components/UnifiedRecaptchaProvider';
import { useAffiliateVerification } from "@/hooks/use-affiliate-verification";
import { useUsernameVerification } from "@/hooks/use-username-verification";
import { usePasswordStrength } from "@/hooks/use-password-strength";

import { 
  User,
  Eye, 
  EyeOff, 
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2
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

  const {
    validateName,
    isValidating: isValidatingName,
    isValid: nameIsValid,
    getValidationMessage: getNameValidationMessage,
    resetValidation: resetNameValidation
  } = useNameValidation();

  const {
    verifyPartnerCode,
    isVerifying: isVerifyingAffiliate,
    isValid: affiliateIsValid,
    partner: affiliatePartner,
    error: affiliateError,
    message: affiliateMessage
  } = useAffiliateVerification();

  const {
    verifyUsername,
    isVerifying: isVerifyingUsername,
    isAvailable: usernameIsAvailable,
    error: usernameError,
    message: usernameMessage,
    resetVerification: resetUsernameVerification
  } = useUsernameVerification();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    affiliatePartner: "",
    region: "",
    country: "",
    city: "",
    language: "",
    dateOfBirth: "",
    gender: ""
  });

  // Password strength validation (only for registration)
  const { result: passwordStrength, isValidating: isValidatingPassword } = usePasswordStrength(!isLogin ? formData.password : '');

  const [rememberPassword, setRememberPassword] = useState(false);

  const [ageError, setAgeError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [affiliateTouched, setAffiliateTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);


  // Translation using typed hook
  const t = useTypedTranslation();

  // Sync isLogin state with action prop changes
  useEffect(() => {
    setIsLogin(action !== "register");
  }, [action]);

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
        setAgeError(t["You must be at least 18 years old to create an account"] || "You must be at least 18 years old to create an account.");
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

  // Name validation effect with debouncing
  useEffect(() => {
    if (formData.firstName && nameTouched && !isLogin) {
      const timer = setTimeout(() => {
        validateName(formData.firstName);
      }, 500); // Debounce for 500ms
      return () => clearTimeout(timer);
    } else if (!formData.firstName || isLogin) {
      resetNameValidation();
    }
  }, [formData.firstName, nameTouched, isLogin, validateName, resetNameValidation]);

  // Reset validation when switching between login/register
  useEffect(() => {
    resetValidation();
    resetNameValidation();
    resetUsernameVerification();
    setEmailTouched(false);
    setNameTouched(false);
    setAffiliateTouched(false);
    setUsernameTouched(false);
  }, [isLogin, resetValidation, resetNameValidation, resetUsernameVerification]);

  // Affiliate partner verification effect with debouncing
  useEffect(() => {
    if (affiliateTouched && formData.affiliatePartner && !isLogin) {
      const timer = setTimeout(() => {
        verifyPartnerCode(formData.affiliatePartner);
      }, 500); // Debounce for 500ms
      return () => clearTimeout(timer);
    }
  }, [formData.affiliatePartner, affiliateTouched, isLogin, verifyPartnerCode]);

  // Username verification effect with debouncing
  useEffect(() => {
    if (usernameTouched && formData.username && !isLogin) {
      const timer = setTimeout(() => {
        verifyUsername(formData.username);
      }, 500); // Debounce for 500ms
      return () => clearTimeout(timer);
    }
  }, [formData.username, usernameTouched, isLogin, verifyUsername]);

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
          recaptchaToken: recaptchaToken || undefined
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
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          affiliatePartner: formData.affiliatePartner,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender as "male" | "female" | "other" | null,
          region: formData.region as "Africa" | "South Asia" | "East Asia" | "Oceania" | "North America" | "Central America" | "South America" | "Middle East" | "Europe" | "Central Asia" | null,
          country: formData.country,
          city: formData.city,
          preferredLanguage: formData.language,
          recaptchaToken: recaptchaToken || undefined
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t["First Name"] || "First Name"}</Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    type="text"
                    placeholder={t["Enter your first name"] || "Enter your first name"}
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({ ...formData, firstName: e.target.value });
                      if (!nameTouched && e.target.value) setNameTouched(true);
                    }}
                    onBlur={() => {
                      if (formData.firstName) setNameTouched(true);
                    }}
                    required={!isLogin}
                    className={`pr-10 ${
                      nameTouched && formData.firstName ? (
                        nameIsValid === true ? "border-green-500 focus:ring-green-500" :
                        nameIsValid === false ? "border-red-500 focus:ring-red-500" :
                        "border-blue-500 focus:ring-blue-500"
                      ) : ""
                    }`}
                  />
                  {nameTouched && formData.firstName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isValidatingName ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : nameIsValid === true ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : nameIsValid === false ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
                {nameTouched && formData.firstName && (
                  <div className="text-sm">
                    {isValidatingName ? (
                      <p className="text-blue-600 flex items-center">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        {t["Verifying name authenticity..."] || "Verifying name authenticity..."}
                      </p>
                    ) : nameIsValid === true ? (
                      <p className="text-green-600 flex items-center">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {getNameValidationMessage() || t["Name verified as genuine"] || "Name verified as genuine"}
                      </p>
                    ) : nameIsValid === false ? (
                      <p className="text-red-500 flex items-center">
                        <XCircle className="mr-1 h-3 w-3" />
                        {getNameValidationMessage() || t["Name appears invalid or gibberish"] || "Name appears invalid or gibberish"}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">{t["Surname"] || "Surname"}</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder={t["Enter your surname"] || "Enter your surname"}
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData({ ...formData, lastName: e.target.value });
                  }}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">{t["Username"] || "Username"}</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder={t["Choose a username"] || "Choose a username"}
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  if (!usernameTouched && e.target.value && !isLogin) setUsernameTouched(true);
                }}
                onBlur={() => {
                  if (formData.username && !isLogin) setUsernameTouched(true);
                }}
                required
                className={`pr-10 ${
                  usernameTouched && formData.username && !isLogin ? (
                    usernameIsAvailable === true ? "border-green-500 focus:ring-green-500" :
                    usernameIsAvailable === false ? "border-red-500 focus:ring-red-500" :
                    "border-blue-500 focus:ring-blue-500"
                  ) : ""
                }`}
              />
              {usernameTouched && formData.username && !isLogin && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isVerifyingUsername ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : usernameIsAvailable === true ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : usernameIsAvailable === false ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              )}
            </div>
            {usernameTouched && formData.username && !isLogin && (
              <div className="text-sm">
                {isVerifyingUsername ? (
                  <p className="text-blue-600 flex items-center">
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    {t["Checking username availability..."] || "Checking username availability..."}
                  </p>
                ) : usernameIsAvailable === true ? (
                  <p className="text-green-600 flex items-center">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {usernameMessage || t["Username is available"] || "Username is available"}
                  </p>
                ) : usernameIsAvailable === false ? (
                  <p className="text-red-500 flex items-center">
                    <XCircle className="mr-1 h-3 w-3" />
                    {usernameError || usernameMessage || t["Username is not available"] || "Username is not available"}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t["Password"] || "Password"}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isLogin ? (t["Enter your password"] || "Enter your password") : (t["Create your password"] || "Create your password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={!isLogin && formData.password && passwordStrength ? (
                  passwordStrength.isSecure ? "border-green-500 focus:ring-green-500" :
                  passwordStrength.isWeak ? "border-red-500 focus:ring-red-500" :
                  "border-orange-500 focus:ring-orange-500"
                ) : ""}
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
            {/* Password Strength Indicator - Only show for registration */}
            {!isLogin && formData.password && passwordStrength && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Password Strength:</span>
                  <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                    {passwordStrength.strengthLabel}
                  </span>
                </div>
                {/* Password strength progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score <= 1 ? 'bg-red-500' :
                      passwordStrength.score <= 2 ? 'bg-orange-500' :
                      passwordStrength.score <= 3 ? 'bg-yellow-500' :
                      passwordStrength.score <= 4 ? 'bg-green-500' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                {/* Feedback messages */}
                <div className="text-xs space-y-1">
                  {passwordStrength.feedback.map((message, index) => (
                    <div key={index} className={`flex items-start ${passwordStrength.color}`}>
                      {passwordStrength.isSecure ? (
                        <CheckCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      )}
                      <span>{message}</span>
                    </div>
                  ))}
                  {passwordStrength.isWeak && passwordStrength.suggestions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-gray-600 font-medium">Suggestions:</p>
                      {passwordStrength.suggestions.slice(0, 3).map((suggestion, index) => (
                        <div key={index} className="flex items-start text-gray-600 mt-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {passwordStrength.estimatedCrackTime !== 'Unknown' && (
                    <div className="flex items-center justify-between pt-1 text-gray-500">
                      <span>Estimated crack time:</span>
                      <span className="font-medium">{passwordStrength.estimatedCrackTime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Forgot Password Link - Show only on login */}
            {isLogin && (
              <div className="text-right">
                <Link 
                  href="/reset-password" 
                  className="text-sm hover:underline"
                  onClick={() => onClose()}
                >
                  <span className="text-gray-500">Forgot password? </span>
                  <span className="text-blue-600 hover:text-blue-500">Click here to reset</span>
                </Link>
              </div>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="email">
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
              <Label htmlFor="dateOfBirth">
                {t["Date of Birth"] || "Date of Birth"} <span className="text-gray-500 ml-1">(18+ required)</span>
              </Label>
              <div className="relative">
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleDateOfBirthChange}
                  required={!isLogin}
                  max={new Date().toISOString().split('T')[0]}
                  className={ageError ? "border-red-500" : formData.dateOfBirth && !ageError ? "border-green-500" : ""}
                />
                {formData.dateOfBirth && !ageError && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              {ageError ? (
                <p className="text-sm text-red-500 flex items-center mt-1">
                  <XCircle className="mr-1 h-3 w-3" />
                  {ageError}
                </p>
              ) : formData.dateOfBirth && !ageError ? (
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {t["Age verified - you are eligible to create an account"] || "Age verified - you are eligible to create an account"}
                </p>
              ) : null}
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
                  <SelectItem value="female">{t["Female"] || "Female"}</SelectItem>
                  <SelectItem value="male">{t["Male"] || "Male"}</SelectItem>
                  <SelectItem value="other">{t["Other"] || "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}


          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="language">{t["Language"] || "Language"}</Label>
              <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                <SelectTrigger>
                  <SelectValue placeholder={t["Select your language"] || "Select your language"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t["English"] || "English"}</SelectItem>
                  <SelectItem value="es">{t["Spanish"] || "Spanish"}</SelectItem>
                  <SelectItem value="fr">{t["French"] || "French"}</SelectItem>
                  <SelectItem value="de">{t["German"] || "German"}</SelectItem>
                  <SelectItem value="it">{t["Italian"] || "Italian"}</SelectItem>
                  <SelectItem value="pt">{t["Portuguese"] || "Portuguese"}</SelectItem>
                  <SelectItem value="ru">{t["Russian"] || "Russian"}</SelectItem>
                  <SelectItem value="ja">{t["Japanese"] || "Japanese"}</SelectItem>
                  <SelectItem value="ko">{t["Korean"] || "Korean"}</SelectItem>
                  <SelectItem value="zh">{t["Chinese"] || "Chinese"}</SelectItem>
                  <SelectItem value="ar">{t["Arabic"] || "Arabic"}</SelectItem>
                  <SelectItem value="hi">{t["Hindi"] || "Hindi"}</SelectItem>
                  <SelectItem value="nl">{t["Dutch"] || "Dutch"}</SelectItem>
                  <SelectItem value="sv">{t["Swedish"] || "Swedish"}</SelectItem>
                  <SelectItem value="da">{t["Danish"] || "Danish"}</SelectItem>
                  <SelectItem value="no">{t["Norwegian"] || "Norwegian"}</SelectItem>
                  <SelectItem value="fi">{t["Finnish"] || "Finnish"}</SelectItem>
                  <SelectItem value="pl">{t["Polish"] || "Polish"}</SelectItem>
                  <SelectItem value="tr">{t["Turkish"] || "Turkish"}</SelectItem>
                  <SelectItem value="th">{t["Thai"] || "Thai"}</SelectItem>
                  <SelectItem value="vi">{t["Vietnamese"] || "Vietnamese"}</SelectItem>
                  <SelectItem value="id">{t["Indonesian"] || "Indonesian"}</SelectItem>
                  <SelectItem value="ms">{t["Malay"] || "Malay"}</SelectItem>
                  <SelectItem value="tl">{t["Filipino"] || "Filipino"}</SelectItem>
                  <SelectItem value="he">{t["Hebrew"] || "Hebrew"}</SelectItem>
                  <SelectItem value="fa">{t["Persian"] || "Persian"}</SelectItem>
                  <SelectItem value="ur">{t["Urdu"] || "Urdu"}</SelectItem>
                  <SelectItem value="bn">{t["Bengali"] || "Bengali"}</SelectItem>
                  <SelectItem value="ta">{t["Tamil"] || "Tamil"}</SelectItem>
                  <SelectItem value="te">{t["Telugu"] || "Telugu"}</SelectItem>
                  <SelectItem value="ml">{t["Malayalam"] || "Malayalam"}</SelectItem>
                  <SelectItem value="kn">{t["Kannada"] || "Kannada"}</SelectItem>
                  <SelectItem value="gu">{t["Gujarati"] || "Gujarati"}</SelectItem>
                  <SelectItem value="mr">{t["Marathi"] || "Marathi"}</SelectItem>
                  <SelectItem value="pa">{t["Punjabi"] || "Punjabi"}</SelectItem>
                  <SelectItem value="or">{t["Odia"] || "Odia"}</SelectItem>
                  <SelectItem value="as">{t["Assamese"] || "Assamese"}</SelectItem>
                  <SelectItem value="ne">{t["Nepali"] || "Nepali"}</SelectItem>
                  <SelectItem value="si">{t["Sinhala"] || "Sinhala"}</SelectItem>
                  <SelectItem value="my">{t["Myanmar"] || "Myanmar"}</SelectItem>
                  <SelectItem value="km">{t["Khmer"] || "Khmer"}</SelectItem>
                  <SelectItem value="lo">{t["Lao"] || "Lao"}</SelectItem>
                  <SelectItem value="ka">{t["Georgian"] || "Georgian"}</SelectItem>
                  <SelectItem value="hy">{t["Armenian"] || "Armenian"}</SelectItem>
                  <SelectItem value="az">{t["Azerbaijani"] || "Azerbaijani"}</SelectItem>
                  <SelectItem value="kk">{t["Kazakh"] || "Kazakh"}</SelectItem>
                  <SelectItem value="ky">{t["Kyrgyz"] || "Kyrgyz"}</SelectItem>
                  <SelectItem value="uz">{t["Uzbek"] || "Uzbek"}</SelectItem>
                  <SelectItem value="tk">{t["Turkmen"] || "Turkmen"}</SelectItem>
                  <SelectItem value="tg">{t["Tajik"] || "Tajik"}</SelectItem>
                  <SelectItem value="mn">{t["Mongolian"] || "Mongolian"}</SelectItem>
                  <SelectItem value="bo">{t["Tibetan"] || "Tibetan"}</SelectItem>
                  <SelectItem value="dz">{t["Dzongkha"] || "Dzongkha"}</SelectItem>
                  <SelectItem value="am">{t["Amharic"] || "Amharic"}</SelectItem>
                  <SelectItem value="sw">{t["Swahili"] || "Swahili"}</SelectItem>
                  <SelectItem value="zu">{t["Zulu"] || "Zulu"}</SelectItem>
                  <SelectItem value="xh">{t["Xhosa"] || "Xhosa"}</SelectItem>
                  <SelectItem value="af">{t["Afrikaans"] || "Afrikaans"}</SelectItem>
                  <SelectItem value="ig">{t["Igbo"] || "Igbo"}</SelectItem>
                  <SelectItem value="yo">{t["Yoruba"] || "Yoruba"}</SelectItem>
                  <SelectItem value="ha">{t["Hausa"] || "Hausa"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Affiliate Partner Field - Only show for registration */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="affiliatePartner">{t["Affiliate Partner"] || "Affiliate Partner"}</Label>
              <div className="relative">
                <Input
                  id="affiliatePartner"
                  type="text"
                  placeholder={t["Enter affiliate partner code (optional)"] || "Enter affiliate partner code (optional)"}
                  value={formData.affiliatePartner}
                  onChange={(e) => {
                    setFormData({ ...formData, affiliatePartner: e.target.value });
                    if (!affiliateTouched && e.target.value) setAffiliateTouched(true);
                  }}
                  onBlur={() => {
                    if (formData.affiliatePartner) setAffiliateTouched(true);
                  }}
                  className={`pr-10 ${
                    affiliateTouched && formData.affiliatePartner ? (
                      affiliateIsValid === true ? "border-green-500 focus:ring-green-500" :
                      affiliateIsValid === false ? "border-red-500 focus:ring-red-500" :
                      "border-blue-500 focus:ring-blue-500"
                    ) : ""
                  }`}
                />
                {affiliateTouched && formData.affiliatePartner && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isVerifyingAffiliate ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : affiliateIsValid === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : affiliateIsValid === false ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {affiliateTouched && formData.affiliatePartner && (
                <div className="text-sm">
                  {isVerifyingAffiliate ? (
                    <p className="text-blue-600 flex items-center">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      {t["Verifying affiliate partner..."] || "Verifying affiliate partner..."}
                    </p>
                  ) : affiliateIsValid === true && affiliatePartner ? (
                    <p className="text-green-600 flex items-center">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {t["Affiliate partner verified:"] || "Affiliate partner verified:"} {affiliatePartner.name} ({affiliatePartner.company || "Individual"})
                    </p>
                  ) : affiliateIsValid === false ? (
                    <p className="text-red-500 flex items-center">
                      <XCircle className="mr-1 h-3 w-3" />
                      {affiliateError || t["Affiliate partner code not found"] || "Affiliate partner code not found"}
                    </p>
                  ) : null}
                </div>
              )}
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
                (!isLogin && isValidatingName) ||
                (!isLogin && emailTouched && emailIsValid === false) ||
                (!isLogin && nameTouched && nameIsValid === false) ||
                (!isLogin && passwordStrength?.isWeak && formData.password.length > 0) ||
                (!isLogin && (!formData.firstName || !formData.lastName || !formData.username || !formData.email || !formData.password || !formData.dateOfBirth || !formData.gender || !formData.language))
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



          {/* Account Switch Link in Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600 mb-3">
              {isLogin ? (
                <>
                  {t["Don't have an account?"] || "Don't have an account?"}{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-blue-600 underline"
                    onClick={() => setIsLogin(false)}
                  >
                    {t["Sign up"] || "Sign up"}
                  </Button>
                </>
              ) : (
                <>
                  {t["Already have an account?"] || "Already have an account?"}{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-blue-600 underline"
                    onClick={() => setIsLogin(true)}
                  >
                    {t["Sign in"] || "Sign in"}
                  </Button>
                </>
              )}
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