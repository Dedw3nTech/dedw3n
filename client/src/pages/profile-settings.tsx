import { useState, useEffect } from 'react';
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
import { Loader2, Store, Heart, Globe, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

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
      
      // Check if there are any changes
      if (
        formData.name === user.name && 
        formData.username === user.username && 
        formData.bio === user.bio && 
        formData.avatar === user.avatar &&
        formData.dateOfBirth === user.dateOfBirth &&
        formData.gender === user.gender &&
        formData.region === user.region &&
        formData.country === user.country &&
        formData.city === user.city
      ) {
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
        title: t('profile.update_success') || 'Profile updated',
        description: t('profile.update_success_desc') || 'Your profile has been updated successfully',
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

  return (
    <div className="container max-w-3xl pt-6 pb-16 text-black">
      <h1 className="text-3xl font-bold mb-6 text-black">User Settings</h1>
      
      <Tabs defaultValue="profile">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="profile" className="flex-1 text-black">Profile</TabsTrigger>
          <TabsTrigger value="shipping" className="flex-1 text-black">Shipping</TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 text-black">Billing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-black">Profile Picture</CardTitle>
                  <CardDescription className="text-black">
                    Update your profile photo
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
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-black flex items-center text-sm">
                    <Store className="mr-2 h-4 w-4" />
                    Vendor Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.isVendor ? (
                    <>
                      <div className="flex items-center text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-green-600 font-medium">Vendor Account Active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-black hover:bg-gray-800 text-white text-xs p-1 h-auto flex flex-col"
                          onClick={() => setLocation('/vendor-dashboard')}
                        >
                          <span>Go To</span>
                          <span className="text-[10px]">Vendor Dashboard</span>
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-black hover:bg-gray-800 text-white text-xs p-1 h-auto flex flex-col"
                          onClick={() => setLocation('/add-product')}
                        >
                          <span>Add</span>
                          <span>Product/Service</span>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></div>
                        <span className="text-red-600 font-medium">Not Active</span>
                      </div>
                      <p className="text-xs text-black mt-2">
                        Don't have a vendor account yet? <span 
                          className="text-blue-500 hover:text-blue-700 cursor-pointer" 
                          onClick={() => setLocation('/become-vendor')}
                        >
                          Click here
                        </span> to activate your account
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-black flex items-center text-sm">
                    <Heart className="mr-2 h-4 w-4" />
                    Dating Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.datingProfile ? (
                    <>
                      <div className="flex items-center text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-green-600 font-medium">Dating Profile Active</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-black hover:bg-gray-800 text-white text-xs p-1 h-auto flex flex-col"
                          onClick={() => setLocation('/dating')}
                        >
                          <span>Go To</span>
                          <span className="text-[10px]">Dating Section</span>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></div>
                        <span className="text-red-600 font-medium">Not Active</span>
                      </div>
                      <p className="text-xs text-black mt-2">
                        Don't have a dating profile yet? <span 
                          className="text-blue-500 hover:text-blue-700 cursor-pointer" 
                          onClick={() => setLocation('/dating')}
                        >
                          Click here
                        </span> to create your dating profile
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-black">Personal Information</CardTitle>
                  <CardDescription className="text-black">
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-black font-bold">Profile Handle Name</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Your unique username"
                      className="text-black font-medium border-2 border-gray-300"
                    />
                    <p className="text-xs text-gray-600">This is your unique username used to identify you on the platform.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-black">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      className="text-black"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-black">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      placeholder="Add Bio"
                      rows={4}
                      className="text-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-black flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Date of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={handleInputChange}
                      className="text-black"
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-600">
                      You must be 18 or older to use this platform. Your age will be calculated automatically.
                    </p>
                    {formData.dateOfBirth && (
                      <p className="text-sm text-green-600">
                        Age: {calculateAge(formData.dateOfBirth)} years old
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-black">Gender</Label>
                    <Select value={formData.gender || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                      <SelectTrigger className="text-black">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region Selection */}
                  <div className="space-y-2">
                    <Label className="text-black flex items-center">
                      <Globe className="mr-2 h-4 w-4" />
                      My Region
                    </Label>
                    <RegionSelector 
                      currentRegion={formData.region}
                      currentCountry={formData.country}
                      currentCity={formData.city}
                      showErrors={showValidationErrors}
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
                    <p className="text-xs text-gray-600">
                      Select your region to see posts from users in your area when using "My Region" filter.
                    </p>
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
                      "Update Profile"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Shipping Tab */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Shipping Information
              </CardTitle>
              <CardDescription className="text-black">
                Save your shipping details for faster checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingFirstName" className="text-black">First Name</Label>
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
                  <Label htmlFor="shippingLastName" className="text-black">Last Name</Label>
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
                <Label htmlFor="shippingPhone" className="text-black">Phone Number</Label>
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
                <Label htmlFor="shippingAddress" className="text-black">Address</Label>
                <Input
                  id="shippingAddress"
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleInputChange}
                  placeholder="Enter street address"
                  className="bg-white text-black"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shippingCity" className="text-black">City</Label>
                  <Input
                    id="shippingCity"
                    name="shippingCity"
                    value={formData.shippingCity}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    className="bg-white text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingState" className="text-black">State/County</Label>
                  <Input
                    id="shippingState"
                    name="shippingState"
                    value={formData.shippingState}
                    onChange={handleInputChange}
                    placeholder="Enter state/county"
                    className="bg-white text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingZipCode" className="text-black">Postal Code</Label>
                  <Input
                    id="shippingZipCode"
                    name="shippingZipCode"
                    value={formData.shippingZipCode}
                    onChange={handleInputChange}
                    placeholder="Enter postal code"
                    className="bg-white text-black"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shippingCountry" className="text-black">Country</Label>
                <Select 
                  value={formData.shippingCountry} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, shippingCountry: value }))}
                >
                  <SelectTrigger className="bg-white text-black">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shippingSpecialInstructions" className="text-black">Special Instructions (Optional)</Label>
                <Textarea
                  id="shippingSpecialInstructions"
                  name="shippingSpecialInstructions"
                  value={formData.shippingSpecialInstructions}
                  onChange={handleInputChange}
                  placeholder="Any special delivery instructions..."
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
                    Updating...
                  </>
                ) : (
                  "Save Shipping Information"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <Heart className="mr-2 h-5 w-5" />
                Billing Information
              </CardTitle>
              <CardDescription className="text-black">
                Save your billing details for faster checkout
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
                  Use shipping address as billing address
                </Label>
              </div>

              {!formData.useShippingAsBilling && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="billingFirstName" className="text-black">First Name</Label>
                      <Input
                        id="billingFirstName"
                        name="billingFirstName"
                        value={formData.billingFirstName}
                        onChange={handleInputChange}
                        placeholder="Enter first name"
                        className="bg-white text-black"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingLastName" className="text-black">Last Name</Label>
                      <Input
                        id="billingLastName"
                        name="billingLastName"
                        value={formData.billingLastName}
                        onChange={handleInputChange}
                        placeholder="Enter last name"
                        className="bg-white text-black"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="billingPhone" className="text-black">Phone Number</Label>
                    <Input
                      id="billingPhone"
                      name="billingPhone"
                      type="tel"
                      value={formData.billingPhone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      className="bg-white text-black"
                    />
                  </div>

                  <div>
                    <Label htmlFor="billingAddress" className="text-black">Address</Label>
                    <Input
                      id="billingAddress"
                      name="billingAddress"
                      value={formData.billingAddress}
                      onChange={handleInputChange}
                      placeholder="Enter street address"
                      className="bg-white text-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="billingCity" className="text-black">City</Label>
                      <Input
                        id="billingCity"
                        name="billingCity"
                        value={formData.billingCity}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                        className="bg-white text-black"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingState" className="text-black">State/County</Label>
                      <Input
                        id="billingState"
                        name="billingState"
                        value={formData.billingState}
                        onChange={handleInputChange}
                        placeholder="Enter state/county"
                        className="bg-white text-black"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingZipCode" className="text-black">Postal Code</Label>
                      <Input
                        id="billingZipCode"
                        name="billingZipCode"
                        value={formData.billingZipCode}
                        onChange={handleInputChange}
                        placeholder="Enter postal code"
                        className="bg-white text-black"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="billingCountry" className="text-black">Country</Label>
                    <Select 
                      value={formData.billingCountry} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, billingCountry: value }))}
                    >
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

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
        </TabsContent>

      </Tabs>
    </div>
  );
}