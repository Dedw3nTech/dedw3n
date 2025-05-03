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
    bio: '',
    avatar: ''
  });

  // Update form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
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
    queryClient.invalidateQueries([`/api/users/${user.id}/profilePicture`]);
    queryClient.invalidateQueries([`/api/users/${user.username}/profilePicture`]);
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
      queryClient.setQueryData(['/api/user'], updatedUser);
      
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
    <div className="container max-w-3xl pt-6 pb-16">
      <h1 className="text-3xl font-bold mb-6">{t('profile.settings') || 'Profile Settings'}</h1>
      
      <Tabs defaultValue="profile">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="profile" className="flex-1">{t('profile.info') || 'Profile'}</TabsTrigger>
          <TabsTrigger value="account" className="flex-1">{t('profile.account') || 'Account'}</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1">{t('profile.notifications') || 'Notifications'}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>{t('profile.picture') || 'Profile Picture'}</CardTitle>
                  <CardDescription>
                    {t('profile.picture_desc') || 'Update your profile picture'}
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
                  <CardTitle>{t('profile.personal_info') || 'Personal Information'}</CardTitle>
                  <CardDescription>
                    {t('profile.personal_info_desc') || 'Update your personal details'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('profile.display_name') || 'Display Name'}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={t('profile.display_name_placeholder') || 'Your display name'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">{t('profile.bio') || 'Bio'}</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      placeholder={t('profile.bio_placeholder') || 'Write a short bio about yourself'}
                      rows={4}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleProfileUpdate}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('profile.updating') || 'Updating...'}
                      </>
                    ) : (
                      t('profile.save_changes') || 'Save Changes'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.account_settings') || 'Account Settings'}</CardTitle>
              <CardDescription>
                {t('profile.account_settings_desc') || 'Manage your account settings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('profile.account_future') || 'Account settings will be implemented in a future update.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.notification_preferences') || 'Notification Preferences'}</CardTitle>
              <CardDescription>
                {t('profile.notification_preferences_desc') || 'Control how you receive notifications'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('profile.notification_future') || 'Notification settings will be implemented in a future update.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}