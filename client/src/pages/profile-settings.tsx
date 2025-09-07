import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ProfilePictureUploader from '@/components/user/ProfilePictureUploader';
import RegionSelector from '@/components/RegionSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { updateUserData } from '@/lib/userStorage';
import { Loader2, Store, Heart, Globe, Calendar, User, CreditCard, Truck, Settings as SettingsIcon, Package, ShoppingCart, BarChart3, DollarSign } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import VendorSettings from '@/components/vendor/VendorSettings';
import VendorCommissionDashboard from '@/components/vendor/VendorCommissionDashboard';
import VendorProductManagement from '@/components/vendor/VendorProductManagement';
import VendorOrderManagement from '@/components/vendor/VendorOrderManagement';

// Calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  // Define translatable texts for the profile settings page
  const profileTexts = useMemo(() => [
    "User Settings",
    "Profile",
    "Shipping", 
    "Billing",
    "Profile Picture",
    "Update your profile photo",
    "Change Picture",
    "Personal Information",
    "Update your personal details",
    "Profile Handle Name",
    "This is your unique username used to identify you on the platform.",
    "Full Name",
    "Bio",
    "Add Bio",
    "Date of Birth",
    "Gender",
    "Select your gender",
    "Male",
    "Female", 
    "Other",
    "Location",
    "Update your location information",
    "Region",
    "Country",
    "City",
    "Vendor Account",
    "Not Active",
    "Don't have a vendor account yet?",
    "Click here to activate your account",
    "Shipping Information",
    "Update your shipping details",
    "First Name",
    "Last Name", 
    "Phone Number",
    "Address",
    "State/Province",
    "ZIP/Postal Code",
    "Special Instructions",
    "Billing Information",
    "Update your billing details",
    "Use shipping address as billing address",
    "Save Changes",
    "Saving...",
    "Profile updated successfully!",
    "Failed to update profile. Please try again."
  ], []);

  // Use master translation system for consistent auto-translation
  const { translations: translatedTexts } = useMasterBatchTranslation(profileTexts, 'high');

  // Memoize translated labels to prevent re-render loops
  const translatedLabels = useMemo(() => ({
    userSettings: translatedTexts[0] || "User Settings",
    profile: translatedTexts[1] || "Profile",
    shipping: translatedTexts[2] || "Shipping",
    billing: translatedTexts[3] || "Billing",
    profilePicture: translatedTexts[4] || "Profile Picture",
    updateProfilePhoto: translatedTexts[5] || "Update your profile photo",
    changePicture: translatedTexts[6] || "Change Picture",
    personalInformation: translatedTexts[7] || "Personal Information",
    updatePersonalDetails: translatedTexts[8] || "Update your personal details",
    profileHandleName: translatedTexts[9] || "Profile Handle Name",
    uniqueUsername: translatedTexts[10] || "This is your unique username used to identify you on the platform.",
    fullName: translatedTexts[11] || "Full Name",
    bio: translatedTexts[12] || "Bio",
    addBio: translatedTexts[13] || "Add Bio",
    dateOfBirth: translatedTexts[14] || "Date of Birth",
    gender: translatedTexts[15] || "Gender",
    selectGender: translatedTexts[16] || "Select your gender",
    male: translatedTexts[17] || "Male",
    female: translatedTexts[18] || "Female",
    other: translatedTexts[19] || "Other",
    location: translatedTexts[20] || "Location",
    updateLocationInfo: translatedTexts[21] || "Update your location information",
    region: translatedTexts[22] || "Region",
    country: translatedTexts[23] || "Country",
    city: translatedTexts[24] || "City",
    vendorAccount: translatedTexts[25] || "Vendor Account",
    notActive: translatedTexts[26] || "Not Active",
    noVendorAccount: translatedTexts[27] || "Don't have a vendor account yet?",
    clickToActivate: translatedTexts[28] || "Click here to activate your account",
    shippingInformation: translatedTexts[29] || "Shipping Information",
    updateShippingDetails: translatedTexts[30] || "Update your shipping details",
    firstName: translatedTexts[31] || "First Name",
    lastName: translatedTexts[32] || "Last Name",
    phoneNumber: translatedTexts[33] || "Phone Number",
    address: translatedTexts[34] || "Address",
    stateProvince: translatedTexts[35] || "State/Province",
    zipPostalCode: translatedTexts[36] || "ZIP/Postal Code",
    specialInstructions: translatedTexts[37] || "Special Instructions",
    billingInformation: translatedTexts[38] || "Billing Information",
    updateBillingDetails: translatedTexts[39] || "Update your billing details",
    useShippingAsBilling: translatedTexts[40] || "Use shipping address as billing address",
    saveChanges: translatedTexts[41] || "Save Changes",
    saving: translatedTexts[42] || "Saving...",
    updateSuccess: translatedTexts[43] || "Profile updated successfully!",
    updateError: translatedTexts[44] || "Failed to update profile. Please try again."
  }), [translatedTexts]);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: '',
    region: '',
    country: '',
    city: '',
    dateOfBirth: '',
    gender: '',
    // Shipping Information
    shippingFirstName: '',
    shippingLastName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingZipCode: '',
    shippingCountry: '',
    shippingSpecialInstructions: '',
    // Billing Information
    billingFirstName: '',
    billingLastName: '',
    billingPhone: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
    useShippingAsBilling: true
  });

  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        region: user.region || '',
        country: user.country || '',
        city: user.city || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        // Shipping Information
        shippingFirstName: user.shippingFirstName || '',
        shippingLastName: user.shippingLastName || '',
        shippingPhone: user.shippingPhone || '',
        shippingAddress: user.shippingAddress || '',
        shippingCity: user.shippingCity || '',
        shippingState: user.shippingState || '',
        shippingZipCode: user.shippingZipCode || '',
        shippingCountry: user.shippingCountry || '',
        shippingSpecialInstructions: user.shippingSpecialInstructions || '',
        // Billing Information
        billingFirstName: user.billingFirstName || '',
        billingLastName: user.billingLastName || '',
        billingPhone: user.billingPhone || '',
        billingAddress: user.billingAddress || '',
        billingCity: user.billingCity || '',
        billingState: user.billingState || '',
        billingZipCode: user.billingZipCode || '',
        billingCountry: user.billingCountry || '',
        useShippingAsBilling: user.useShippingAsBilling !== false
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setFormData(prev => ({
      ...prev,
      avatar: newAvatarUrl
    }));
    
    // Invalidate any queries that might use the user avatar
    invalidateUserRelatedQueries();
  };

  // Function to invalidate all user-related queries to ensure data consistency
  const invalidateUserRelatedQueries = () => {
    try {
      // Instead of individual invalidation, use broader patterns to catch all endpoints
      // This ensures all endpoints that might contain user data are refreshed
      
      // Invalidate all user-related endpoints
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Specific user endpoints
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      }
      
      if (user?.username) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user.username}`] });
      }
      
      // Social content that might display user information
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comments'] });
      
      // For username changes - use a more aggressive approach to ensure consistency
      if (user?.username && formData.username && formData.username !== user.username) {
        console.log('Username changed, invalidating all queries for consistency');
        // Invalidate everything on username change as it affects many endpoints
        queryClient.invalidateQueries();
      }
      
      console.log('Invalidated all user-related queries for data consistency');
    } catch (error) {
      console.error('Error during cache invalidation:', error);
    }
  };

  const handleProfileUpdate = async () => {
    // Validate required fields using formData
    const isRegionMissing = !formData.region;
    const isCountryMissing = !formData.country;
    const isCityMissing = !formData.city?.trim();

    if (isRegionMissing || isCountryMissing || isCityMissing) {
      setShowValidationErrors(true);
      toast({
        title: "Missing Required Information",
        description: "Please fill in all required location fields (Region, Country, and City).",
        variant: "destructive",
      });
      return;
    }

    // Validate age requirement
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        toast({
          title: "Age Requirement Not Met",
          description: "You must be at least 18 years old to use this platform.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsUpdating(true);
      
      // Add userId to formData for alternative authentication
      const updatedFormData = {
        ...formData,
        userId: user.id
      };
      
      // Save user data to storage for persistent authentication and data consistency
      try {
        // Use the userStorage utility to save user data
        updateUserData({
          id: user.id,
          username: formData.username || user.username,
          name: formData.name || user.name,
          bio: formData.bio || user.bio,
          avatar: formData.avatar || user.avatar
        });
        console.log('User data saved to persistent storage');
      } catch (e) {
        console.error('Error saving user data to storage:', e);
      }
      
      console.log('Submitting profile update:', updatedFormData);
      
      // Check if there are any changes (including shipping and billing fields)
      const hasChanges = 
        formData.name !== user.name || 
        formData.username !== user.username || 
        formData.bio !== user.bio || 
        formData.avatar !== user.avatar ||
        formData.dateOfBirth !== user.dateOfBirth ||
        formData.gender !== user.gender ||
        formData.region !== user.region ||
        formData.country !== user.country ||
        formData.city !== user.city ||
        // Shipping fields
        formData.shippingFirstName !== (user.shippingFirstName || '') ||
        formData.shippingLastName !== (user.shippingLastName || '') ||
        formData.shippingPhone !== (user.shippingPhone || '') ||
        formData.shippingAddress !== (user.shippingAddress || '') ||
        formData.shippingCity !== (user.shippingCity || '') ||
        formData.shippingState !== (user.shippingState || '') ||
        formData.shippingZipCode !== (user.shippingZipCode || '') ||
        formData.shippingCountry !== (user.shippingCountry || '') ||
        formData.shippingSpecialInstructions !== (user.shippingSpecialInstructions || '') ||
        // Billing fields
        formData.billingFirstName !== (user.billingFirstName || '') ||
        formData.billingLastName !== (user.billingLastName || '') ||
        formData.billingPhone !== (user.billingPhone || '') ||
        formData.billingAddress !== (user.billingAddress || '') ||
        formData.billingCity !== (user.billingCity || '') ||
        formData.billingState !== (user.billingState || '') ||
        formData.billingZipCode !== (user.billingZipCode || '') ||
        formData.billingCountry !== (user.billingCountry || '') ||
        formData.useShippingAsBilling !== (user.useShippingAsBilling || false);
      
      if (!hasChanges) {
        toast({
          title: 'No changes detected',
          description: 'No changes were made to your profile',
        });
        setIsUpdating(false);
        return;
      }
      
      // Add test user ID header for development
      const headers = {
        'X-Test-User-ID': user.id.toString(),
        'X-Client-User-ID': user.id.toString(),
        'Content-Type': 'application/json'
      };
      
      console.log('Using headers for profile update:', headers);
      
      try {
        const response = await apiRequest('PATCH', '/api/users/profile', updatedFormData, { headers });
        
        if (!response.ok) {
          // Add debug information about the error
          console.error('Profile update failed with status:', response.status, response.statusText);
          let errorData;
          try {
            errorData = await response.json();
            console.error('Error data:', errorData);
          } catch (e) {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
            errorData = { message: errorText || 'Failed to update profile' };
          }
          throw new Error(errorData.message || `Failed to update profile: ${response.status}`);
        }
        
        // If we got here, the update was successful
        const updatedUser = await response.json();
        console.log('Profile updated successfully:', updatedUser);
      } catch (error) {
        console.error('Network error during profile update:', error);
        
        // If we had a network error, we'll try with a direct fetch as a fallback
        console.log('Trying fallback direct fetch approach...');
        
        const fallbackResponse = await fetch('/api/users/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Test-User-ID': user.id.toString(),
            'X-Client-User-ID': user.id.toString()
          },
          body: JSON.stringify(updatedFormData)
        });
        
        if (!fallbackResponse.ok) {
          const errorText = await fallbackResponse.text();
          console.error('Fallback profile update failed:', fallbackResponse.status, errorText);
          throw new Error(`Failed to update profile: ${fallbackResponse.status}`);
        }
        
        const updatedUser = await fallbackResponse.json();
        console.log('Profile updated successfully:', updatedUser);
      }
      
      // Create the updated user object
      const updatedUserData = {
        ...user,
        ...formData,
        id: user.id
      };
      
      // Update query cache with new user data to ensure it's immediately available
      queryClient.setQueryData({ queryKey: ['/api/user'] }, updatedUserData);
      
      // Also update user data in specific endpoints
      queryClient.setQueryData({ queryKey: [`/api/users/${user.id}`] }, updatedUserData);
      
      // Also update username-specific endpoints if username changed
      if (formData.username && user.username !== formData.username) {
        queryClient.setQueryData({ queryKey: [`/api/users/${formData.username}`] }, updatedUserData);
      }
      
      // Update persistent storage with the new user data
      try {
        // Use the full updated user data for consistency
        updateUserData(updatedUserData);
        console.log('Updated user data in persistent storage after successful profile update');
      } catch (error) {
        console.error('Error updating persistent storage after profile update:', error);
      }
      
      // Invalidate all related queries to ensure data consistency across the app
      invalidateUserRelatedQueries();
      
      toast({
        title: translatedLabels.updateSuccess,
        description: translatedLabels.updateSuccess,
      });
      
      // Add timestamp to the already created updatedUserData 
      updatedUserData.updatedAt = new Date().toISOString();
      
      // We're already using updateUserData earlier, this is redundant now
      
      // User data is already being saved with the updateUserData function above
      // No need to manually save to sessionStorage anymore
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('profile.update_error') || 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    ...(user.isVendor ? [
      { id: 'vendor-settings', label: 'Vendor Settings', icon: SettingsIcon },
      { id: 'vendor-products', label: 'Products', icon: Package },
      { id: 'vendor-orders', label: 'Orders', icon: ShoppingCart },
      { id: 'vendor-analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'vendor-commissions', label: 'Commissions', icon: DollarSign }
    ] : [
      { id: 'vendor-account', label: 'Vendor Account', icon: Store }
    ])
  ];

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'vendor-settings':
        return user.isVendor ? <VendorSettings /> : null;
      case 'vendor-products':
        return user.isVendor ? <VendorProductManagement /> : null;
      case 'vendor-orders':
        return user.isVendor ? <VendorOrderManagement /> : null;
      case 'vendor-analytics':
        return user.isVendor ? <div className="p-6"><h2 className="text-2xl font-bold mb-4">Vendor Analytics</h2><p>Analytics content coming soon...</p></div> : null;
      case 'vendor-commissions':
        return user.isVendor ? <VendorCommissionDashboard /> : null;
      case 'vendor-account':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black flex items-center">
                  <Store className="mr-2 h-5 w-5" />
                  {translatedLabels.vendorAccount}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-red-600 font-medium">Not Active</span>
                </div>
                <p className="text-sm text-black">
                  Don't have a vendor account yet? <span 
                    className="text-blue-500 hover:text-blue-700 cursor-pointer underline" 
                    onClick={() => setLocation('/become-vendor')}
                  >
                    Click here to activate your account
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case 'shipping':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  {translatedLabels.shippingInformation}
                </CardTitle>
                <CardDescription className="text-black">
                  {translatedLabels.updateShippingDetails}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shippingFirstName" className="text-black">{translatedLabels.firstName}</Label>
                    <Input
                      id="shippingFirstName"
                      name="shippingFirstName"
                      value={formData.shippingFirstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      className="bg-white text-black"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingLastName" className="text-black">{translatedLabels.lastName}</Label>
                    <Input
                      id="shippingLastName"
                      name="shippingLastName"
                      value={formData.shippingLastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      className="bg-white text-black"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="shippingPhone" className="text-black">{translatedLabels.phoneNumber}</Label>
                  <Input
                    id="shippingPhone"
                    name="shippingPhone"
                    type="tel"
                    value={formData.shippingPhone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="bg-white text-black"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingAddress" className="text-black">{translatedLabels.address}</Label>
                  <Input
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="Enter street address"
                    className="bg-white text-black"
                  />
                </div>

                <Button 
                  onClick={handleProfileUpdate}
                  disabled={isUpdating}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Shipping Information"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'billing':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-black flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  {translatedLabels.billingInformation}
                </CardTitle>
                <CardDescription className="text-black">
                  {translatedLabels.updateBillingDetails}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useShippingAsBilling"
                    checked={formData.useShippingAsBilling}
                    onChange={(e) => setFormData(prev => ({ ...prev, useShippingAsBilling: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="useShippingAsBilling" className="text-black">
                    {translatedLabels.useShippingAsBilling}
                  </Label>
                </div>

                <Button 
                  onClick={handleProfileUpdate}
                  disabled={isUpdating}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Billing Information"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      case 'profile':
      default:
        return (
          <div className="p-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-black">{translatedLabels.profilePicture}</CardTitle>
                  <CardDescription className="text-black">
                    {translatedLabels.updateProfilePhoto}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ProfilePictureUploader
                    userId={user.id}
                    username={user.username}
                    currentAvatar={formData.avatar || user.avatar || ''}
                    onUploadSuccess={handleAvatarUpdate}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-black">{translatedLabels.personalInformation}</CardTitle>
                  <CardDescription className="text-black">
                    {translatedLabels.updatePersonalDetails}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-black">{translatedLabels.fullName}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className="bg-white text-black"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio" className="text-black">{translatedLabels.bio}</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder={translatedLabels.addBio}
                      rows={3}
                      className="bg-white text-black"
                    />
                  </div>

                  <Button 
                    onClick={handleProfileUpdate}
                    disabled={isUpdating}
                    className="w-full bg-black text-white hover:bg-gray-800"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {translatedLabels.saving}
                      </>
                    ) : (
                      translatedLabels.saveChanges
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container max-w-7xl pt-6 pb-16 text-black">
      <h1 className="text-3xl font-bold mb-6 text-black">{translatedLabels.userSettings}</h1>
      
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {sidebarItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeSection === item.id
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="mr-3 h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card>
            {renderContent()}
          </Card>
        </div>
      </div>
    </div>
  );
}
