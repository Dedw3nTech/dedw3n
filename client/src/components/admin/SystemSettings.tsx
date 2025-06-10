import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");

  // Fetch system settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }
      return res.json();
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", updatedSettings);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "The system settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update system settings.",
        variant: "destructive",
      });
    },
  });

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Dedw3n",
    siteDescription: "Connect. Shop. Thrive.",
    allowRegistration: true,
    requireEmailVerification: true,
    maintenanceMode: false,
    defaultCurrency: "GBP",
    defaultLanguage: "en",
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    smtpServer: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    senderEmail: "noreply@dedw3n.com",
    senderName: "Dedw3n",
    enableEmailNotifications: true,
  });

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: true,
    paypalEnabled: true,
    mobileMoneyEnabled: true,
    walletEnabled: true,
    taxRate: "20", // percentage
    allowRefunds: true,
    refundPeriodDays: "14",
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    enableTwoFactorAuth: true,
    passwordMinLength: "8",
    passwordRequireSpecialChar: true,
    passwordRequireNumber: true,
    accountLockoutThreshold: "5",
    sessionTimeoutMinutes: "1440", // 24 hours
  });

  // Update states when settings are loaded
  useState(() => {
    if (settings) {
      setGeneralSettings(settings.general || generalSettings);
      setEmailSettings(settings.email || emailSettings);
      setPaymentSettings(settings.payment || paymentSettings);
      setSecuritySettings(settings.security || securitySettings);
    }
  });

  // Submit handlers
  const handleSaveGeneralSettings = () => {
    updateSettingsMutation.mutate({
      type: 'general',
      data: generalSettings
    });
  };

  const handleSaveEmailSettings = () => {
    updateSettingsMutation.mutate({
      type: 'email',
      data: emailSettings
    });
  };

  const handleSavePaymentSettings = () => {
    updateSettingsMutation.mutate({
      type: 'payment',
      data: paymentSettings
    });
  };

  const handleSaveSecuritySettings = () => {
    updateSettingsMutation.mutate({
      type: 'security',
      data: securitySettings
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure the basic settings for your platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select 
                    value={generalSettings.defaultCurrency}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, defaultCurrency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                      <SelectItem value="CNY">Chinese Yuan (CNY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select 
                    value={generalSettings.defaultLanguage}
                    onValueChange={(value) => setGeneralSettings({ ...generalSettings, defaultLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register on the platform
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.allowRegistration}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, allowRegistration: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      New users must verify their email before accessing the platform
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.requireEmailVerification}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, requireEmailVerification: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to restrict access to administrators only
                    </p>
                  </div>
                  <Switch
                    checked={generalSettings.maintenanceMode}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, maintenanceMode: checked })}
                  />
                </div>
              </div>

              <Button 
                className="w-full sm:w-auto mt-6"
                onClick={handleSaveGeneralSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure your email server settings for notifications and user communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">SMTP Server</Label>
                  <Input
                    id="smtpServer"
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpServer: e.target.value })}
                    placeholder="mail.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    value={emailSettings.smtpUsername}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                    placeholder="username@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Sender Email</Label>
                  <Input
                    id="senderEmail"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name</Label>
                  <Input
                    id="senderName"
                    value={emailSettings.senderName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
                    placeholder="Your Company Name"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send automated email notifications for important events
                  </p>
                </div>
                <Switch
                  checked={emailSettings.enableEmailNotifications}
                  onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, enableEmailNotifications: checked })}
                />
              </div>

              <Button 
                className="w-full sm:w-auto mt-6"
                onClick={handleSaveEmailSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment gateways and related settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Stripe</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept credit card payments through Stripe
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.stripeEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, stripeEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable PayPal</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept payments through PayPal
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.paypalEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, paypalEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Mobile Money</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept payments through mobile money services
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.mobileMoneyEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, mobileMoneyEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable E-Wallet</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable the platform's e-wallet functionality
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.walletEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, walletEnabled: checked })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    value={paymentSettings.taxRate}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, taxRate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refundPeriodDays">Refund Period (Days)</Label>
                  <Input
                    id="refundPeriodDays"
                    type="number"
                    min="0"
                    value={paymentSettings.refundPeriodDays}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, refundPeriodDays: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Refunds</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to request refunds for their purchases
                  </p>
                </div>
                <Switch
                  checked={paymentSettings.allowRefunds}
                  onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, allowRefunds: checked })}
                />
              </div>

              <Button 
                className="w-full sm:w-auto mt-6"
                onClick={handleSavePaymentSettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options for your platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountLockoutThreshold">Account Lockout Threshold</Label>
                  <Input
                    id="accountLockoutThreshold"
                    type="number"
                    min="1"
                    value={securitySettings.accountLockoutThreshold}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, accountLockoutThreshold: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of failed login attempts before account is locked
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeoutMinutes">Session Timeout (Minutes)</Label>
                  <Input
                    id="sessionTimeoutMinutes"
                    type="number"
                    min="5"
                    value={securitySettings.sessionTimeoutMinutes}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeoutMinutes: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    1440 minutes = 24 hours
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to secure their accounts with 2FA
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.enableTwoFactorAuth}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, enableTwoFactorAuth: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Special Character in Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain at least one special character
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.passwordRequireSpecialChar}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireSpecialChar: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Number in Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain at least one number
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.passwordRequireNumber}
                    onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, passwordRequireNumber: checked })}
                  />
                </div>
              </div>

              <Button 
                className="w-full sm:w-auto mt-6"
                onClick={handleSaveSecuritySettings}
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}