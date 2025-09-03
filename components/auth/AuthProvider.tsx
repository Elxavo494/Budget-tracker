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
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout after 10 seconds')), 10000)
      );

      console.log('👤 AuthProvider: Executing profile query with 10s timeout...');
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      const duration = Date.now() - startTime;
      console.log('👤 AuthProvider: Profile query response', { 
        data: !!data, 
        error: error?.code || error?.message,
        duration: `${duration}ms` 
      });

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        console.error('👤 AuthProvider: Error loading profile:', error);
        
        // On timeout or error, create a default profile to unblock the app
        if (error.message?.includes('timeout')) {
          console.log('👤 AuthProvider: Profile loading timed out, creating default profile');
          const defaultProfile = {
            id: userId,
            full_name: null,
            avatar_url: null,
            updated_at: new Date().toISOString(),
          };
          setProfile(defaultProfile);
        }
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
      
      // On any exception, create a default profile to unblock the app
      console.log('👤 AuthProvider: Creating default profile due to exception');
      const defaultProfile = {
        id: userId,
        full_name: null,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      };
      setProfile(defaultProfile);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const clearStaleAuth = async () => {
    console.log('🔐 AuthProvider: Clearing stale auth data...');
    try {
      if (supabase) {
        // Sign out to clear Supabase session
        await supabase.auth.signOut({ scope: 'local' });
      }
      
      // Clear localStorage items that might contain stale tokens
      if (typeof window !== 'undefined') {
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || 
          key.includes('sb-') ||
          key.includes('auth-token') ||
          key.includes('finance-tracker')
        );
        
        keysToRemove.forEach(key => {
          console.log('🔐 AuthProvider: Removing localStorage key:', key);
          localStorage.removeItem(key);
        });
      }
      
      console.log('🔐 AuthProvider: Stale auth data cleared successfully');
    } catch (error) {
      console.error('🔐 AuthProvider: Error clearing stale auth:', error);
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

    // Get initial session with timeout and stale token handling
    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthProvider: Getting initial session...');
        if (!supabase) return;
        
        const startTime = Date.now();
        
        // Add timeout to session retrieval to catch hanging tokens
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session retrieval timeout - likely stale token')), 8000)
        );
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
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
        
        // Check if session is stale/invalid
        if (session?.user && session.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();
          
          console.log('🔐 AuthProvider: Session expiry check', {
            expiresAt: expiresAt.toISOString(),
            now: now.toISOString(),
            timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`,
            isExpired: timeUntilExpiry <= 0
          });
          
          if (timeUntilExpiry <= 0) {
            console.warn('🔐 AuthProvider: Session token expired, trying refresh first...');
            
            try {
              // Try to refresh the session before clearing
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              
              if (refreshData.session && !refreshError) {
                console.log('🔐 AuthProvider: Session refreshed successfully');
                setSession(refreshData.session);
                setUser(refreshData.session.user);
                
                if (refreshData.session.user) {
                  await loadProfile(refreshData.session.user.id);
                }
                
                if (mounted) {
                  setLoading(false);
                }
                return;
              } else {
                console.warn('🔐 AuthProvider: Session refresh failed, clearing stale session');
              }
            } catch (refreshError) {
              console.warn('🔐 AuthProvider: Session refresh exception, clearing stale session:', refreshError);
            }
            
            await clearStaleAuth();
            setSession(null);
            setUser(null);
            setProfile(null);
            if (mounted) {
              setLoading(false);
            }
            return;
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔐 AuthProvider: Loading profile for user:', session.user.id);
          try {
            // Run profile load in background; do not block auth loading
            void loadProfile(session.user.id);
          } catch (error) {
            console.error('🔐 AuthProvider: Profile loading failed in initialization (non-blocking):', error);
          }
        } else {
          console.log('🔐 AuthProvider: No user session found');
        }
        
        if (mounted) {
          console.log('🔐 AuthProvider: Setting loading to false (initialization complete)');
          setLoading(false);
        }
      } catch (error) {
        console.error('🔐 AuthProvider: Error initializing auth:', error);
        
        // If we get a timeout or other error, likely due to stale token
        if (error instanceof Error && error.message.includes('timeout')) {
          console.warn('🔐 AuthProvider: Session timeout detected, clearing potentially stale auth tokens');
          await clearStaleAuth();
          setSession(null);
          setUser(null);
          setProfile(null);
        }
        
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
          try {
            // Run profile load in background; do not block auth loading
            void loadProfile(session.user.id);
          } catch (error) {
            console.error('🔐 AuthProvider: Profile loading failed in auth change (non-blocking):', error);
          }
          
          // Clear any old finance data from localStorage to prevent conflicts
          if (typeof window !== 'undefined') {
            localStorage.removeItem('finance-tracker-data');
          }
        } else {
          console.log('🔐 AuthProvider: No user in auth change, clearing profile');
          setProfile(null);
        }
        
        // Always set loading to false after processing auth change
        if (mounted) {
          console.log('🔐 AuthProvider: Setting loading to false (auth change complete)');
          setLoading(false);
        }
      }
    );

    console.log('🔐 AuthProvider: Starting auth initialization...');
    initializeAuth();

    // Safety timeout - force loading to false after 15 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('🔐 AuthProvider: Safety timeout triggered - forcing loading to false after 15s');
        setLoading(false);
      }
    }, 15000);

    return () => {
      console.log('🔐 AuthProvider: Cleanup - unmounting');
      mounted = false;
      clearTimeout(safetyTimeout);
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