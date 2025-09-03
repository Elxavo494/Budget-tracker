import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl ? `${supabaseUrl.slice(0, 20)}...` : 'MISSING',
  key: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 20)}...` : 'MISSING',
  configured: !!(supabaseUrl && supabaseAnonKey)
});

// Only create Supabase client if environment variables are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Force refresh of auth state on page load
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        // Add more aggressive token refresh and storage handling
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Debug auth flows in development
        debug: process.env.NODE_ENV === 'development',
      },
      // Add global fetch configuration
      global: {
        fetch: (url, options = {}) => {
          console.log('🔧 Supabase: Making request to', url.toString().replace(supabaseUrl, '[SUPABASE_URL]'));
          
          // Create timeout signal with fallback for older browsers
          let timeoutSignal;
          if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
            timeoutSignal = AbortSignal.timeout(10000);
          } else {
            // Fallback for older browsers
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 10000);
            timeoutSignal = controller.signal;
          }
          
          return fetch(url, {
            ...options,
            signal: options.signal || timeoutSignal,
          });
        },
      },
    })
  : null;

if (supabase) {
  console.log('🔧 Supabase client created successfully');
} else {
  console.error('🔧 Supabase client creation failed - missing environment variables');
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      recurring_incomes: {
        Row: {
          id: string;
          name: string;
          amount: number;
          recurrence: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          amount: number;
          recurrence: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          recurrence?: 'weekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      recurring_expenses: {
        Row: {
          id: string;
          name: string;
          amount: number;
          recurrence: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string | null;
          category_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          amount: number;
          recurrence: 'weekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date?: string | null;
          category_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          recurrence?: 'weekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          category_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      one_time_incomes: {
        Row: {
          id: string;
          name: string;
          amount: number;
          date: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          amount: number;
          date: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          date?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      one_time_expenses: {
        Row: {
          id: string;
          name: string;
          amount: number;
          date: string;
          category_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          amount: number;
          date: string;
          category_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number;
          date?: string;
          category_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
};