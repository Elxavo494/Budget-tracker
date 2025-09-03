'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { uploadTransactionIcon, deleteTransactionIcon } from '@/lib/image-utils';
import { 
  FinanceData, 
  Category, 
  RecurringIncome, 
  RecurringExpense, 
  OneTimeIncome, 
  OneTimeExpense 
} from '@/types';

interface SupabaseFinanceContextType {
  data: FinanceData;
  loading: boolean;
  error: string | null;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addRecurringIncome: (income: Omit<RecurringIncome, 'id' | 'createdAt'>, iconFile?: File) => Promise<void>;
  updateRecurringIncome: (income: RecurringIncome, iconFile?: File) => Promise<void>;
  deleteRecurringIncome: (id: string) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>, iconFile?: File) => Promise<void>;
  updateRecurringExpense: (expense: RecurringExpense, iconFile?: File) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  addOneTimeIncome: (income: Omit<OneTimeIncome, 'id' | 'createdAt'>, iconFile?: File) => Promise<void>;
  updateOneTimeIncome: (income: OneTimeIncome, iconFile?: File) => Promise<void>;
  deleteOneTimeIncome: (id: string) => Promise<void>;
  addOneTimeExpense: (expense: Omit<OneTimeExpense, 'id' | 'createdAt'>, iconFile?: File) => Promise<void>;
  updateOneTimeExpense: (expense: OneTimeExpense, iconFile?: File) => Promise<void>;
  deleteOneTimeExpense: (id: string) => Promise<void>;
  reorderRecurringIncomes: (items: RecurringIncome[]) => Promise<void>;
  reorderRecurringExpenses: (items: RecurringExpense[]) => Promise<void>;
  reorderOneTimeIncomes: (items: OneTimeIncome[]) => Promise<void>;
  reorderOneTimeExpenses: (items: OneTimeExpense[]) => Promise<void>;
}

const SupabaseFinanceContext = createContext<SupabaseFinanceContextType | undefined>(undefined);

export const SupabaseFinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth();
  const [data, setData] = useState<FinanceData>({
    categories: [],
    recurringIncomes: [],
    recurringExpenses: [],
    oneTimeIncomes: [],
    oneTimeExpenses: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load all data when user is authenticated
  useEffect(() => {
    console.log('💰 SupabaseFinanceContext: Effect triggered', { 
      authLoading, 
      isSupabaseConfigured, 
      user: !!user,
      userId: user?.id 
    });
    
    if (authLoading) {
      console.log('💰 SupabaseFinanceContext: Auth still loading, setting finance loading to true');
      setLoading(true);
      return;
    }
    
    if (!isSupabaseConfigured) {
      console.log('💰 SupabaseFinanceContext: Supabase not configured, setting loading to false');
      setLoading(false);
      return;
    }
    
    if (user) {
      console.log('💰 SupabaseFinanceContext: User authenticated, loading financial data for:', user.id);
      loadAllData();
    } else {
      console.log('💰 SupabaseFinanceContext: No user, clearing data and setting loading to false');
      setData({
        categories: [],
        recurringIncomes: [],
        recurringExpenses: [],
        oneTimeIncomes: [],
        oneTimeExpenses: [],
      });
      setLoading(false);
    }
  }, [user, authLoading, isSupabaseConfigured]);

  const loadAllData = async () => {
    console.log('💰 SupabaseFinanceContext: loadAllData called', { 
      supabase: !!supabase, 
      retryCount,
      timestamp: new Date().toISOString() 
    });
    
    if (!supabase) {
      console.error('💰 SupabaseFinanceContext: No Supabase client available');
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }

    try {
      console.log('💰 SupabaseFinanceContext: Setting loading to true and clearing errors');
      setLoading(true);
      setError(null);

      console.log('💰 SupabaseFinanceContext: Starting data queries...');
      const startTime = Date.now();

      // Add timeout to prevent hanging
      const dataPromise = Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('recurring_incomes').select('*').order('created_at', { ascending: false }),
        supabase.from('recurring_expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('one_time_incomes').select('*').order('date', { ascending: false }),
        supabase.from('one_time_expenses').select('*').order('date', { ascending: false }),
      ]);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data loading timeout after 15 seconds')), 15000)
      );

      console.log('💰 SupabaseFinanceContext: Executing queries with 15s timeout...');
      const [
        categoriesResult,
        recurringIncomesResult,
        recurringExpensesResult,
        oneTimeIncomesResult,
        oneTimeExpensesResult,
      ] = await Promise.race([dataPromise, timeoutPromise]) as any;

      const duration = Date.now() - startTime;
      console.log('💰 SupabaseFinanceContext: All queries completed', { 
        duration: `${duration}ms`,
        results: {
          categories: { count: categoriesResult.data?.length, error: !!categoriesResult.error },
          recurringIncomes: { count: recurringIncomesResult.data?.length, error: !!recurringIncomesResult.error },
          recurringExpenses: { count: recurringExpensesResult.data?.length, error: !!recurringExpensesResult.error },
          oneTimeIncomes: { count: oneTimeIncomesResult.data?.length, error: !!oneTimeIncomesResult.error },
          oneTimeExpenses: { count: oneTimeExpensesResult.data?.length, error: !!oneTimeExpensesResult.error }
        }
      });

      // Check for errors in individual queries
      if (categoriesResult.error) {
        console.error('💰 SupabaseFinanceContext: Categories query error:', categoriesResult.error);
        throw categoriesResult.error;
      }
      if (recurringIncomesResult.error) {
        console.error('💰 SupabaseFinanceContext: Recurring incomes query error:', recurringIncomesResult.error);
        throw recurringIncomesResult.error;
      }
      if (recurringExpensesResult.error) {
        console.error('💰 SupabaseFinanceContext: Recurring expenses query error:', recurringExpensesResult.error);
        throw recurringExpensesResult.error;
      }
      if (oneTimeIncomesResult.error) {
        console.error('💰 SupabaseFinanceContext: One-time incomes query error:', oneTimeIncomesResult.error);
        throw oneTimeIncomesResult.error;
      }
      if (oneTimeExpensesResult.error) {
        console.error('💰 SupabaseFinanceContext: One-time expenses query error:', oneTimeExpensesResult.error);
        throw oneTimeExpensesResult.error;
      }

      console.log('💰 SupabaseFinanceContext: All queries successful, processing data...');

      // Transform database results to match frontend types
      const transformRecurringIncomes = (dbIncomes: any[]) => 
        dbIncomes.map(income => ({
          id: income.id,
          name: income.name,
          amount: income.amount,
          recurrence: income.recurrence,
          startDate: income.start_date,
          endDate: income.end_date,
          iconUrl: income.icon_url,
          iconType: income.icon_type,
          presetIconId: income.preset_icon_id,
          createdAt: income.created_at,
        }));

      const transformRecurringExpenses = (dbExpenses: any[]) => 
        dbExpenses.map(expense => ({
          id: expense.id,
          name: expense.name,
          amount: expense.amount,
          recurrence: expense.recurrence,
          startDate: expense.start_date,
          endDate: expense.end_date,
          categoryId: expense.category_id,
          iconUrl: expense.icon_url,
          iconType: expense.icon_type,
          presetIconId: expense.preset_icon_id,
          createdAt: expense.created_at,
        }));

      const transformOneTimeIncomes = (dbIncomes: any[]) => 
        dbIncomes.map(income => ({
          id: income.id,
          name: income.name,
          amount: income.amount,
          date: income.date,
          iconUrl: income.icon_url,
          iconType: income.icon_type,
          presetIconId: income.preset_icon_id,
          createdAt: income.created_at,
        }));

      const transformOneTimeExpenses = (dbExpenses: any[]) => 
        dbExpenses.map(expense => ({
          id: expense.id,
          name: expense.name,
          amount: expense.amount,
          date: expense.date,
          categoryId: expense.category_id,
          iconUrl: expense.icon_url,
          iconType: expense.icon_type,
          presetIconId: expense.preset_icon_id,
          createdAt: expense.created_at,
        }));

      // If user has no categories, create default ones
      let categories = categoriesResult.data || [];
      console.log('💰 SupabaseFinanceContext: Processing categories', { 
        categoriesCount: categories.length,
        needsDefaultCategories: categories.length === 0 && !!user
      });
      
      if (categories.length === 0 && user) {
        console.log('💰 SupabaseFinanceContext: Creating default categories for user:', user.id);
        try {
          // Try using the database function first
          console.log('💰 SupabaseFinanceContext: Attempting to create default categories via RPC...');
          const { error: functionError } = await supabase.rpc('create_user_default_categories', {
            user_id: user.id
          });
          
          if (functionError) {
            console.log('💰 SupabaseFinanceContext: RPC failed, using direct insert fallback:', functionError.message);
            // Fallback to direct insert
            const defaultCategories = [
              { name: 'Food', color: '#ef4444', user_id: user.id },
              { name: 'Housing', color: '#3b82f6', user_id: user.id },
              { name: 'Insurance', color: '#8b5cf6', user_id: user.id },
              { name: 'Transport', color: '#10b981', user_id: user.id },
              { name: 'Sports', color: '#f59e0b', user_id: user.id },
              { name: 'Fun', color: '#ec4899', user_id: user.id },
              { name: 'Other', color: '#6b7280', user_id: user.id },
            ];
            
            const { data: newCategories, error: insertError } = await supabase
              .from('categories')
              .insert(defaultCategories)
              .select();
              
            if (!insertError && newCategories) {
              console.log('💰 SupabaseFinanceContext: Default categories created via direct insert:', newCategories.length);
              categories = newCategories;
            } else {
              console.error('💰 SupabaseFinanceContext: Failed to create default categories via direct insert:', insertError);
            }
          } else {
            console.log('💰 SupabaseFinanceContext: Default categories created via RPC, refetching...');
            // Refetch categories after function call
            const { data: refetchedCategories } = await supabase
              .from('categories')
              .select('*')
              .order('name');
            categories = refetchedCategories || [];
            console.log('💰 SupabaseFinanceContext: Refetched categories count:', categories.length);
          }
            
        } catch (error) {
          console.error('💰 SupabaseFinanceContext: Error creating default categories:', error);
        }
      }

      console.log('💰 SupabaseFinanceContext: Setting final data state...', {
        categories: categories.length,
        recurringIncomes: (recurringIncomesResult.data || []).length,
        recurringExpenses: (recurringExpensesResult.data || []).length,
        oneTimeIncomes: (oneTimeIncomesResult.data || []).length,
        oneTimeExpenses: (oneTimeExpensesResult.data || []).length,
      });

      setData({
        categories,
        recurringIncomes: transformRecurringIncomes(recurringIncomesResult.data || []),
        recurringExpenses: transformRecurringExpenses(recurringExpensesResult.data || []),
        oneTimeIncomes: transformOneTimeIncomes(oneTimeIncomesResult.data || []),
        oneTimeExpenses: transformOneTimeExpenses(oneTimeExpensesResult.data || []),
      });
      
      // Reset retry count on successful load
      setRetryCount(0);
      console.log('💰 SupabaseFinanceContext: Data loading completed successfully');
    } catch (err: any) {
      console.error('💰 SupabaseFinanceContext: Error loading finance data:', err);
      setError(err.message || 'Failed to load financial data');
      
      // Auto-retry on timeout or network errors (max 2 retries)
      if (retryCount < 2 && (err.message?.includes('timeout') || err.message?.includes('network'))) {
        console.log(`💰 SupabaseFinanceContext: Retrying data load (attempt ${retryCount + 2}/3) due to:`, err.message);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          console.log(`💰 SupabaseFinanceContext: Executing retry ${retryCount + 2}/3...`);
          loadAllData();
        }, 2000);
        return;
      } else {
        console.error('💰 SupabaseFinanceContext: Max retries reached or non-retryable error:', err.message);
      }
    } finally {
      console.log('💰 SupabaseFinanceContext: Setting loading to false (loadAllData complete)');
      setLoading(false);
    }
  };

  // Category operations
  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Creating category...');
    
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert([{ ...category, user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to create category', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }));
    
    toast.success('Category created successfully!', { id: loadingToast });
  };

  const updateCategory = async (category: Category) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Updating category...');
    
    const { error } = await supabase
      .from('categories')
      .update({ name: category.name, color: category.color })
      .eq('id', category.id);

    if (error) {
      toast.error('Failed to update category', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === category.id ? category : cat
      ),
    }));
    
    toast.success('Category updated successfully!', { id: loadingToast });
  };

  const deleteCategory = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting category...');
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete category', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== id),
    }));
    
    toast.success('Category deleted successfully!', { id: loadingToast });
  };

  // Recurring Income operations
  const addRecurringIncome = async (income: Omit<RecurringIncome, 'id' | 'createdAt'>, imageFile?: File) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Adding recurring income...');
    console.log('Adding recurring income to Supabase:', income);
    
    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadTransactionIcon(imageFile, user.id, 'income');
      }

      const { data: newIncome, error } = await supabase
        .from('recurring_incomes')
        .insert([{ 
          name: income.name,
          amount: income.amount,
          recurrence: income.recurrence,
          start_date: income.startDate,
          end_date: income.endDate || null,
          icon_url: imageUrl || null,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        // If database insert fails but image was uploaded, clean up the image
        if (imageUrl) {
          await deleteTransactionIcon(imageUrl);
        }
        toast.error('Failed to add recurring income', { id: loadingToast });
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully added income:', newIncome);
      
      // Transform the database response back to our frontend format
      const transformedIncome = {
        id: newIncome.id,
        name: newIncome.name,
        amount: newIncome.amount,
        recurrence: newIncome.recurrence,
        startDate: newIncome.start_date,
        endDate: newIncome.end_date,
        iconUrl: newIncome.icon_url,
        createdAt: newIncome.created_at,
      };
      
      setData(prev => ({
        ...prev,
        recurringIncomes: [transformedIncome, ...prev.recurringIncomes],
      }));
      
      toast.success('Recurring income added successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to add recurring income', { id: loadingToast });
      throw error;
    }
  };

  const updateRecurringIncome = async (income: RecurringIncome, iconFile?: File) => {
    if (!supabase || !user) return;
    
    const loadingToast = toast.loading('Updating recurring income...');
    
    try {
      let iconUrl = income.iconUrl;

      // Handle icon upload/update
      if (iconFile) {
        // Delete old icon if it exists and is custom
        if (income.iconUrl && income.iconType === 'custom') {
          await deleteTransactionIcon(income.iconUrl);
        }
        // Upload new icon
        iconUrl = await uploadTransactionIcon(iconFile, user.id, 'income');
      }

      const { error } = await supabase
        .from('recurring_incomes')
        .update({
          name: income.name,
          amount: income.amount,
          recurrence: income.recurrence,
          start_date: income.startDate,
          end_date: income.endDate || null,
          icon_url: iconUrl || null,
          icon_type: income.iconType || null,
          preset_icon_id: income.presetIconId || null,
        })
        .eq('id', income.id);

      if (error) {
        // If database update fails but new icon was uploaded, clean up
        if (iconFile && iconUrl && iconUrl !== income.iconUrl) {
          await deleteTransactionIcon(iconUrl);
        }
        toast.error('Failed to update recurring income', { id: loadingToast });
        throw error;
      }
      
      const updatedIncome = { 
        ...income, 
        iconUrl: iconFile ? iconUrl : income.iconUrl,
        iconType: iconFile ? 'custom' : income.iconType,
        presetIconId: iconFile ? undefined : income.presetIconId
      };
      
      setData(prev => ({
        ...prev,
        recurringIncomes: prev.recurringIncomes.map(inc => 
          inc.id === income.id ? updatedIncome : inc
        ),
      }));
      
      toast.success('Recurring income updated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update recurring income', { id: loadingToast });
      throw error;
    }
  };

  const deleteRecurringIncome = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting recurring income...');
    
    // Get the item to delete to access the image URL
    const incomeToDelete = data.recurringIncomes.find(inc => inc.id === id);
    
    const { error } = await supabase
      .from('recurring_incomes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete recurring income', { id: loadingToast });
      throw error;
    }
    
    // Delete associated image if it exists
    if (incomeToDelete?.iconUrl) {
      await deleteTransactionIcon(incomeToDelete.iconUrl);
    }
    
    setData(prev => ({
      ...prev,
      recurringIncomes: prev.recurringIncomes.filter(inc => inc.id !== id),
    }));
    
    toast.success('Recurring income deleted successfully!', { id: loadingToast });
  };

  // Recurring Expense operations
  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'createdAt'>, imageFile?: File) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Adding recurring expense...');
    console.log('Adding recurring expense to Supabase:', expense);
    
    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadTransactionIcon(imageFile, user.id, 'expense');
      }

      const { data: newExpense, error } = await supabase
        .from('recurring_expenses')
        .insert([{ 
          name: expense.name,
          amount: expense.amount,
          recurrence: expense.recurrence,
          start_date: expense.startDate,
          end_date: expense.endDate || null,
          category_id: expense.categoryId,
          icon_url: imageUrl || null,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        // If database insert fails but image was uploaded, clean up the image
        if (imageUrl) {
          await deleteTransactionIcon(imageUrl);
        }
        toast.error('Failed to add recurring expense', { id: loadingToast });
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully added expense:', newExpense);
      
      // Transform the database response back to our frontend format
      const transformedExpense = {
        id: newExpense.id,
        name: newExpense.name,
        amount: newExpense.amount,
        recurrence: newExpense.recurrence,
        startDate: newExpense.start_date,
        endDate: newExpense.end_date,
        categoryId: newExpense.category_id,
        iconUrl: newExpense.icon_url,
        createdAt: newExpense.created_at,
      };
      
      setData(prev => ({
        ...prev,
        recurringExpenses: [transformedExpense, ...prev.recurringExpenses],
      }));
      
      toast.success('Recurring expense added successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to add recurring expense', { id: loadingToast });
      throw error;
    }
  };

  const updateRecurringExpense = async (expense: RecurringExpense, iconFile?: File) => {
    if (!supabase || !user) return;
    
    const loadingToast = toast.loading('Updating recurring expense...');
    
    try {
      let iconUrl = expense.iconUrl;

      // Handle icon upload/update
      if (iconFile) {
        // Delete old icon if it exists and is custom
        if (expense.iconUrl && expense.iconType === 'custom') {
          await deleteTransactionIcon(expense.iconUrl);
        }
        // Upload new icon
        iconUrl = await uploadTransactionIcon(iconFile, user.id, 'expense');
      }

      const { error } = await supabase
        .from('recurring_expenses')
        .update({
          name: expense.name,
          amount: expense.amount,
          recurrence: expense.recurrence,
          start_date: expense.startDate,
          end_date: expense.endDate || null,
          category_id: expense.categoryId,
          icon_url: iconUrl || null,
          icon_type: expense.iconType || null,
          preset_icon_id: expense.presetIconId || null,
        })
        .eq('id', expense.id);

      if (error) {
        // If database update fails but new icon was uploaded, clean up
        if (iconFile && iconUrl && iconUrl !== expense.iconUrl) {
          await deleteTransactionIcon(iconUrl);
        }
        toast.error('Failed to update recurring expense', { id: loadingToast });
        throw error;
      }
      
      const updatedExpense = { 
        ...expense, 
        iconUrl: iconFile ? iconUrl : expense.iconUrl,
        iconType: iconFile ? 'custom' : expense.iconType,
        presetIconId: iconFile ? undefined : expense.presetIconId
      };
      
      setData(prev => ({
        ...prev,
        recurringExpenses: prev.recurringExpenses.map(exp => 
          exp.id === expense.id ? updatedExpense : exp
        ),
      }));
      
      toast.success('Recurring expense updated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update recurring expense', { id: loadingToast });
      throw error;
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting recurring expense...');
    
    // Get the item to delete to access the image URL
    const expenseToDelete = data.recurringExpenses.find(exp => exp.id === id);
    
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete recurring expense', { id: loadingToast });
      throw error;
    }
    
    // Delete associated image if it exists
    if (expenseToDelete?.iconUrl) {
      await deleteTransactionIcon(expenseToDelete.iconUrl);
    }
    
    setData(prev => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter(exp => exp.id !== id),
    }));
    
    toast.success('Recurring expense deleted successfully!', { id: loadingToast });
  };

  // One-time Income operations
  const addOneTimeIncome = async (income: Omit<OneTimeIncome, 'id' | 'createdAt'>, imageFile?: File) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Adding one-time income...');
    console.log('Adding one-time income to Supabase:', income);
    
    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (imageFile) {
        imageUrl = await uploadTransactionIcon(imageFile, user.id, 'income');
      }

      const { data: newIncome, error } = await supabase
        .from('one_time_incomes')
        .insert([{ 
          name: income.name,
          amount: income.amount,
          date: income.date,
          icon_url: imageUrl || null,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        // If database insert fails but image was uploaded, clean up the image
        if (imageUrl) {
          await deleteTransactionIcon(imageUrl);
        }
        toast.error('Failed to add one-time income', { id: loadingToast });
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully added one-time income:', newIncome);
      
      // Transform the database response back to our frontend format
      const transformedIncome = {
        id: newIncome.id,
        name: newIncome.name,
        amount: newIncome.amount,
        date: newIncome.date,
        iconUrl: newIncome.icon_url,
        createdAt: newIncome.created_at,
      };
      
      setData(prev => ({
        ...prev,
        oneTimeIncomes: [transformedIncome, ...prev.oneTimeIncomes],
      }));
      
      toast.success('One-time income added successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to add one-time income', { id: loadingToast });
      throw error;
    }
  };

  const updateOneTimeIncome = async (income: OneTimeIncome, iconFile?: File) => {
    if (!supabase || !user) return;
    
    const loadingToast = toast.loading('Updating one-time income...');
    
    try {
      let iconUrl = income.iconUrl;

      // Handle icon upload/update
      if (iconFile) {
        // Delete old icon if it exists and is custom
        if (income.iconUrl && income.iconType === 'custom') {
          await deleteTransactionIcon(income.iconUrl);
        }
        // Upload new icon
        iconUrl = await uploadTransactionIcon(iconFile, user.id, 'income');
      }

      const { error } = await supabase
        .from('one_time_incomes')
        .update({
          name: income.name,
          amount: income.amount,
          date: income.date,
          icon_url: iconUrl || null,
          icon_type: income.iconType || null,
          preset_icon_id: income.presetIconId || null,
        })
        .eq('id', income.id);

      if (error) {
        // If database update fails but new icon was uploaded, clean up
        if (iconFile && iconUrl && iconUrl !== income.iconUrl) {
          await deleteTransactionIcon(iconUrl);
        }
        toast.error('Failed to update one-time income', { id: loadingToast });
        throw error;
      }
      
      const updatedIncome = { 
        ...income, 
        iconUrl: iconFile ? iconUrl : income.iconUrl,
        iconType: iconFile ? 'custom' : income.iconType,
        presetIconId: iconFile ? undefined : income.presetIconId
      };
      
      setData(prev => ({
        ...prev,
        oneTimeIncomes: prev.oneTimeIncomes.map(inc => 
          inc.id === income.id ? updatedIncome : inc
        ),
      }));
      
      toast.success('One-time income updated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update one-time income', { id: loadingToast });
      throw error;
    }
  };

  const deleteOneTimeIncome = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting one-time income...');
    
    // Get the item to delete to access the image URL
    const incomeToDelete = data.oneTimeIncomes.find(inc => inc.id === id);
    
    const { error } = await supabase
      .from('one_time_incomes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete one-time income', { id: loadingToast });
      throw error;
    }
    
    // Delete associated image if it exists
    if (incomeToDelete?.iconUrl) {
      await deleteTransactionIcon(incomeToDelete.iconUrl);
    }
    
    setData(prev => ({
      ...prev,
      oneTimeIncomes: prev.oneTimeIncomes.filter(inc => inc.id !== id),
    }));
    
    toast.success('One-time income deleted successfully!', { id: loadingToast });
  };

  // One-time Expense operations
  const addOneTimeExpense = async (expense: Omit<OneTimeExpense, 'id' | 'createdAt'>, iconFile?: File) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Adding one-time expense...');
    console.log('Adding one-time expense to Supabase:', expense);
    
    try {
      let finalIconUrl = expense.iconUrl;

      // Upload custom icon if provided
      if (iconFile && expense.iconType === 'custom') {
        finalIconUrl = await uploadTransactionIcon(iconFile, user.id, 'expense');
      }

      const { data: newExpense, error } = await supabase
        .from('one_time_expenses')
        .insert([{ 
          name: expense.name,
          amount: expense.amount,
          date: expense.date,
          category_id: expense.categoryId,
          icon_url: finalIconUrl || null,
          icon_type: expense.iconType || 'custom',
          preset_icon_id: expense.presetIconId || null,
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        // If database insert fails but custom icon was uploaded, clean up the icon
        if (iconFile && finalIconUrl && finalIconUrl !== expense.iconUrl) {
          await deleteTransactionIcon(finalIconUrl);
        }
        toast.error('Failed to add one-time expense', { id: loadingToast });
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully added one-time expense:', newExpense);
      
      // Transform the database response back to our frontend format
      const transformedExpense = {
        id: newExpense.id,
        name: newExpense.name,
        amount: newExpense.amount,
        date: newExpense.date,
        categoryId: newExpense.category_id,
        iconUrl: newExpense.icon_url,
        iconType: newExpense.icon_type,
        presetIconId: newExpense.preset_icon_id,
        createdAt: newExpense.created_at,
      };
      
      setData(prev => ({
        ...prev,
        oneTimeExpenses: [transformedExpense, ...prev.oneTimeExpenses],
      }));
      
      toast.success('One-time expense added successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to add one-time expense', { id: loadingToast });
      throw error;
    }
  };

  const updateOneTimeExpense = async (expense: OneTimeExpense, iconFile?: File) => {
    if (!supabase || !user) return;
    
    const loadingToast = toast.loading('Updating one-time expense...');
    
    try {
      let iconUrl = expense.iconUrl;

      // Handle icon upload/update
      if (iconFile) {
        // Delete old icon if it exists and is custom
        if (expense.iconUrl && expense.iconType === 'custom') {
          await deleteTransactionIcon(expense.iconUrl);
        }
        // Upload new icon
        iconUrl = await uploadTransactionIcon(iconFile, user.id, 'expense');
      }

      const { error } = await supabase
        .from('one_time_expenses')
        .update({
          name: expense.name,
          amount: expense.amount,
          date: expense.date,
          category_id: expense.categoryId,
          icon_url: iconUrl || null,
          icon_type: expense.iconType || null,
          preset_icon_id: expense.presetIconId || null,
        })
        .eq('id', expense.id);

      if (error) {
        // If database update fails but new icon was uploaded, clean up
        if (iconFile && iconUrl && iconUrl !== expense.iconUrl) {
          await deleteTransactionIcon(iconUrl);
        }
        toast.error('Failed to update one-time expense', { id: loadingToast });
        throw error;
      }
      
      const updatedExpense = { 
        ...expense, 
        iconUrl: iconFile ? iconUrl : expense.iconUrl,
        iconType: iconFile ? 'custom' : expense.iconType,
        presetIconId: iconFile ? undefined : expense.presetIconId
      };
      
      setData(prev => ({
        ...prev,
        oneTimeExpenses: prev.oneTimeExpenses.map(exp => 
          exp.id === expense.id ? updatedExpense : exp
        ),
      }));
      
      toast.success('One-time expense updated successfully!', { id: loadingToast });
    } catch (error) {
      toast.error('Failed to update one-time expense', { id: loadingToast });
      throw error;
    }
  };

  const deleteOneTimeExpense = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting one-time expense...');
    
    // Get the item to delete to access the image URL
    const expenseToDelete = data.oneTimeExpenses.find(exp => exp.id === id);
    
    const { error } = await supabase
      .from('one_time_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete one-time expense', { id: loadingToast });
      throw error;
    }
    
    // Delete associated image if it exists
    if (expenseToDelete?.iconUrl) {
      await deleteTransactionIcon(expenseToDelete.iconUrl);
    }
    
    setData(prev => ({
      ...prev,
      oneTimeExpenses: prev.oneTimeExpenses.filter(exp => exp.id !== id),
    }));
    
    toast.success('One-time expense deleted successfully!', { id: loadingToast });
  };

  // Reorder functions
  const reorderRecurringIncomes = async (items: RecurringIncome[]) => {
    if (!user || !supabase) return;
    
    try {
      // Update display_order for each item
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('recurring_incomes')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // Update local state
      setData(prev => ({
        ...prev,
        recurringIncomes: items,
      }));
    } catch (error) {
      console.error('Error reordering recurring incomes:', error);
      throw error;
    }
  };

  const reorderRecurringExpenses = async (items: RecurringExpense[]) => {
    if (!user || !supabase) return;
    
    try {
      // Update display_order for each item
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('recurring_expenses')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // Update local state
      setData(prev => ({
        ...prev,
        recurringExpenses: items,
      }));
    } catch (error) {
      console.error('Error reordering recurring expenses:', error);
      throw error;
    }
  };

  const reorderOneTimeIncomes = async (items: OneTimeIncome[]) => {
    if (!user || !supabase) return;
    
    try {
      // Update display_order for each item
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('one_time_incomes')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // Update local state
      setData(prev => ({
        ...prev,
        oneTimeIncomes: items,
      }));
    } catch (error) {
      console.error('Error reordering one-time incomes:', error);
      throw error;
    }
  };

  const reorderOneTimeExpenses = async (items: OneTimeExpense[]) => {
    if (!user || !supabase) return;
    
    try {
      // Update display_order for each item
      const updates = items.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('one_time_expenses')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      // Update local state
      setData(prev => ({
        ...prev,
        oneTimeExpenses: items,
      }));
    } catch (error) {
      console.error('Error reordering one-time expenses:', error);
      throw error;
    }
  };
  return (
    <SupabaseFinanceContext.Provider value={{
      data,
      loading,
      error,
      addCategory,
      updateCategory,
      deleteCategory,
      addRecurringIncome,
      updateRecurringIncome,
      deleteRecurringIncome,
      addRecurringExpense,
      updateRecurringExpense,
      deleteRecurringExpense,
      addOneTimeIncome,
      updateOneTimeIncome,
      deleteOneTimeIncome,
      addOneTimeExpense,
      updateOneTimeExpense,
      deleteOneTimeExpense,
      reorderRecurringIncomes,
      reorderRecurringExpenses,
      reorderOneTimeIncomes,
      reorderOneTimeExpenses,
    }}>
      {children}
    </SupabaseFinanceContext.Provider>
  );
};

export const useSupabaseFinance = () => {
  const context = useContext(SupabaseFinanceContext);
  if (!context) {
    throw new Error('useSupabaseFinance must be used within a SupabaseFinanceProvider');
  }
  return context;
};