import React, { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';

interface VendorProfile {
  id: number;
  businessName: string;
  displayName: string;
  description: string;
  logo?: string;
  bannerImage?: string;
  contactEmail: string;
  businessPhone?: string;
  website?: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  settings: {
    autoAcceptOrders: boolean;
    holidayMode: boolean;
    showInventoryCount: boolean;
    allowBackorders: boolean;
    enableReviews: boolean;
    requireSignature: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    lowStockAlerts: boolean;
    currency: string;
    timeZone: string;
    language: string;
  };
  paymentSettings: {
    acceptsCreditCards: boolean;
    acceptsPayPal: boolean;
    acceptsBankTransfer: boolean;
    acceptsCOD: boolean;
    paymentTerms: string;
  };
  shippingSettings: {
    freeShippingThreshold?: number;
    handlingTime: number;
    returnPolicy: string;
    internationalShipping: boolean;
  };
}

interface VendorSettingsProps {
  vendorId: number;
}

export default function VendorSettings({ vendorId }: VendorSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/vendors/profile', vendorId],
    queryFn: async () => {
      const response = await apiRequest(`/api/vendors/profile?vendorId=${vendorId}`);
      return response as VendorProfile;
    },
    enabled: !!vendorId
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<VendorProfile>) => {
      return await apiRequest(`/api/vendors/profile/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/profile'] });
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  const [formData, setFormData] = useState<Partial<VendorProfile>>({});

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSave = (section: string) => {
    const sectionData = { [section]: formData[section as keyof VendorProfile] };
    updateProfileMutation.mutate(sectionData);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading settings...</div>;
  }

  if (!profile) {
    return <div className="text-center p-8">Failed to load vendor settings</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Store Settings</h2>
          <p className="text-muted-foreground">
            Configure your store profile, preferences, and business information
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName || ''}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName || ''}
                    onChange={(e) => updateField('displayName', e.target.value)}
                    placeholder="Name shown to customers"
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
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    placeholder="contact@yourbusiness.com"
                  />
                </div>
                <div>
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    value={formData.businessPhone || ''}
                    onChange={(e) => updateField('businessPhone', e.target.value)}
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

              <Button onClick={() => handleSave('profile')} disabled={updateProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.socialMedia?.facebook || ''}
                    onChange={(e) => updateField('socialMedia.facebook', e.target.value)}
                    placeholder="https://facebook.com/yourbusiness"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.socialMedia?.instagram || ''}
                    onChange={(e) => updateField('socialMedia.instagram', e.target.value)}
                    placeholder="https://instagram.com/yourbusiness"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={formData.socialMedia?.twitter || ''}
                    onChange={(e) => updateField('socialMedia.twitter', e.target.value)}
                    placeholder="https://twitter.com/yourbusiness"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.socialMedia?.linkedin || ''}
                    onChange={(e) => updateField('socialMedia.linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/yourbusiness"
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('socialMedia')} disabled={updateProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Social Media
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Business Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.businessAddress?.street || ''}
                  onChange={(e) => updateField('businessAddress.street', e.target.value)}
                  placeholder="123 Business Street"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.businessAddress?.city || ''}
                    onChange={(e) => updateField('businessAddress.city', e.target.value)}
                    placeholder="London"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/County</Label>
                  <Input
                    id="state"
                    value={formData.businessAddress?.state || ''}
                    onChange={(e) => updateField('businessAddress.state', e.target.value)}
                    placeholder="Greater London"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.businessAddress?.postalCode || ''}
                    onChange={(e) => updateField('businessAddress.postalCode', e.target.value)}
                    placeholder="SW1A 1AA"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.businessAddress?.country || ''}
                    onValueChange={(value) => updateField('businessAddress.country', value)}
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

              <Button onClick={() => handleSave('businessAddress')} disabled={updateProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Address
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(formData.businessHours || {}).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24 capitalize font-medium">{day}</div>
                  <Switch
                    checked={!hours.closed}
                    onCheckedChange={(checked) => updateField(`businessHours.${day}.closed`, !checked)}
                  />
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.open || '09:00'}
                        onChange={(e) => updateField(`businessHours.${day}.open`, e.target.value)}
                        className="w-32"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={hours.close || '17:00'}
                        onChange={(e) => updateField(`businessHours.${day}.close`, e.target.value)}
                        className="w-32"
                      />
                    </>
                  )}
                  {hours.closed && (
                    <span className="text-muted-foreground">Closed</span>
                  )}
                </div>
              ))}

              <Button onClick={() => handleSave('businessHours')} disabled={updateProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Hours
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive order and customer notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={formData.settings?.emailNotifications || false}
                    onCheckedChange={(checked) => updateField('settings.emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive urgent notifications via SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={formData.settings?.smsNotifications || false}
                    onCheckedChange={(checked) => updateField('settings.smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                  </div>
                  <Switch
                    id="lowStockAlerts"
                    checked={formData.settings?.lowStockAlerts || false}
                    onCheckedChange={(checked) => updateField('settings.lowStockAlerts', checked)}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave('settings')} disabled={updateProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Notifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="acceptsCreditCards">Credit Cards</Label>
                    <p className="text-sm text-muted-foreground">Accept Visa, Mastercard, and other credit cards</p>
                  </div>
                  <Switch
                    id="acceptsCreditCards"
                    checked={formData.paymentSettings?.acceptsCreditCards || false}
                    onCheckedChange={(checked) => updateField('paymentSettings.acceptsCreditCards', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="acceptsPayPal">PayPal</Label>
                    <p className="text-sm text-muted-foreground">Accept PayPal payments</p>
                  </div>
                  <Switch
                    id="acceptsPayPal"
                    checked={formData.paymentSettings?.acceptsPayPal || false}
                    onCheckedChange={(checked) => updateField('paymentSettings.acceptsPayPal', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="acceptsBankTransfer">Bank Transfer</Label>
                    <p className="text-sm text-muted-foreground">Accept direct bank transfers</p>
                  </div>
                  <Switch
                    id="acceptsBankTransfer"
                    checked={formData.paymentSettings?.acceptsBankTransfer || false}
                    onCheckedChange={(checked) => updateField('paymentSettings.acceptsBankTransfer', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="acceptsCOD">Cash on Delivery</Label>
                    <p className="text-sm text-muted-foreground">Accept cash on delivery payments</p>
                  </div>
                  <Switch
                    id="acceptsCOD"
                    checked={formData.paymentSettings?.acceptsCOD || false}
                    onCheckedChange={(checked) => updateField('paymentSettings.acceptsCOD', checked)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Textarea
                  id="paymentTerms"
                  value={formData.paymentSettings?.paymentTerms || ''}
                  onChange={(e) => updateField('paymentSettings.paymentTerms', e.target.value)}
                  placeholder="Describe your payment terms and conditions"
                  rows={3}
                />
              </div>

              <Button onClick={() => handleSave('paymentSettings')} disabled={updateProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Payment Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (GBP)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    step="0.01"
                    value={formData.shippingSettings?.freeShippingThreshold || ''}
                    onChange={(e) => updateField('shippingSettings.freeShippingThreshold', parseFloat(e.target.value))}
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <Label htmlFor="handlingTime">Handling Time (days)</Label>
                  <Input
                    id="handlingTime"
                    type="number"
                    value={formData.shippingSettings?.handlingTime || ''}
                    onChange={(e) => updateField('shippingSettings.handlingTime', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="internationalShipping">International Shipping</Label>
                  <p className="text-sm text-muted-foreground">Ship to international destinations</p>
                </div>
                <Switch
                  id="internationalShipping"
                  checked={formData.shippingSettings?.internationalShipping || false}
                  onCheckedChange={(checked) => updateField('shippingSettings.internationalShipping', checked)}
                />
              </div>

              <div>
                <Label htmlFor="returnPolicy">Return Policy</Label>
                <Textarea
                  id="returnPolicy"
                  value={formData.shippingSettings?.returnPolicy || ''}
                  onChange={(e) => updateField('shippingSettings.returnPolicy', e.target.value)}
                  placeholder="Describe your return and refund policy"
                  rows={4}
                />
              </div>

              <Button onClick={() => handleSave('shippingSettings')} disabled={updateProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Shipping Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Store Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoAcceptOrders">Auto-Accept Orders</Label>
                    <p className="text-sm text-muted-foreground">Automatically accept new orders</p>
                  </div>
                  <Switch
                    id="autoAcceptOrders"
                    checked={formData.settings?.autoAcceptOrders || false}
                    onCheckedChange={(checked) => updateField('settings.autoAcceptOrders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="holidayMode">Holiday Mode</Label>
                    <p className="text-sm text-muted-foreground">Temporarily disable new orders</p>
                  </div>
                  <Switch
                    id="holidayMode"
                    checked={formData.settings?.holidayMode || false}
                    onCheckedChange={(checked) => updateField('settings.holidayMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showInventoryCount">Show Inventory Count</Label>
                    <p className="text-sm text-muted-foreground">Display stock quantities to customers</p>
                  </div>
                  <Switch
                    id="showInventoryCount"
                    checked={formData.settings?.showInventoryCount || false}
                    onCheckedChange={(checked) => updateField('settings.showInventoryCount', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowBackorders">Allow Backorders</Label>
                    <p className="text-sm text-muted-foreground">Accept orders for out-of-stock items</p>
                  </div>
                  <Switch
                    id="allowBackorders"
                    checked={formData.settings?.allowBackorders || false}
                    onCheckedChange={(checked) => updateField('settings.allowBackorders', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableReviews">Enable Reviews</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to leave product reviews</p>
                  </div>
                  <Switch
                    id="enableReviews"
                    checked={formData.settings?.enableReviews || false}
                    onCheckedChange={(checked) => updateField('settings.enableReviews', checked)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.settings?.currency || 'GBP'}
                    onValueChange={(value) => updateField('settings.currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Select
                    value={formData.settings?.timeZone || 'Europe/London'}
                    onValueChange={(value) => updateField('settings.timeZone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">New York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={formData.settings?.language || 'en'}
                    onValueChange={(value) => updateField('settings.language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => handleSave('settings')} disabled={updateProfileMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}