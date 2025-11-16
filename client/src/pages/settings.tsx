import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PageHeader from "@/components/layout/PageHeader";
import { getInitials } from "@/lib/utils";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  User,
  Bell as BellIcon,
  Lock as LockIcon,
  Lock,
  Key as KeyIcon,
  LogOut as LogOutIcon,
  Check,
  Globe,
  Wallet,
  Shield,
  Trash2,
  Languages,
  CreditCard,
  FileText,
  Save,
  Loader2,
  Bell,
  Cookie,
  Download,
  Upload,
  Briefcase,
  ChevronRight,
  ChevronDown
} from "lucide-react";

// The list of available regions in alphabetical order
const COUNTRY_OPTIONS = [
  { value: "africa", label: "Africa" },
  { value: "central-america", label: "Central America" },
  { value: "central-asia", label: "Central Asia" },
  { value: "east-asia", label: "East Asia" },
  { value: "europe", label: "Europe" },
  { value: "middle-east", label: "Middle East" },
  { value: "north-america", label: "North America" },
  { value: "oceania", label: "Oceania" },
  { value: "south-america", label: "South America" },
  { value: "south-asia", label: "South Asia" }
];

export default function SettingsPage() {
  usePageTitle({ title: "settings" });
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();

  // Translation strings for the settings page
  const settingsTexts = useMemo(() => [
    "Account Settings",
    "Password",
    "Region",
    "Notifications",
    "Security",
    "Privacy",
    "Change Password",
    "Current Password",
    "New Password",
    "Confirm Password",
    "Updating...",
    "Save",
    "Saving...",
    "Back",
    "Select Country",
    "Notification Preferences",
    "New Notification",
    "Get notified about important updates",
    "Receive email when you get a new notification",
    "New Message",
    "Receive alerts for new messages",
    "Receive email when you get a new message",
    "New Order",
    "Get notified when you receive an order",
    "Receive email when you receive a new order",
    "Email Notifications",
    "Sign-In & Security",
    "Sign-In Security Settings",
    "Two-Factor Authentication",
    "Add an extra layer of security to your account",
    "Always enabled for security",
    "Privacy",
    "Manage Cookies",
    "Control your cookie preferences",
    "Control cookie preferences and tracking settings",
    "Get a Copy of Your Data",
    "Get Copy of Data",
    "Download all your personal data",
    "Request a copy of your personal information",
    "AI Training",
    "Data for Enhancing Generative AI",
    "Control how your data is used for AI",
    "Choose whether to allow AI training with your data",
    "Suspend Profile",
    "Temporarily deactivate your account",
    "Account Closure",
    "Permanently delete your account",
    "Cookie Description",
    "We use cookies to enhance your browsing experience and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies.",
    "Essential Cookies",
    "Required for the site to function",
    "These cookies are necessary for the website to function and cannot be disabled.",
    "Performance Cookies",
    "Help us improve site performance",
    "These cookies help us analyze how visitors use our website.",
    "Functional Cookies",
    "Enable additional functionality",
    "These cookies enable enhanced functionality and personalization.",
    "Targeting Cookies",
    "Personalize your advertising experience",
    "These cookies may be set by our advertising partners to build a profile of your interests.",
    "We'll send a copy of your data to your registered email address.",
    "Sending...",
    "Request Data",
    "Your content may be used to help train and improve our generative AI models. You can opt out at any time.",
    "Allow my content to be used for AI training",
    "Do not use my content for AI training",
    "Success",
    "Cookie preferences saved successfully",
    "Profile Updated",
    "Update Failed",
    "Password Updated",
    "Preferences Updated",
    "Security Updated",
    "Account Deleted",
    "Delete Failed",
    "Invalid Image",
    "Fill All Fields",
    "Passwords Don't Match",
    "Cookie Preferences",
    "Cookie Management Interface",
    "Data Export Sent",
    "Data Export Failed",
    "AI Training Updated",
    "AI Training Failed",
    "Compliance Updated",
    "Career Updated"
  ], []);

  const { translations } = useMasterBatchTranslation(settingsTexts, 'high');
  
  // Create translation mapping
  const ts: Record<string, string> = {};
  settingsTexts.forEach((text, index) => {
    ts[text] = translations[index] || text;
  });
  
  const [activeTab, setActiveTab] = useState("password");
  const [profileSection, setProfileSection] = useState("profile-picture");
  const [showMobileList, setShowMobileList] = useState(true);
  
  // Language & Region subsection state
  const [languageSubsection, setLanguageSubsection] = useState<'menu' | 'region'>('menu');
  
  // Privacy subsection state
  const [privacySubsection, setPrivacySubsection] = useState<'menu' | 'cookies' | 'data-export' | 'ai-training'>('menu');
  
  // Notification subsection state
  const [notificationSubsection, setNotificationSubsection] = useState<'menu' | 'new-notification' | 'new-message' | 'new-order'>('menu');
  
  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [emailOnNewNotification, setEmailOnNewNotification] = useState(true);
  const [emailOnNewMessage, setEmailOnNewMessage] = useState(true);
  const [emailOnNewOrder, setEmailOnNewOrder] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [aiTrainingConsent, setAiTrainingConsent] = useState(false);
  
  // Cookie preferences
  const [essentialCookies] = useState(true); // Always enabled
  const [performanceCookies, setPerformanceCookies] = useState(true);
  const [functionalCookies, setFunctionalCookies] = useState(true);
  const [targetingCookies, setTargetingCookies] = useState(false);
  
  // Compliance Information states
  const [legalName, setLegalName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  
  // Career Information states
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setName(user.name || "");
      setUsername(user.username || "");
      setAvatarPreview(user.avatar || "");
      
      // These would typically come from user preferences in a real app
      setCurrency(localStorage.getItem("currency") || "GBP");
      setEmailOnNewNotification((user as any).emailOnNewNotification ?? true);
      setEmailOnNewMessage((user as any).emailOnNewMessage ?? true);
      setEmailOnNewOrder((user as any).emailOnNewOrder ?? true);
      setTwoFactorEnabled(user.twoFactorEnabled || false);
      setAiTrainingConsent((user as any).aiTrainingConsent || false);
      
      // Load cookie preferences from localStorage
      setPerformanceCookies(localStorage.getItem("performanceCookies") !== "false");
      setFunctionalCookies(localStorage.getItem("functionalCookies") !== "false");
      setTargetingCookies(localStorage.getItem("targetingCookies") === "true");
      
      // Load compliance information from localStorage
      setLegalName(localStorage.getItem("legalName") || "");
      setDateOfBirth(localStorage.getItem("dateOfBirth") || "");
      setPhoneNumber(localStorage.getItem("phoneNumber") || "");
      setAddress(localStorage.getItem("address") || "");
      
      // Load career information from localStorage
      setJobTitle(localStorage.getItem("jobTitle") || "");
      setCompany(localStorage.getItem("company") || "");
      setIndustry(localStorage.getItem("industry") || "");
      setYearsOfExperience(localStorage.getItem("yearsOfExperience") || "");
    }
  }, [user]);
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "PATCH",
        "/api/users/profile",
        formData,
        { isFormData: true }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("misc.success"),
        description: t("settings.profileUpdated"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("misc.error"),
        description: error.message || t("settings.updateFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest(
        "POST",
        "/api/auth/update-password",
        data
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update password");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("misc.success"),
        description: t("settings.passwordUpdated"),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: t("misc.error"),
        description: error.message || t("settings.updateFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Preferences update mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: {
      currency: string;
      emailOnNewNotification: boolean;
      emailOnNewMessage: boolean;
      emailOnNewOrder: boolean;
    }) => {
      // Save to localStorage
      localStorage.setItem("currency", preferences.currency);
      
      // Save email notification preferences to database
      const response = await apiRequest(
        "PATCH",
        "/api/users/notification-preferences",
        {
          emailOnNewNotification: preferences.emailOnNewNotification,
          emailOnNewMessage: preferences.emailOnNewMessage,
          emailOnNewOrder: preferences.emailOnNewOrder,
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update notification preferences");
      }
      
      return preferences;
    },
    onSuccess: () => {
      toast({
        title: t("misc.success"),
        description: t("settings.preferencesUpdated"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("misc.error"),
        description: error.message || t("settings.updateFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Security settings update mutation
  const updateSecurityMutation = useMutation({
    mutationFn: async (settings: { twoFactorEnabled: boolean }) => {
      const response = await apiRequest(
        "PATCH",
        "/api/users/security-settings",
        settings
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update security settings");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("misc.success"),
        description: t("settings.securityUpdated"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("misc.error"),
        description: error.message || t("settings.updateFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Account deletion mutation (simulated)
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // This would be a real API call in production
      const response = await apiRequest("DELETE", "/api/users/account");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete account");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("misc.success"),
        description: t("settings.accountDeleted"),
      });
      // Force logout
      queryClient.setQueryData(["/api/auth/me"], null);
      navigate("/");
    },
    onError: () => {
      toast({
        title: t("misc.error"),
        description: t("settings.deleteFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: t("misc.error"),
        description: t("settings.invalidImage"),
        variant: "destructive",
      });
      return;
    }
    
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };
  
  // Handle profile update
  const handleProfileUpdate = () => {
    if (!user) return;
    
    const formData = new FormData();
    formData.append("email", email);
    
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }
    
    updateProfileMutation.mutate(formData);
  };
  
  // Handle password update
  const handlePasswordUpdate = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: t("misc.error"),
        description: t("settings.fillAllFields"),
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t("misc.error"),
        description: t("settings.passwordsNotMatch"),
        variant: "destructive",
      });
      return;
    }
    
    updatePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };
  
  // Handle preferences update
  const handlePreferencesUpdate = () => {
    updatePreferencesMutation.mutate({
      currency, // Use the same variable but it now represents country
      emailOnNewNotification,
      emailOnNewMessage,
      emailOnNewOrder,
    });
  };
  
  // Handle security settings update
  const handleSecurityUpdate = () => {
    updateSecurityMutation.mutate({
      twoFactorEnabled,
    });
  };
  
  // Handle account deletion
  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };
  
  // Handle manage cookies
  const handleManageCookies = () => {
    toast({
      title: t("settings.cookiePreferences"),
      description: t("settings.cookieManagementInterface"),
    });
  };
  
  // Data export mutation
  const dataExportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/users/export-data", {});
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to request data export");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("misc.success"),
        description: t("settings.dataExportSent"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("misc.error"),
        description: error.message || t("settings.dataExportFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Handle data export request
  const handleDataExport = () => {
    dataExportMutation.mutate();
  };
  
  // AI training consent mutation
  const aiConsentMutation = useMutation({
    mutationFn: async (consent: boolean) => {
      const response = await apiRequest("PATCH", "/api/users/ai-training-consent", {
        aiTrainingConsent: consent
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update AI training consent");
      }
      
      return response.json();
    },
    onSuccess: () => {
      localStorage.setItem("aiTrainingConsent", aiTrainingConsent.toString());
      toast({
        title: t("misc.success"),
        description: t("settings.aiTrainingUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("misc.error"),
        description: error.message || t("settings.aiTrainingFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Handle AI training consent update
  const handleAiConsentUpdate = () => {
    aiConsentMutation.mutate(aiTrainingConsent);
  };
  
  // Handle compliance information update
  const handleComplianceUpdate = () => {
    localStorage.setItem("legalName", legalName);
    localStorage.setItem("dateOfBirth", dateOfBirth);
    localStorage.setItem("phoneNumber", phoneNumber);
    localStorage.setItem("address", address);
    
    toast({
      title: t("misc.success"),
      description: t("settings.complianceUpdated"),
    });
  };
  
  // Handle career information update
  const handleCareerUpdate = () => {
    localStorage.setItem("jobTitle", jobTitle);
    localStorage.setItem("company", company);
    localStorage.setItem("industry", industry);
    localStorage.setItem("yearsOfExperience", yearsOfExperience);
    
    toast({
      title: t("misc.success"),
      description: t("settings.careerUpdated"),
    });
  };
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/auth");
    }
  }, [isAuthLoading, user, navigate]);
  
  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="bg-white md:bg-background min-h-screen">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <PageHeader
          title={ts["Account Settings"] || "Account Settings"}
          icon={<SettingsIcon className="h-6 w-6" />}
        />
      </div>
      
      {/* Mobile Header - Show list when showMobileList is true */}
      {showMobileList && (
        <div className="md:hidden bg-white">
          <div className="p-6">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="text-black">{ts["Account Settings"] || "Account Settings"}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <button
                    onClick={() => {
                      setActiveTab("password");
                      setShowMobileList(false);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    data-testid="mobile-menu-password"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Password"] || "Password"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("language");
                      setLanguageSubsection('menu');
                      setShowMobileList(false);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    data-testid="mobile-menu-region"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Region"] || "Region"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("notifications");
                      setNotificationSubsection('menu');
                      setShowMobileList(false);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    data-testid="mobile-menu-notifications"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Notifications"] || "Notifications"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("security");
                      setShowMobileList(false);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    data-testid="mobile-menu-security"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Security"] || "Security"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("privacy");
                      setPrivacySubsection('menu');
                      setShowMobileList(false);
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    data-testid="mobile-menu-privacy"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Privacy"] || "Privacy"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      <div className="container max-w-screen-xl py-0 md:py-6">
        <div className="flex flex-col md:flex-row gap-0 md:gap-6">
          {/* Left Sidebar Navigation - Hidden on Mobile */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <Card className="border-0">
              <CardContent className="p-0">
                <div className="divide-y">
                  <button
                    onClick={() => {
                      setActiveTab("password");
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                      activeTab === "password" ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                    data-testid="menu-password"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Password"] || "Password"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("language");
                      setLanguageSubsection('menu');
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                      activeTab === "language" ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                    data-testid="menu-region"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Region"] || "Region"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("notifications");
                      setNotificationSubsection('menu');
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                      activeTab === "notifications" ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                    data-testid="menu-notifications"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Notifications"] || "Notifications"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("security");
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                      activeTab === "security" ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                    data-testid="menu-security"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Security"] || "Security"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("privacy");
                      setPrivacySubsection('menu');
                    }}
                    className={`w-full flex items-center justify-between px-6 py-4 text-left transition-colors ${
                      activeTab === "privacy" ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                    data-testid="menu-privacy"
                  >
                    <span className="text-sm font-medium text-gray-900">{ts["Privacy"] || "Privacy"}</span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area - Always show on desktop, conditionally on mobile */}
          <div className={`flex-1 w-full md:w-auto ${showMobileList ? 'hidden md:block' : 'block'}`}>
            {/* Password Section */}
            {activeTab === "password" && (
              <div>
                {/* Mobile Section Header with Back Button */}
                <div className="md:hidden bg-white sticky top-0 z-10 border-b border-gray-200">
                  <div className="px-4 py-4">
                    <button
                      onClick={() => setShowMobileList(true)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
                      data-testid="button-back-to-settings"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      {ts["Account Settings"] || "Account Settings"}
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">{ts["Change Password"] || "Change Password"}</h2>
                  </div>
                </div>
                <div className="md:hidden px-4 py-6">
                  
                  <div className="space-y-6 bg-white">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="current-password">{ts["Current Password"] || "Current Password"}</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="new-password">{ts["New Password"] || "New Password"}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    
                    {/* Confirm New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{ts["Confirm Password"] || "Confirm Password"}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    
                    <Button
                      onClick={handlePasswordUpdate}
                      disabled={updatePasswordMutation.isPending}
                      className="w-full bg-black text-white hover:bg-gray-800"
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {ts["Updating..."] || "Updating..."}
                        </>
                      ) : (
                        ts["Save"] || "Save"
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Desktop Card */}
                <Card className="hidden md:block">
                  <CardHeader>
                    <CardTitle>{ts["Change Password"] || "Change Password"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="current-password-desktop">{ts["Current Password"] || "Current Password"}</Label>
                      <Input
                        id="current-password-desktop"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="new-password-desktop">{ts["New Password"] || "New Password"}</Label>
                      <Input
                        id="new-password-desktop"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    
                    {/* Confirm New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password-desktop">{ts["Confirm Password"] || "Confirm Password"}</Label>
                      <Input
                        id="confirm-password-desktop"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      onClick={handlePasswordUpdate}
                      disabled={updatePasswordMutation.isPending}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {ts["Updating..."] || "Updating..."}
                        </>
                      ) : (
                        ts["Save"] || "Save"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {/* Region Section */}
            {activeTab === "language" && (
              <div>
                {languageSubsection === 'menu' ? (
                  <div>
                    {/* Mobile Section Header with Back Button */}
                    <div className="md:hidden bg-white sticky top-0 z-10 border-b border-gray-200">
                      <div className="px-4 py-4">
                        <button
                          onClick={() => setShowMobileList(true)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
                          data-testid="button-back-to-settings"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                          {ts["Account Settings"] || "Account Settings"}
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">{ts["Region"] || "Region"}</h2>
                      </div>
                    </div>
                    <h2 className="hidden md:block text-2xl font-semibold mb-6">{ts["Region"] || "Region"}</h2>
                    <Card className="border-0">
                      <CardContent className="p-0">
                        <div className="divide-y">
                          <button
                            onClick={() => setLanguageSubsection('region')}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-region"
                          >
                            <span className="text-sm font-medium text-gray-900">{ts["Region"] || "Region"}</span>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <button
                        onClick={() => setLanguageSubsection('menu')}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
                        data-testid="button-back"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        {ts["Back"] || "Back"}
                      </button>
                      <CardTitle>
                        {ts["Region"] || "Region"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="currency">{ts["Region"] || "Region"}</Label>
                        <Select value={currency} onValueChange={setCurrency}>
                          <SelectTrigger id="currency">
                            <SelectValue placeholder={ts["Select Country"] || "Select Country"} />
                          </SelectTrigger>
                          <SelectContent>
                            {COUNTRY_OPTIONS.map((option: { value: string; label: string }) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        onClick={handlePreferencesUpdate}
                        disabled={updatePreferencesMutation.isPending}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        {updatePreferencesMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {ts["Saving..."] || "Saving..."}
                          </>
                        ) : (
                          ts["Save"] || "Save"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            )}
            
            {/* Notifications Section */}
            {activeTab === "notifications" && (
              <div>
                {notificationSubsection === 'menu' ? (
                  <div>
                    {/* Mobile Section Header with Back Button */}
                    <div className="md:hidden bg-white sticky top-0 z-10 border-b border-gray-200">
                      <div className="px-4 py-4">
                        <button
                          onClick={() => setShowMobileList(true)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
                          data-testid="button-back-to-settings"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                          {ts["Account Settings"] || "Account Settings"}
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">{ts["Notification Preferences"] || "Notification Preferences"}</h2>
                      </div>
                    </div>
                    <h2 className="hidden md:block text-2xl font-semibold mb-6">{ts["Notification Preferences"] || "Notification Preferences"}</h2>
                    <Card className="border-0">
                      <CardContent className="p-0">
                        <div className="divide-y">
                          <button
                            onClick={() => setNotificationSubsection('new-notification')}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-new-notification"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{ts["New Notification"] || "New Notification"}</div>
                              <p className="text-xs text-muted-foreground">
                                {ts["Receive email when you get a new notification"] || "Receive email when you get a new notification"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => setNotificationSubsection('new-message')}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-new-message"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{ts["New Message"] || "New Message"}</div>
                              <p className="text-xs text-muted-foreground">
                                {ts["Receive email when you get a new message"] || "Receive email when you get a new message"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => setNotificationSubsection('new-order')}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-new-order"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{ts["New Order"] || "New Order"}</div>
                              <p className="text-xs text-muted-foreground">
                                {ts["Receive email when you receive a new order"] || "Receive email when you receive a new order"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <button
                        onClick={() => setNotificationSubsection('menu')}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
                        data-testid="button-back"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        {ts["Back"] || "Back"}
                      </button>
                      <CardTitle>
                        {notificationSubsection === 'new-notification' && (ts["New Notification"] || "New Notification")}
                        {notificationSubsection === 'new-message' && (ts["New Message"] || "New Message")}
                        {notificationSubsection === 'new-order' && (ts["New Order"] || "New Order")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {notificationSubsection === 'new-notification' && (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {ts["Receive email when you get a new notification"] || "Receive email when you get a new notification"}
                          </p>
                          <div className="flex items-center justify-between">
                            <Label>{ts["Email Notifications"] || "Email Notifications"}</Label>
                            <Switch
                              checked={emailOnNewNotification}
                              onCheckedChange={setEmailOnNewNotification}
                              aria-label={ts["New Notification"] || "New Notification"}
                              data-testid="switch-email-notification"
                            />
                          </div>
                        </div>
                      )}
                      
                      {notificationSubsection === 'new-message' && (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {ts["Receive email when you get a new message"] || "Receive email when you get a new message"}
                          </p>
                          <div className="flex items-center justify-between">
                            <Label>{ts["Email Notifications"] || "Email Notifications"}</Label>
                            <Switch
                              checked={emailOnNewMessage}
                              onCheckedChange={setEmailOnNewMessage}
                              aria-label={ts["New Message"] || "New Message"}
                              data-testid="switch-email-message"
                            />
                          </div>
                        </div>
                      )}
                      
                      {notificationSubsection === 'new-order' && (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {ts["Receive email when you receive a new order"] || "Receive email when you receive a new order"}
                          </p>
                          <div className="flex items-center justify-between">
                            <Label>{ts["Email Notifications"] || "Email Notifications"}</Label>
                            <Switch
                              checked={emailOnNewOrder}
                              onCheckedChange={setEmailOnNewOrder}
                              aria-label={ts["New Order"] || "New Order"}
                              data-testid="switch-email-order"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        onClick={handlePreferencesUpdate}
                        disabled={updatePreferencesMutation.isPending}
                        className="bg-black text-white hover:bg-gray-800"
                      >
                        {updatePreferencesMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {ts["Saving..."] || "Saving..."}
                          </>
                        ) : (
                          ts["Save"] || "Save"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )}
              </div>
            )}
            
            {/* Security Section */}
            {activeTab === "security" && (
              <div>
                {/* Mobile Section Header with Back Button */}
                <div className="md:hidden bg-white sticky top-0 z-10 border-b border-gray-200">
                  <div className="px-4 py-4">
                    <button
                      onClick={() => setShowMobileList(true)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
                      data-testid="button-back-to-settings"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      {ts["Account Settings"] || "Account Settings"}
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">{ts["Security"] || "Security"}</h2>
                  </div>
                </div>
                <Card>
                <CardHeader className="hidden md:block">
                  <CardTitle>{ts["Sign-In Security Settings"] || "Sign-In Security Settings"}</CardTitle>
                </CardHeader>
              <CardContent className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{ts["Two-Factor Authentication"] || "Two-Factor Authentication"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {ts["Add an extra layer of security to your account"] || "Add an extra layer of security to your account"} ({ts["Always enabled for security"] || "Always enabled for security"})
                    </p>
                  </div>
                  <Switch
                    checked={true}
                    disabled={true}
                    aria-label={ts["Two-Factor Authentication"] || "Two-Factor Authentication"}
                    data-testid="switch-2fa"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSecurityUpdate}
                  disabled={updateSecurityMutation.isPending}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {updateSecurityMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {ts["Saving..."] || "Saving..."}
                    </>
                  ) : (
                    ts["Save"] || "Save"
                  )}
                </Button>
              </CardFooter>
              </Card>
              </div>
            )}
            
            {/* Privacy Section */}
            {activeTab === "privacy" && (
              <div>
                {privacySubsection === 'menu' ? (
                  <div>
                    {/* Mobile Section Header with Back Button */}
                    <div className="md:hidden bg-white sticky top-0 z-10 border-b border-gray-200">
                      <div className="px-4 py-4">
                        <button
                          onClick={() => setShowMobileList(true)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3"
                          data-testid="button-back-to-settings"
                        >
                          <ChevronRight className="h-4 w-4 rotate-180" />
                          {ts["Account Settings"] || "Account Settings"}
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">{ts["Privacy"] || "Privacy"}</h2>
                      </div>
                    </div>
                    <h2 className="hidden md:block text-2xl font-semibold mb-6">{ts["Privacy"] || "Privacy"}</h2>
                    <Card className="border-0">
                      <CardContent className="p-0">
                        <div className="divide-y">
                          <button
                            onClick={() => setPrivacySubsection('cookies')}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-cookies"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{ts["Manage Cookies"] || "Manage Cookies"}</div>
                              <p className="text-xs text-muted-foreground">
                                {ts["Control cookie preferences and tracking settings"] || "Control cookie preferences and tracking settings"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => setPrivacySubsection('data-export')}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-data-export"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{ts["Get Copy of Data"] || "Get Copy of Data"}</div>
                              <p className="text-xs text-muted-foreground">
                                {ts["Request a copy of your personal information"] || "Request a copy of your personal information"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => setPrivacySubsection('ai-training')}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-ai-training"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{ts["Data for Enhancing Generative AI"] || "Data for Enhancing Generative AI"}</div>
                              <p className="text-xs text-muted-foreground">
                                {ts["Choose whether to allow AI training with your data"] || "Choose whether to allow AI training with your data"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => navigate("/suspend-account")}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-suspend-profile"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{ts["Suspend Profile"] || "Suspend Profile"}</div>
                              <p className="text-xs text-muted-foreground">
                                {ts["Temporarily deactivate your account"] || "Temporarily deactivate your account"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => navigate("/close-account")}
                            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            data-testid="menu-close-account"
                          >
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">{ts["Account Closure"] || "Account Closure"}</div>
                              <p className="text-xs text-muted-foreground">
                                {ts["Permanently delete your account"] || "Permanently delete your account"}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <button
                        onClick={() => setPrivacySubsection('menu')}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
                        data-testid="button-back"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        {ts["Back"] || "Back"}
                      </button>
                      <CardTitle>
                        {privacySubsection === 'cookies' && (ts["Manage Cookies"] || "Manage Cookies")}
                        {privacySubsection === 'data-export' && (ts["Get Copy of Data"] || "Get Copy of Data")}
                        {privacySubsection === 'ai-training' && (ts["Data for Enhancing Generative AI"] || "Data for Enhancing Generative AI")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {privacySubsection === 'cookies' && (
                        <div className="space-y-6">
                          <p className="text-sm text-muted-foreground">
                            {ts["We use cookies to enhance your browsing experience and analyze our traffic. By clicking 'Accept All', you consent to our use of cookies."] || "We use cookies to enhance your browsing experience and analyze our traffic."}
                          </p>
                          
                          {/* Essential Cookies */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>{ts["Essential Cookies"] || "Essential Cookies"}</Label>
                                <p className="text-xs text-muted-foreground">
                                  {ts["These cookies are necessary for the website to function and cannot be disabled."] || "These cookies are necessary for the website to function and cannot be disabled."}
                                </p>
                              </div>
                              <Switch
                                checked={essentialCookies}
                                disabled={true}
                                aria-label={ts["Essential Cookies"] || "Essential Cookies"}
                                data-testid="switch-essential-cookies"
                              />
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* Performance Cookies */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>{ts["Performance Cookies"] || "Performance Cookies"}</Label>
                                <p className="text-xs text-muted-foreground">
                                  {ts["These cookies help us analyze how visitors use our website."] || "These cookies help us analyze how visitors use our website."}
                                </p>
                              </div>
                              <Switch
                                checked={performanceCookies}
                                onCheckedChange={setPerformanceCookies}
                                aria-label={ts["Performance Cookies"] || "Performance Cookies"}
                                data-testid="switch-performance-cookies"
                              />
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* Functional Cookies */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>{ts["Functional Cookies"] || "Functional Cookies"}</Label>
                                <p className="text-xs text-muted-foreground">
                                  {ts["These cookies enable enhanced functionality and personalization."] || "These cookies enable enhanced functionality and personalization."}
                                </p>
                              </div>
                              <Switch
                                checked={functionalCookies}
                                onCheckedChange={setFunctionalCookies}
                                aria-label={ts["Functional Cookies"] || "Functional Cookies"}
                                data-testid="switch-functional-cookies"
                              />
                            </div>
                          </div>
                          
                          <Separator />
                          
                          {/* Targeting Cookies */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <Label>{ts["Targeting Cookies"] || "Targeting Cookies"}</Label>
                                <p className="text-xs text-muted-foreground">
                                  {ts["These cookies may be set by our advertising partners to build a profile of your interests."] || "These cookies may be set by our advertising partners to build a profile of your interests."}
                                </p>
                              </div>
                              <Switch
                                checked={targetingCookies}
                                onCheckedChange={setTargetingCookies}
                                aria-label={ts["Targeting Cookies"] || "Targeting Cookies"}
                                data-testid="switch-targeting-cookies"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {privacySubsection === 'data-export' && (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {ts["We'll send a copy of your data to your registered email address."] || "We'll send a copy of your data to your registered email address."}
                          </p>
                          <Button
                            onClick={handleDataExport}
                            disabled={dataExportMutation.isPending}
                            data-testid="button-data-export"
                            className="w-full bg-black text-white hover:bg-gray-800"
                          >
                            {dataExportMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {ts["Sending..."] || "Sending..."}
                              </>
                            ) : (
                              ts["Request Data"] || "Request Data"
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {privacySubsection === 'ai-training' && (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {ts["Your content may be used to help train and improve our generative AI models. You can opt out at any time."] || "Your content may be used to help train and improve our generative AI models. You can opt out at any time."}
                          </p>
                          <RadioGroup
                            value={aiTrainingConsent ? "on" : "off"}
                            onValueChange={(value) => setAiTrainingConsent(value === "on")}
                            className="flex flex-col space-y-3"
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem 
                                value="on" 
                                id="ai-training-on" 
                                data-testid="radio-ai-consent-on"
                                className="border-black text-black"
                              />
                              <Label htmlFor="ai-training-on" className="cursor-pointer font-normal">
                                {ts["Allow my content to be used for AI training"] || "Allow my content to be used for AI training"}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem 
                                value="off" 
                                id="ai-training-off" 
                                data-testid="radio-ai-consent-off"
                                className="border-black text-black"
                              />
                              <Label htmlFor="ai-training-off" className="cursor-pointer font-normal">
                                {ts["Do not use my content for AI training"] || "Do not use my content for AI training"}
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </CardContent>
                    
                    {(privacySubsection === 'cookies' || privacySubsection === 'ai-training') && (
                      <CardFooter className="flex justify-end">
                        <Button
                          onClick={privacySubsection === 'cookies' ? () => {
                            localStorage.setItem('performanceCookies', performanceCookies.toString());
                            localStorage.setItem('functionalCookies', functionalCookies.toString());
                            localStorage.setItem('targetingCookies', targetingCookies.toString());
                            toast({
                              title: ts["Success"] || "Success",
                              description: ts["Cookie preferences saved successfully"] || "Cookie preferences saved successfully",
                            });
                          } : handleAiConsentUpdate}
                          className="bg-black text-white hover:bg-gray-800"
                          data-testid="button-save-privacy"
                        >
                          {ts["Save"] || "Save"}
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}