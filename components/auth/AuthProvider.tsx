'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isSupabaseConfigured = !!supabase;

  const loadProfile = async (userId: string) => {
    console.log('👤 AuthProvider: Loading profile for user:', userId);
    
    if (!supabase) {
      console.log('👤 AuthProvider: No Supabase client for profile loading');
      return;
    }

    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const duration = Date.now() - startTime;
      console.log('👤 AuthProvider: Profile query response', { 
        data: !!data, 
        error: error?.code || error?.message,
        duration: `${duration}ms` 
      });

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        console.error('👤 AuthProvider: Error loading profile:', error);
        return;
      }

      if (data) {
        console.log('👤 AuthProvider: Profile data loaded successfully');
        setProfile(data);
      } else {
        console.log('👤 AuthProvider: No profile found, creating default profile');
        // Create default profile if it doesn't exist
        const newProfile = {
          id: userId,
          full_name: null,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        };
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('👤 AuthProvider: Exception loading profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing...', { supabase: !!supabase });
    
    if (!supabase) {
      console.log('🔐 AuthProvider: No Supabase client, setting loading false');
      setLoading(false);
      return;
    }

    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthProvider: Getting initial session...');
        if (!supabase) return;
        
        const startTime = Date.now();
        const { data: { session }, error } = await supabase.auth.getSession();
        const duration = Date.now() - startTime;
        
        console.log('🔐 AuthProvider: Session response received', { 
          session: !!session, 
          user: !!session?.user,
          duration: `${duration}ms`,
          error: error?.message 
        });
        
        if (!mounted) {
          console.log('🔐 AuthProvider: Component unmounted, skipping session update');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔐 AuthProvider: Loading profile for user:', session.user.id);
          await loadProfile(session.user.id);
        } else {
          console.log('🔐 AuthProvider: No user session found');
        }
        
        if (mounted) {
          console.log('🔐 AuthProvider: Setting loading to false (initialization complete)');
          setLoading(false);
        }
      } catch (error) {
        console.error('🔐 AuthProvider: Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthProvider: Auth state changed', { 
          event, 
          session: !!session, 
          user: !!session?.user,
          mounted 
        });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔐 AuthProvider: Loading profile for user (auth change):', session.user.id);
          await loadProfile(session.user.id);
          
          // Clear any old finance data from localStorage to prevent conflicts
          if (typeof window !== 'undefined') {
            localStorage.removeItem('finance-tracker-data');
          }
        } else {
          console.log('🔐 AuthProvider: No user in auth change, clearing profile');
          setProfile(null);
        }
        
        // Only set loading to false if this is not the initial load
        if (event !== 'INITIAL_SESSION' && mounted) {
          console.log('🔐 AuthProvider: Setting loading to false (auth change complete)');
          setLoading(false);
        }
      }
    );

    console.log('🔐 AuthProvider: Starting auth initialization...');
    initializeAuth();

    return () => {
      console.log('🔐 AuthProvider: Cleanup - unmounting');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation
      }
    });
    if (error) throw error;
    
    // If user was created successfully, create default categories
    if (data.user && !data.user.email_confirmed_at) {
      // For development, we'll handle this in the context when user first loads
      console.log('User created, will create default categories on first load');
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase is not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any remaining localStorage data on sign out to prevent conflicts
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finance-tracker-data');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};