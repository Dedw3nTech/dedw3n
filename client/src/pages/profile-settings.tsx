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
import { Loader2 } from 'lucide-react';
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
    queryClient.invalidateQueries({ 
      queryKey: [`/api/users/${user.id}/profilePicture`]
    });
    queryClient.invalidateQueries({ 
      queryKey: [`/api/users/${user.username}/profilePicture`]
    });
  };

  const handleProfileUpdate = async () => {
    try {
      setIsUpdating(true);
      console.log('Submitting profile update:', formData);
      
      const response = await apiRequest('PATCH', '/api/users/profile', formData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const updatedUser = await response.json();
      
      // Update query cache
      queryClient.setQueryData({ queryKey: ['/api/user'] }, updatedUser);
      
      toast({
        title: t('profile.update_success') || 'Profile updated',
        description: t('profile.update_success_desc') || 'Your profile has been updated successfully',
      });
      
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
          <TabsTrigger value="notifications" className="flex-1 text-black">Notifications</TabsTrigger>
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
                    currentAvatar={user.avatar || ''}
                    onUploadSuccess={handleAvatarUpdate}
                  />
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
        

        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Notification Preferences</CardTitle>
              <CardDescription className="text-black">
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-black">
                Notification settings will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}