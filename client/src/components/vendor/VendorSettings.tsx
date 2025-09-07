import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Settings,
  Store,
  User,
  Bell,
  CreditCard,
  Truck,
  Globe,
  Shield,
  Key,
  Mail,
  Phone,
  MapPin,
  Clock,
  Package,
  DollarSign,
  Camera,
  Save,
  AlertTriangle,
  Building,
  FileText,
  Banknote,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VendorData {
  id: number;
  userId: number;
  vendorType: 'private' | 'business';
  storeName: string;
  businessName: string;
  description?: string;
  businessType: string;
  email: string;
  phone: string;
  contactEmail?: string;
  contactPhone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId?: string;
  website?: string;
  logo?: string;
  rating: number;
  ratingCount: number;
  badgeLevel: string;
  totalSalesAmount: number;
  totalTransactions: number;
  isApproved: boolean;
  isActive: boolean;
  accountStatus: string;
  hasSalesManager: boolean;
  salesManagerName?: string;
  salesManagerId?: string;
  unitSystem: string;
  weightSystem: string;
  timezone: string;
  billingCycle: string;
  createdAt: string;
  updatedAt: string;
}

interface BankAccountData {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  sortCode: string;
  iban?: string;
  swiftCode?: string;
  currency: string;
  accountType: 'checking' | 'savings' | 'business';
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderNotifications: boolean;
  paymentNotifications: boolean;
  lowStockAlerts: boolean;
  reviewNotifications: boolean;
  marketingEmails: boolean;
}

interface VendorSettingsProps {
  vendorId: number;
}

export default function VendorSettings({ vendorId }: VendorSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor data
  const { data: vendor, isLoading } = useQuery({
    queryKey: ['/api/vendors/details', vendorId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/vendors/details/${vendorId}`);
      return response.json();
    },
    enabled: !!vendorId
  });

  // Local state for form data
  const [formData, setFormData] = useState<Partial<VendorData>>({});
  const [bankAccount, setBankAccount] = useState<BankAccountData>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    sortCode: '',
    iban: '',
    swiftCode: '',
    currency: 'GBP',
    accountType: 'business'
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    orderNotifications: true,
    paymentNotifications: true,
    lowStockAlerts: true,
    reviewNotifications: true,
    marketingEmails: false
  });

  // Initialize form data when vendor loads
  useEffect(() => {
    if (vendor) {
      setFormData(vendor);
    }
  }, [vendor]);

  // Update vendor profile mutation
  const updateVendorMutation = useMutation({
    mutationFn: async (updateData: Partial<VendorData>) => {
      return await apiRequest('PUT', `/api/vendors/${vendorId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/details'] });
      toast({
        title: "Success",
        description: "Vendor settings updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor settings",
        variant: "destructive"
      });
    }
  });

  // Bank account update mutation
  const updateBankAccountMutation = useMutation({
    mutationFn: async (bankData: BankAccountData) => {
      return await apiRequest('PUT', `/api/vendors/${vendorId}/bank-account`, bankData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank account information updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update bank account information",
        variant: "destructive"
      });
    }
  });

  // Notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (notificationData: NotificationSettings) => {
      return await apiRequest('PUT', `/api/vendors/${vendorId}/notifications`, notificationData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification settings updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification settings", 
        variant: "destructive"
      });
    }
  });

  const updateField = (field: keyof VendorData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateBankField = (field: keyof BankAccountData, value: any) => {
    setBankAccount(prev => ({ ...prev, [field]: value }));
  };

  const updateNotificationField = (field: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    updateVendorMutation.mutate(formData);
  };

  const handleSaveBankAccount = () => {
    updateBankAccountMutation.mutate(bankAccount);
  };

  const handleSaveNotifications = () => {
    updateNotificationsMutation.mutate(notifications);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading settings...</div>;
  }

  if (!vendor) {
    return <div className="text-center p-8">Failed to load vendor settings</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Settings</h2>
          <p className="text-muted-foreground">
            Manage your vendor profile, payment information, and business settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={formData.storeName || ''}
                    onChange={(e) => updateField('storeName', e.target.value)}
                    placeholder="Your store name"
                  />
                </div>
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName || ''}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Store Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Tell customers about your store"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="business@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Business Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+44 20 1234 5678"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://yourbusiness.com"
                />
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={updateVendorMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateVendorMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={formData.businessType || ''}
                    onValueChange={(value) => updateField('businessType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="limited_company">Limited Company</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="non_profit">Non-Profit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId || ''}
                    onChange={(e) => updateField('taxId', e.target.value)}
                    placeholder="GB123456789"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Business Address</h4>
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="123 Business Street"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="London"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/County</Label>
                    <Input
                      id="state"
                      value={formData.state || ''}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="Greater London"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="zipCode">Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode || ''}
                      onChange={(e) => updateField('zipCode', e.target.value)}
                      placeholder="SW1A 1AA"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={formData.country || ''}
                      onValueChange={(value) => updateField('country', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="AU">Australia</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={updateVendorMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateVendorMutation.isPending ? 'Saving...' : 'Save Business Info'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment & Bank Account Settings */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Bank Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    value={bankAccount.accountHolderName}
                    onChange={(e) => updateBankField('accountHolderName', e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankAccount.bankName}
                    onChange={(e) => updateBankField('bankName', e.target.value)}
                    placeholder="Barclays Bank"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={bankAccount.accountNumber}
                    onChange={(e) => updateBankField('accountNumber', e.target.value)}
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="sortCode">Sort Code</Label>
                  <Input
                    id="sortCode"
                    value={bankAccount.sortCode}
                    onChange={(e) => updateBankField('sortCode', e.target.value)}
                    placeholder="12-34-56"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="iban">IBAN (Optional)</Label>
                  <Input
                    id="iban"
                    value={bankAccount.iban}
                    onChange={(e) => updateBankField('iban', e.target.value)}
                    placeholder="GB33BUKB20201555555555"
                  />
                </div>
                <div>
                  <Label htmlFor="swiftCode">SWIFT/BIC Code (Optional)</Label>
                  <Input
                    id="swiftCode"
                    value={bankAccount.swiftCode}
                    onChange={(e) => updateBankField('swiftCode', e.target.value)}
                    placeholder="BUKBGB22"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={bankAccount.currency}
                    onValueChange={(value) => updateBankField('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={bankAccount.accountType}
                    onValueChange={(value) => updateBankField('accountType', value as 'checking' | 'savings' | 'business')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business Account</SelectItem>
                      <SelectItem value="checking">Checking Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSaveBankAccount} 
                disabled={updateBankAccountMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateBankAccountMutation.isPending ? 'Saving...' : 'Save Bank Account'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => updateNotificationField('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => updateNotificationField('smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Order Notifications</h4>
                    <p className="text-sm text-muted-foreground">Get notified about new orders</p>
                  </div>
                  <Switch
                    checked={notifications.orderNotifications}
                    onCheckedChange={(checked) => updateNotificationField('orderNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Notifications</h4>
                    <p className="text-sm text-muted-foreground">Get notified about payments and payouts</p>
                  </div>
                  <Switch
                    checked={notifications.paymentNotifications}
                    onCheckedChange={(checked) => updateNotificationField('paymentNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Low Stock Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
                  </div>
                  <Switch
                    checked={notifications.lowStockAlerts}
                    onCheckedChange={(checked) => updateNotificationField('lowStockAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Review Notifications</h4>
                    <p className="text-sm text-muted-foreground">Get notified about new reviews</p>
                  </div>
                  <Switch
                    checked={notifications.reviewNotifications}
                    onCheckedChange={(checked) => updateNotificationField('reviewNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-muted-foreground">Receive marketing and promotional emails</p>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => updateNotificationField('marketingEmails', checked)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveNotifications} 
                disabled={updateNotificationsMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateNotificationsMutation.isPending ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="unitSystem">Unit System</Label>
                  <Select
                    value={formData.unitSystem || 'metric'}
                    onValueChange={(value) => updateField('unitSystem', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric</SelectItem>
                      <SelectItem value="imperial">Imperial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weightSystem">Weight System</Label>
                  <Select
                    value={formData.weightSystem || 'kg'}
                    onValueChange={(value) => updateField('weightSystem', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      <SelectItem value="g">Grams (g)</SelectItem>
                      <SelectItem value="oz">Ounces (oz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone || 'Europe/London'}
                    onValueChange={(value) => updateField('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select
                    value={formData.billingCycle || 'monthly'}
                    onValueChange={(value) => updateField('billingCycle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={updateVendorMutation.isPending}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateVendorMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account Section */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Delete Vendor Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive">Warning: This action cannot be undone</h4>
                    <p className="text-sm text-muted-foreground">
                      Deleting your vendor account will permanently remove:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• All your products and listings</li>
                      <li>• Order history and customer data</li>
                      <li>• Payment information and bank details</li>
                      <li>• Reviews and ratings</li>
                      <li>• Store customization and branding</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      You will lose access to your vendor dashboard and all associated data. This action cannot be reversed.
                    </p>
                  </div>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Vendor Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Confirm Account Deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        Are you absolutely sure you want to delete your vendor account? This will:
                      </p>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Permanently delete all your products and data</li>
                        <li>• Remove your store from the marketplace</li>
                        <li>• Cancel any pending orders</li>
                        <li>• Delete all customer interactions and reviews</li>
                      </ul>
                      <p className="font-medium text-destructive">
                        This action cannot be undone. All data will be permanently lost.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        // TODO: Implement actual delete functionality
                        toast({
                          title: "Delete Account",
                          description: "Account deletion functionality will be implemented soon.",
                          variant: "destructive",
                        });
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Yes, Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Vendor Type:</span>
                  <span className="capitalize font-medium">{formData.vendorType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Badge Level:</span>
                  <span className="capitalize font-medium">{formData.badgeLevel?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Status:</span>
                  <span className="capitalize font-medium">{formData.accountStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Sales:</span>
                  <span className="font-medium">£{formData.totalSalesAmount?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Transactions:</span>
                  <span className="font-medium">{formData.totalTransactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Approved:</span>
                  <span className="font-medium">{formData.isApproved ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}