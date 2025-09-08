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
import { ArrowLeft, User, Mail, Camera, Save, Edit, Upload, Trash2, Monitor, Sun, Moon, Globe, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/hooks/use-theme';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string | null;
  updated_at: string;
}

export const AccountPage: React.FC = () => {
  const { user, signOut, profile: contextProfile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
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
        setCurrency(data.currency || 'USD');
      } else {
        // Create default profile if it doesn't exist
        const newProfile = {
          id: user.id,
          full_name: null,
          avatar_url: null,
          currency: null,
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
      setCurrency(contextProfile.currency || 'USD');
      setLoading(false);
    } else if (user && !loading) {
      loadProfile();
    } else if (!user) {
      setLoading(false);
    }

    // Load timezone from localStorage (we'll keep timezone local for now)
    const savedTimezone = localStorage.getItem('timezone');
    if (savedTimezone) setTimezone(savedTimezone);
  }, [user, contextProfile, loadProfile]);

  // Save timezone to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('timezone', timezone);
  }, [timezone]);

  const updateCurrency = async (newCurrency: string) => {
    try {
      if (!supabase || !user || !profile) return;

      const updates = {
        id: user.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        currency: newCurrency,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setCurrency(newCurrency);
      await refreshProfile();
      toast.success('Currency preference updated');
    } catch (error) {
      console.error('Error updating currency:', error);
      toast.error('Failed to update currency preference');
    }
  };

  const updateProfile = async () => {
    try {
      if (!supabase || !user) return;

      setUpdating(true);

      const updates = {
        id: user.id,
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        currency: currency,
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
    setCurrency(profile?.currency || 'USD');
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
            currency: currency,
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
          currency: currency,
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
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 pointer-events-none" />
      <div className="relative max-w-2xl mx-auto px-4 py-12 pt-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 glass border-white/20 hover:bg-white/20 backdrop-blur-xl"
          >
            <ArrowLeft className="h-4 w-4 text-gray-100" />
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 tracking-tight">
            Account Settings
          </h1>
        </div>

        {/* Profile Card */}
        <Card className="glass-card border-white/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                Profile Information
              </CardTitle>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 glass border-white/20 text-foreground hover:bg-white/20 backdrop-blur-xl"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white/30 shadow-lg">
                  <AvatarImage 
                    src={editing ? avatarUrl : (profile?.avatar_url || '')} 
                    alt="Profile picture" 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-white/10 backdrop-blur-xl text-foreground">
                    {user ? getInitials(profile?.full_name ?? null, user.email ?? null) : 'U'}
                  </AvatarFallback>
                </Avatar>
                {!editing && profile?.avatar_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-1 -right-1 h-8 w-8 rounded-full p-0 glass border-red-300/50 text-red-400 hover:bg-red-500/20 backdrop-blur-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {editing && (
                <div className="w-full max-w-md space-y-6">
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 glass border-white/20">
                      <TabsTrigger value="upload" className="data-[state=active]:bg-white/20 data-[state=active]:text-foreground">Upload Image</TabsTrigger>
                      <TabsTrigger value="url" className="data-[state=active]:bg-white/20 data-[state=active]:text-foreground">Image URL</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="space-y-4">
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
                          className="w-full glass border-white/20 text-foreground hover:bg-white/20 backdrop-blur-xl"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Choose Image'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          JPEG, PNG, GIF, or WebP up to 5MB
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-4">
                      <div>
                        <Label htmlFor="avatar-url" className="text-sm font-medium text-foreground">
                          Image URL
                        </Label>
                        <Input
                          id="avatar-url"
                          type="url"
                          placeholder="https://example.com/avatar.jpg"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="mt-2 glass border-white/20 bg-white/10 text-foreground placeholder:text-muted-foreground focus:border-white/40"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Enter a direct link to an image
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="full-name" className="text-sm font-medium text-foreground mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!editing}
                  className="glass border-white/20 bg-white/10 text-foreground placeholder:text-muted-foreground focus:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="glass border-white/20 bg-white/5 text-foreground opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Email cannot be changed from this page
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex  justify-end gap-3 pt-6">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updating}
                   className="h-11 glass border-white/20 text-foreground hover:bg-white/20 backdrop-blur-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateProfile}
                  disabled={updating}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 text-white border-0"
                >
                  <Save className="h-4 w-4" />
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
                
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="mt-8 glass-card border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">
                Theme
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 h-12 ${
                    theme === 'light' 
                      ? 'bg-gradient-to-r from-primary to-chart-2 text-white border-0' 
                      : 'glass border-white/20 text-foreground hover:bg-white/20 backdrop-blur-xl'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 h-12 ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-r from-primary to-chart-2 text-white border-0' 
                      : 'glass border-white/20 text-foreground hover:bg-white/20 backdrop-blur-xl'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === 'auto' ? 'default' : 'outline'}
                  onClick={() => setTheme('auto')}
                  className={`flex items-center gap-2 h-12 ${
                    theme === 'auto' 
                      ? 'bg-gradient-to-r from-primary to-chart-2 text-white border-0' 
                      : 'glass border-white/20 text-foreground hover:bg-white/20 backdrop-blur-xl'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  Auto
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Auto mode follows your system's theme preference
              </p>
            </div>

            {/* Currency Selection */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Currency
              </Label>
              <Select value={currency} onValueChange={updateCurrency}>
                <SelectTrigger className="glass border-white/20 bg-white/10 text-foreground focus:border-white/40">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <SelectValue placeholder="Select currency" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass border-white/20 bg-background/90 backdrop-blur-xl">
                  <SelectItem value="USD" className="text-foreground focus:bg-accent">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR" className="text-foreground focus:bg-accent">EUR - Euro</SelectItem>
                  <SelectItem value="GBP" className="text-foreground focus:bg-accent">GBP - British Pound</SelectItem>
                  <SelectItem value="JPY" className="text-foreground focus:bg-accent">JPY - Japanese Yen</SelectItem>
                  <SelectItem value="CAD" className="text-foreground focus:bg-accent">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD" className="text-foreground focus:bg-accent">AUD - Australian Dollar</SelectItem>
                  <SelectItem value="CHF" className="text-foreground focus:bg-accent">CHF - Swiss Franc</SelectItem>
                  <SelectItem value="CNY" className="text-foreground focus:bg-accent">CNY - Chinese Yuan</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Currency used for displaying amounts throughout the app
              </p>
            </div>

            {/* Timezone Selection */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                Timezone
              </Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="glass border-white/20 bg-white/10 text-foreground focus:border-white/40">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <SelectValue placeholder="Select timezone" />
                  </div>
                </SelectTrigger>
                <SelectContent className="glass border-white/20 bg-background/90 backdrop-blur-xl max-h-60">
                  <SelectItem value="UTC" className="text-foreground focus:bg-accent">UTC - Coordinated Universal Time</SelectItem>
                  <SelectItem value="America/New_York" className="text-foreground focus:bg-accent">EST - Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago" className="text-foreground focus:bg-accent">CST - Central Time</SelectItem>
                  <SelectItem value="America/Denver" className="text-foreground focus:bg-accent">MST - Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles" className="text-foreground focus:bg-accent">PST - Pacific Time</SelectItem>
                  <SelectItem value="Europe/London" className="text-foreground focus:bg-accent">GMT - Greenwich Mean Time</SelectItem>
                  <SelectItem value="Europe/Paris" className="text-foreground focus:bg-accent">CET - Central European Time</SelectItem>
                  <SelectItem value="Europe/Berlin" className="text-foreground focus:bg-accent">CET - Central European Time</SelectItem>
                  <SelectItem value="Asia/Tokyo" className="text-foreground focus:bg-accent">JST - Japan Standard Time</SelectItem>
                  <SelectItem value="Asia/Shanghai" className="text-foreground focus:bg-accent">CST - China Standard Time</SelectItem>
                  <SelectItem value="Australia/Sydney" className="text-foreground focus:bg-accent">AEDT - Australian Eastern Time</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Timezone used for date calculations and reports
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mt-8 glass-card border-white/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-foreground tracking-tight">
              Account Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={signOut}
              className="w-full sm:w-auto flex items-center gap-2 glass border-red-300/50 text-red-400 hover:bg-red-500/20 backdrop-blur-xl"
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
