import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create Supabase client if environment variables are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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