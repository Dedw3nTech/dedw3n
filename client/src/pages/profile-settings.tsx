import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import ProfilePictureUploader from '@/components/user/ProfilePictureUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { updateUserData } from '@/lib/userStorage';
import { Loader2, Store } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: ''
  });

  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
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
        formData.avatar === user.avatar
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
                <CardContent>
                  {user.isVendor ? (
                    <div className="flex items-center text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></div>
                      <span className="text-green-600 font-medium">Vendor Account Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></div>
                      <span className="text-red-600 font-medium">Not Active</span>
                    </div>
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
                  
                  <Button 
                    onClick={handleProfileUpdate}
                    disabled={isUpdating}
                    className="w-full text-black"
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

      </Tabs>
    </div>
  );
}