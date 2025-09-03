'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Mail, Camera, Save, Edit, Upload, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export const AccountPage: React.FC = () => {
  const { user, signOut, profile: contextProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    try {
      if (!supabase || !user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        throw error;
      }

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
      } else {
        // Create default profile if it doesn't exist
        const newProfile = {
          id: user.id,
          full_name: null,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        };
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile);
      setFullName(contextProfile.full_name || '');
      setAvatarUrl(contextProfile.avatar_url || '');
      setLoading(false);
    } else if (user) {
      loadProfile();
    }
  }, [user, contextProfile, loadProfile]);

  const updateProfile = async () => {
    try {
      if (!supabase || !user) return;

      setUpdating(true);

      const updates = {
        id: user.id,
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setEditing(false);
      await refreshProfile(); // Refresh the profile in auth context
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setAvatarUrl(profile?.avatar_url || '');
    setEditing(false);
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      if (!supabase || !user) return null;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        return null;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB');
        return null;
      }

      setUploading(true);

      // Delete existing avatar if it exists and is stored in our bucket
      if (profile?.avatar_url && profile.avatar_url.includes('supabase') && profile.avatar_url.includes('/storage/v1/object/public/avatars/')) {
        await deleteAvatar(profile.avatar_url, false);
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true  // Changed to true to allow overwriting
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAvatar = async (avatarUrl: string, updateProfile = true) => {
    try {
      if (!supabase || !user) return;

      // Extract file path from URL if it's a Supabase storage URL
      if (avatarUrl.includes('supabase') && avatarUrl.includes('/storage/v1/object/public/avatars/')) {
        const fileName = avatarUrl.split('/avatars/')[1];
        
        if (fileName) {
          const { error } = await supabase.storage
            .from('avatars')
            .remove([fileName]);
          
          if (error) {
            console.error('Error removing file from storage:', error);
          }
        }
      }

      if (updateProfile) {
        // Update profile to remove avatar
        const { error } = await supabase
          .from('profiles')
          .update({ 
            avatar_url: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;

        setAvatarUrl('');
        await refreshProfile();
        toast.success('Avatar removed successfully');
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      if (updateProfile) {
        toast.error('Failed to remove avatar');
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadAvatar(file);
    if (uploadedUrl) {
      setAvatarUrl(uploadedUrl);
      
      // Auto-save the uploaded avatar
      try {
        if (!supabase || !user) return;

        const updates = {
          id: user.id,
          full_name: fullName.trim() || null,
          avatar_url: uploadedUrl,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('profiles')
          .upsert(updates)
          .select()
          .single();

        if (error) throw error;

        setProfile(data);
        await refreshProfile();
        toast.success('Avatar uploaded successfully');
      } catch (error) {
        console.error('Error saving avatar:', error);
        toast.error('Avatar uploaded but failed to save');
      }
    }

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (profile?.avatar_url) {
      await deleteAvatar(profile.avatar_url);
    }
  };

  const getInitials = (name: string | null, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Account Settings
          </h1>
        </div>

        {/* Profile Card */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Profile Information
              </CardTitle>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={editing ? avatarUrl : (profile?.avatar_url || '')} 
                    alt="Profile picture" 
                  />
                  <AvatarFallback className="text-lg bg-slate-200 dark:bg-slate-700">
                    {user ? getInitials(profile?.full_name ?? null, user.email ?? null) : 'U'}
                  </AvatarFallback>
                </Avatar>
                {!editing && profile?.avatar_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0 bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {editing && (
                <div className="w-full max-w-md space-y-4">
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload">Upload Image</TabsTrigger>
                      <TabsTrigger value="url">Image URL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="space-y-3">
                      <div className="text-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Choose Image'}
                        </Button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          JPEG, PNG, GIF, or WebP up to 5MB
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-3">
                      <div>
                        <Label htmlFor="avatar-url" className="text-sm font-medium">
                          Image URL
                        </Label>
                        <Input
                          id="avatar-url"
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Enter a direct link to an image
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="full-name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editing}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 bg-slate-50 dark:bg-slate-700"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Email cannot be changed from this page
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={updateProfile}
                  disabled={updating}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updating}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mt-6 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={signOut}
              className="w-full sm:w-auto flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
