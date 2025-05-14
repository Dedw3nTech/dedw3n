import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import PageHeader from "@/components/layout/PageHeader";
import { getInitials } from "@/lib/utils";
import { useTranslation } from "react-i18next";
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
  Bell
} from "lucide-react";

// The list of available language options
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "pt", label: "Português" },
];

// The list of available country options
const COUNTRY_OPTIONS = [
  { value: "AF", label: "Afghanistan" },
  { value: "AL", label: "Albania" },
  { value: "DZ", label: "Algeria" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AG", label: "Antigua and Barbuda" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaijan" },
  { value: "BS", label: "Bahamas" },
  { value: "BH", label: "Bahrain" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BY", label: "Belarus" },
  { value: "BE", label: "Belgium" },
  { value: "BZ", label: "Belize" },
  { value: "BJ", label: "Benin" },
  { value: "BT", label: "Bhutan" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia and Herzegovina" },
  { value: "BW", label: "Botswana" },
  { value: "BR", label: "Brazil" },
  { value: "BN", label: "Brunei" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "CV", label: "Cabo Verde" },
  { value: "KH", label: "Cambodia" },
  { value: "CM", label: "Cameroon" },
  { value: "CA", label: "Canada" },
  { value: "CF", label: "Central African Republic" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoros" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "Congo (Democratic Republic)" },
  { value: "CR", label: "Costa Rica" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "HR", label: "Croatia" },
  { value: "CU", label: "Cuba" },
  { value: "CY", label: "Cyprus" },
  { value: "CZ", label: "Czech Republic" },
  { value: "DK", label: "Denmark" },
  { value: "DJ", label: "Djibouti" },
  { value: "DM", label: "Dominica" },
  { value: "DO", label: "Dominican Republic" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egypt" },
  { value: "SV", label: "El Salvador" },
  { value: "GQ", label: "Equatorial Guinea" },
  { value: "ER", label: "Eritrea" },
  { value: "EE", label: "Estonia" },
  { value: "SZ", label: "Eswatini" },
  { value: "ET", label: "Ethiopia" },
  { value: "FJ", label: "Fiji" },
  { value: "FI", label: "Finland" },
  { value: "FR", label: "France" },
  { value: "GA", label: "Gabon" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "DE", label: "Germany" },
  { value: "GH", label: "Ghana" },
  { value: "GR", label: "Greece" },
  { value: "GD", label: "Grenada" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GW", label: "Guinea-Bissau" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haiti" },
  { value: "HN", label: "Honduras" },
  { value: "HU", label: "Hungary" },
  { value: "IS", label: "Iceland" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IR", label: "Iran" },
  { value: "IQ", label: "Iraq" },
  { value: "IE", label: "Ireland" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italy" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japan" },
  { value: "JO", label: "Jordan" },
  { value: "KZ", label: "Kazakhstan" },
  { value: "KE", label: "Kenya" },
  { value: "KI", label: "Kiribati" },
  { value: "KP", label: "Korea (North)" },
  { value: "KR", label: "Korea (South)" },
  { value: "KW", label: "Kuwait" },
  { value: "KG", label: "Kyrgyzstan" },
  { value: "LA", label: "Laos" },
  { value: "LV", label: "Latvia" },
  { value: "LB", label: "Lebanon" },
  { value: "LS", label: "Lesotho" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libya" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lithuania" },
  { value: "LU", label: "Luxembourg" },
  { value: "MG", label: "Madagascar" },
  { value: "MW", label: "Malawi" },
  { value: "MY", label: "Malaysia" },
  { value: "MV", label: "Maldives" },
  { value: "ML", label: "Mali" },
  { value: "MT", label: "Malta" },
  { value: "MH", label: "Marshall Islands" },
  { value: "MR", label: "Mauritania" },
  { value: "MU", label: "Mauritius" },
  { value: "MX", label: "Mexico" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldova" },
  { value: "MC", label: "Monaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MA", label: "Morocco" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NL", label: "Netherlands" },
  { value: "NZ", label: "New Zealand" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Niger" },
  { value: "NG", label: "Nigeria" },
  { value: "MK", label: "North Macedonia" },
  { value: "NO", label: "Norway" },
  { value: "OM", label: "Oman" },
  { value: "PK", label: "Pakistan" },
  { value: "PW", label: "Palau" },
  { value: "PS", label: "Palestine" },
  { value: "PA", label: "Panama" },
  { value: "PG", label: "Papua New Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Peru" },
  { value: "PH", label: "Philippines" },
  { value: "PL", label: "Poland" },
  { value: "PT", label: "Portugal" },
  { value: "QA", label: "Qatar" },
  { value: "RO", label: "Romania" },
  { value: "RU", label: "Russia" },
  { value: "RW", label: "Rwanda" },
  { value: "KN", label: "Saint Kitts and Nevis" },
  { value: "LC", label: "Saint Lucia" },
  { value: "VC", label: "Saint Vincent and the Grenadines" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Sao Tome and Principe" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leone" },
  { value: "SG", label: "Singapore" },
  { value: "SK", label: "Slovakia" },
  { value: "SI", label: "Slovenia" },
  { value: "SB", label: "Solomon Islands" },
  { value: "SO", label: "Somalia" },
  { value: "ZA", label: "South Africa" },
  { value: "SS", label: "South Sudan" },
  { value: "ES", label: "Spain" },
  { value: "LK", label: "Sri Lanka" },
  { value: "SD", label: "Sudan" },
  { value: "SR", label: "Suriname" },
  { value: "SE", label: "Sweden" },
  { value: "CH", label: "Switzerland" },
  { value: "SY", label: "Syria" },
  { value: "TW", label: "Taiwan" },
  { value: "TJ", label: "Tajikistan" },
  { value: "TZ", label: "Tanzania" },
  { value: "TH", label: "Thailand" },
  { value: "TL", label: "Timor-Leste" },
  { value: "TG", label: "Togo" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad and Tobago" },
  { value: "TN", label: "Tunisia" },
  { value: "TR", label: "Turkey" },
  { value: "TM", label: "Turkmenistan" },
  { value: "TV", label: "Tuvalu" },
  { value: "UG", label: "Uganda" },
  { value: "UA", label: "Ukraine" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistan" },
  { value: "VU", label: "Vanuatu" },
  { value: "VA", label: "Vatican City" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "YE", label: "Yemen" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabwe" }
];

export default function SettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  
  const [activeTab, setActiveTab] = useState("account");
  
  // Form states
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [currency, setCurrency] = useState("GBP");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setAvatarPreview(user.avatar || "");
      
      // These would typically come from user preferences in a real app
      setLanguage(localStorage.getItem("i18nextLng") || "en");
      setCurrency(localStorage.getItem("currency") || "GBP");
      setEmailNotifications(localStorage.getItem("emailNotifications") !== "false");
      setMarketingEmails(localStorage.getItem("marketingEmails") !== "false");
      setTwoFactorEnabled(localStorage.getItem("twoFactorEnabled") === "true");
    }
  }, [user]);
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "PATCH",
        "/api/users/profile",
        formData,
        true
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
  
  // Preferences update mutation (simulated for now)
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: {
      language: string;
      currency: string;
      emailNotifications: boolean;
      marketingEmails: boolean;
    }) => {
      // Save to localStorage for demo purposes
      localStorage.setItem("i18nextLng", preferences.language);
      localStorage.setItem("currency", preferences.currency);
      localStorage.setItem("emailNotifications", preferences.emailNotifications.toString());
      localStorage.setItem("marketingEmails", preferences.marketingEmails.toString());
      
      // In a real app, this would be an API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Change language
      i18n.changeLanguage(preferences.language);
      
      return preferences;
    },
    onSuccess: () => {
      toast({
        title: t("misc.success"),
        description: t("settings.preferencesUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("misc.error"),
        description: error.message || t("settings.updateFailed"),
        variant: "destructive",
      });
    },
  });
  
  // Security settings update mutation (simulated)
  const updateSecurityMutation = useMutation({
    mutationFn: async (settings: { twoFactorEnabled: boolean }) => {
      // Save to localStorage for demo
      localStorage.setItem("twoFactorEnabled", settings.twoFactorEnabled.toString());
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return settings;
    },
    onSuccess: () => {
      toast({
        title: t("misc.success"),
        description: t("settings.securityUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("misc.error"),
        description: t("settings.updateFailed"),
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
      setLocation("/");
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
      language,
      currency, // Use the same variable but it now represents country
      emailNotifications,
      marketingEmails,
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
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      setLocation("/auth");
    }
  }, [isAuthLoading, user, setLocation]);
  
  if (isAuthLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="bg-background min-h-screen">
      <PageHeader
        title="Account Settings"
        description="Manage Your Account"
        icon={<SettingsIcon className="h-6 w-6" />}
      />
      
      <div className="container max-w-screen-xl py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 max-w-3xl mb-8">
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Unified Account Tab with all settings */}
          <TabsContent value="account" className="space-y-6">
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update Profile Information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      {avatarPreview ? (
                        <AvatarImage src={avatarPreview} alt={name} />
                      ) : null}
                      <AvatarFallback className="text-lg">
                        {getInitials(name || user.username)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h3 className="font-medium">{user.name || user.username}</h3>
                    <p className="text-sm text-blue-500 font-medium">@{user.username.toLowerCase()}</p>
                  </div>
                </div>
                
                {/* Email (editable) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email</Label>
                  <p className="text-sm text-muted-foreground">Change Your Email</p>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleProfileUpdate}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("settings.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Password Change Card */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">New  Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                
                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confrim New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handlePasswordUpdate}
                  disabled={updatePasswordMutation.isPending}
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("settings.updating")}
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle>Language and Region</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      Portuguese
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="currency">Region</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select country" />
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
                >
                  {updatePreferencesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("settings.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      aria-label={t("settings.emailNotifications")}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Marketing Emails */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                    </div>
                    <Switch
                      checked={marketingEmails}
                      onCheckedChange={setMarketingEmails}
                      aria-label={t("settings.marketingEmails")}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handlePreferencesUpdate}
                  disabled={updatePreferencesMutation.isPending}
                >
                  {updatePreferencesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("settings.saving")}
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Update Notifications
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Security Section */}
            <Card>
              <CardHeader>
                <CardTitle>Sign - In Security Settings</CardTitle>

              </CardHeader>
              <CardContent className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                    aria-label={t("settings.twoFactorAuth")}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSecurityUpdate}
                  disabled={updateSecurityMutation.isPending}
                >
                  {updateSecurityMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("settings.saving")}
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Update Security
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Danger Zone */}
            <Card className="border-destructive">
              <CardHeader className="text-destructive">
                <CardTitle>Delete account</CardTitle>

              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Your account and all associated data will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteAccountMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Permanently Delete My Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}