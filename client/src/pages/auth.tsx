import { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "wouter";
const dedw3nLogo = "/attached_assets/Dedw3n Logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import RegionSelector from "@/components/RegionSelector";
import { useTypedTranslation, useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { PasswordStrengthValidator } from "@/components/PasswordStrengthValidator";

import { useEmailValidation } from "@/hooks/use-email-validation";
import { useUnifiedRecaptcha } from '@/components/UnifiedRecaptchaProvider';
import { useAffiliateVerification } from "@/hooks/use-affiliate-verification";

import { ReportButton } from "@/components/ui/report-button";
// Remove usePageTitle import as it's not needed
import { 
  Eye, 
  EyeOff, 
  XCircle,
  CheckCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";

export default function AuthPage() {
  // Set page title
  useEffect(() => {
    document.title = "Authentication - Dedw3n";
  }, []);
  
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Parse URL parameters to determine initial mode
  const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode') || 'signin';
  
  const [isLogin, setIsLogin] = useState(initialMode === 'signin');
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

  const [authError, setAuthError] = useState<{type: string, message: string, show: boolean} | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    region: "",
    country: "",
    city: "",
    dateOfBirth: "",
    gender: "",
    affiliatePartnerCode: ""
  });

  const [rememberPassword, setRememberPassword] = useState(false);
  const [ageError, setAgeError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [affiliateCodeTouched, setAffiliateCodeTouched] = useState(false);
  
  // Use the affiliate verification hook
  const {
    isVerifying: isVerifyingAffiliate,
    isValid: isAffiliateValid,
    partner: affiliatePartner,
    error: affiliateError,
    message: affiliateMessage,
    verifyPartnerCode,
    clearVerification: clearAffiliateVerification
  } = useAffiliateVerification();
  // No longer need captcha state for Google reCAPTCHA v3 (invisible)

  // Translation using typed hook
  const t = useTypedTranslation();

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

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
            localStorage.removeItem('dedwen_remembered_credentials');
          } else {
            setFormData(prev => ({
              ...prev,
              username: credentials.username || "",
              password: credentials.password || ""
            }));
            setRememberPassword(true);
          }
        } catch (error) {
          console.error('Error loading remembered credentials:', error);
          localStorage.removeItem('dedwen_remembered_credentials');
        }
      }
    }
  }, [isLogin]);

  // Update URL when mode changes
  useEffect(() => {
    const mode = isLogin ? 'signin' : 'signup';
    window.history.replaceState({}, '', `/auth?mode=${mode}`);
  }, [isLogin]);

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setFormData({ ...formData, dateOfBirth: dateValue });
    
    if (dateValue) {
      const birthDate = new Date(dateValue);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      
      if (actualAge < 18) {
        setAgeError(t["You must be at least 18 years old to create an account"] || "You must be at least 18 years old to create an account.");
      } else {
        setAgeError("");
      }
    }
  };

  // Affiliate partner code verification with debouncing
  const handleAffiliateCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setFormData({ ...formData, affiliatePartnerCode: code });
    setAffiliateCodeTouched(true);

    if (code.trim().length === 0) {
      clearAffiliateVerification();
      return;
    }

    // Debounce the verification
    setTimeout(async () => {
      if (formData.affiliatePartnerCode === code) {
        await verifyPartnerCode(code);
      }
    }, 500);
  };

  const isFormValid = useMemo(() => {
    if (isLogin) {
      return formData.username && formData.password;
    } else {
      return (
        formData.name &&
        formData.username &&
        formData.email &&
        formData.password &&
        formData.dateOfBirth &&
        formData.gender &&
        formData.region &&
        formData.country &&
        formData.city &&
        !ageError &&
        emailIsValid === true
      );
    }
  }, [formData, isLogin, ageError, emailIsValid]);

  // Trigger email validation when email changes
  useEffect(() => {
    if (!isLogin && formData.email && emailTouched) {
      const timeoutId = setTimeout(() => {
        validateEmail(formData.email);
      }, 500); // Debounce validation
      
      return () => clearTimeout(timeoutId);
    }
  }, [formData.email, isLogin, emailTouched, validateEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      const missing = [];
      if (!formData.username) missing.push(t["Username"] || "Username");
      if (!formData.password) missing.push(t["Password"] || "Password");
      if (!isLogin) {
        if (!formData.name) missing.push(t["Full Name"] || "Full Name");
        if (!formData.email) missing.push(t["Email"] || "Email");
        if (!formData.dateOfBirth) missing.push(t["Date of Birth"] || "Date of Birth");
        if (!formData.gender) missing.push(t["Gender"] || "Gender");
        if (!formData.region) missing.push(t["Region"] || "Region");
        if (!formData.country) missing.push(t["Country"] || "Country");
        if (!formData.city) missing.push(t["City"] || "City");
      }
      
      toast({
        title: t["Please fill in all required fields"] || "Please fill in all required fields",
        description: missing.length > 0 ? 
          `${t["Missing"] || "Missing"}: ${missing.join(", ")}` : 
          t["Please complete all fields before submitting."] || "Please complete all fields before submitting.",
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
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender as "male" | "female" | "other" | null,
          region: formData.region as "Africa" | "South Asia" | "East Asia" | "Oceania" | "North America" | "Central America" | "South America" | "Middle East" | "Europe" | "Central Asia" | null,
          country: formData.country,
          city: formData.city,
          recaptchaToken: recaptchaToken || undefined
        });
        toast({
          title: t["Account created!"] || "Account created!",
          description: t["Welcome to Dedw3n! You can now enjoy all features."] || "Welcome to Dedw3n! You can now enjoy all features.",
        });
      }
      setLocation('/');
    } catch (error: any) {
      const errorMessage = error.message || "Something went wrong. Please try again.";
      setAuthError({
        type: isLogin ? "Login Error" : "Registration Error",
        message: errorMessage,
        show: true
      });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Don't render if user is already authenticated
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            asChild
            className="text-gray-600 hover:text-gray-900"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img 
                src={dedw3nLogo} 
                alt="Dedw3n Logo" 
                className="h-12 w-auto"
              />
            </div>
            
            <CardTitle className="text-2xl font-bold text-gray-900">
              {isLogin ? (t["Welcome Back"] || "Welcome Back") : (t["Dedw3n"] || "Dedw3n")}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {isLogin ? 
                (t["Sign in to your account to continue"] || "Sign in to your account to continue") : 
                (t["Create your account to get started"] || "Create your account to get started")
              }
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLogin 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setIsLogin(true)}
              >
                {t["Sign In"] || "Sign In"}
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isLogin 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setIsLogin(false)}
              >
                {t["Sign Up"] || "Sign Up"}
              </button>
            </div>

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
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {!isLogin && formData.password && (
                  <PasswordStrengthValidator 
                    password={formData.password} 
                    onPasswordChange={(password) => setFormData({ ...formData, password })}
                  />
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
                    {t["Date of Birth"] || "Date of Birth"} <span className="text-red-500 ml-1">(18+ required)</span>
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
                      <SelectItem value="male">{t["Male"] || "Male"}</SelectItem>
                      <SelectItem value="female">{t["Female"] || "Female"}</SelectItem>
                      <SelectItem value="other">{t["Other"] || "Other"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label>
                    {t["Location"] || "Location"}
                  </Label>
                  <RegionSelector
                    onRegionChange={(region) => setFormData({ ...formData, region, country: "", city: "" })}
                    onCountryChange={(country) => setFormData({ ...formData, country, city: "" })}
                    onCityChange={(city) => setFormData({ ...formData, city })}
                  />
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="affiliatePartnerCode">
                    {t["Affiliate Partner"] || "Affiliate Partner"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="affiliatePartnerCode"
                      type="text"
                      placeholder={t["Enter affiliate partner code (optional)"] || "Enter affiliate partner code (optional)"}
                      value={formData.affiliatePartnerCode}
                      onChange={handleAffiliateCodeChange}
                      className={`pr-10 ${
                        affiliateCodeTouched && formData.affiliatePartnerCode ? (
                          isAffiliateValid === true ? "border-green-500 focus:ring-green-500" :
                          isAffiliateValid === false ? "border-red-500 focus:ring-red-500" :
                          isVerifyingAffiliate ? "border-blue-500 focus:ring-blue-500" :
                          ""
                        ) : ""
                      }`}
                    />
                    {affiliateCodeTouched && formData.affiliatePartnerCode && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {isVerifyingAffiliate ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : isAffiliateValid === true ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : isAffiliateValid === false ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {affiliateCodeTouched && formData.affiliatePartnerCode && (
                    <div className="text-sm">
                      {isVerifyingAffiliate ? (
                        <p className="text-blue-600 flex items-center">
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          {t["Verifying affiliate partner code..."] || "Verifying affiliate partner code..."}
                        </p>
                      ) : isAffiliateValid === true && affiliatePartner ? (
                        <div className="text-green-600">
                          <p className="flex items-center">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {t["Valid affiliate partner:"] || "Valid affiliate partner:"} <strong className="ml-1">{affiliatePartner.name}</strong>
                          </p>
                          {affiliatePartner.company && (
                            <p className="text-xs mt-1 text-gray-600">
                              {t["Company"] || "Company"}: {affiliatePartner.company}
                            </p>
                          )}
                        </div>
                      ) : isAffiliateValid === false ? (
                        <p className="text-red-500 flex items-center">
                          <XCircle className="mr-1 h-3 w-3" />
                          {affiliateError || (t["Invalid affiliate partner code"] || "Invalid affiliate partner code")}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {isLogin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberPassword}
                    onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    {t["Remember my login details"] || "Remember my login details"}
                  </Label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid || loginMutation.isPending || registerMutation.isPending}
              >
                {loginMutation.isPending || registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? (t["Signing in..."] || "Signing in...") : (t["Creating account..."] || "Creating account...")}
                  </>
                ) : (
                  isLogin ? (t["Sign In"] || "Sign In") : (t["Create Account"] || "Create Account")
                )}
              </Button>
            </form>

            {/* Authentication Error Report Section */}
            {authError?.show && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                      {authError.type}
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      {authError.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuthError(null)}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                      <ReportButton 
                        errorType={authError.type}
                        errorMessage={authError.message}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAuthError(null)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-gray-600">
              {isLogin ? (
                <>
                  {t["Don't have an account?"] || "Don't have an account?"}{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                    onClick={() => setIsLogin(false)}
                  >
                    {t["Sign up"] || "Sign up"}
                  </button>
                </>
              ) : (
                <>
                  {t["Already have an account?"] || "Already have an account?"}{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                    onClick={() => setIsLogin(true)}
                  >
                    {t["Sign in"] || "Sign in"}
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            {t["By creating an account, you agree to our"] || "By creating an account, you agree to our"}{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              {t["Terms of Service"] || "Terms of Service"}
            </Link>{" "}
            {t["and"] || "and"}{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              {t["Privacy Policy"] || "Privacy Policy"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}