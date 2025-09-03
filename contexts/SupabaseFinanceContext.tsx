'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { defaultData } from '@/lib/storage';
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
  addRecurringIncome: (income: Omit<RecurringIncome, 'id' | 'createdAt'>) => Promise<void>;
  updateRecurringIncome: (income: RecurringIncome) => Promise<void>;
  deleteRecurringIncome: (id: string) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => Promise<void>;
  updateRecurringExpense: (expense: RecurringExpense) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
  addOneTimeIncome: (income: Omit<OneTimeIncome, 'id' | 'createdAt'>) => Promise<void>;
  updateOneTimeIncome: (income: OneTimeIncome) => Promise<void>;
  deleteOneTimeIncome: (id: string) => Promise<void>;
  addOneTimeExpense: (expense: Omit<OneTimeExpense, 'id' | 'createdAt'>) => Promise<void>;
  updateOneTimeExpense: (expense: OneTimeExpense) => Promise<void>;
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

  // Load all data when user is authenticated
  useEffect(() => {
    if (authLoading) return;
    
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    
    if (user) {
      loadAllData();
    } else {
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
    if (!supabase) {
      setError('Supabase is not configured');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        categoriesResult,
        recurringIncomesResult,
        recurringExpensesResult,
        oneTimeIncomesResult,
        oneTimeExpensesResult,
      ] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('recurring_incomes').select('*').order('created_at', { ascending: false }),
        supabase.from('recurring_expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('one_time_incomes').select('*').order('date', { ascending: false }),
        supabase.from('one_time_expenses').select('*').order('date', { ascending: false }),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (recurringIncomesResult.error) throw recurringIncomesResult.error;
      if (recurringExpensesResult.error) throw recurringExpensesResult.error;
      if (oneTimeIncomesResult.error) throw oneTimeIncomesResult.error;
      if (oneTimeExpensesResult.error) throw oneTimeExpensesResult.error;

      // Transform database results to match frontend types
      const transformRecurringIncomes = (dbIncomes: any[]) => 
        dbIncomes.map(income => ({
          id: income.id,
          name: income.name,
          amount: income.amount,
          recurrence: income.recurrence,
          startDate: income.start_date,
          endDate: income.end_date,
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
          createdAt: expense.created_at,
        }));

      const transformOneTimeIncomes = (dbIncomes: any[]) => 
        dbIncomes.map(income => ({
          id: income.id,
          name: income.name,
          amount: income.amount,
          date: income.date,
          createdAt: income.created_at,
        }));

      const transformOneTimeExpenses = (dbExpenses: any[]) => 
        dbExpenses.map(expense => ({
          id: expense.id,
          name: expense.name,
          amount: expense.amount,
          date: expense.date,
          categoryId: expense.category_id,
          createdAt: expense.created_at,
        }));

      // If user has no categories, create default ones
      let categories = categoriesResult.data || [];
      if (categories.length === 0 && user) {
        try {
          // Try using the database function first
          const { error: functionError } = await supabase.rpc('create_user_default_categories', {
            user_id: user.id
          });
          
          if (functionError) {
            // Fallback to direct insert
            const defaultCategories = defaultData.categories.map(cat => ({
              name: cat.name,
              color: cat.color,
              user_id: user.id,
            }));
            
            const { data: newCategories, error: insertError } = await supabase
              .from('categories')
              .insert(defaultCategories)
              .select();
              
            if (!insertError && newCategories) {
              categories = newCategories;
            }
          } else {
            // Refetch categories after function call
            const { data: refetchedCategories } = await supabase
              .from('categories')
              .select('*')
              .order('name');
            categories = refetchedCategories || [];
          }
            
        } catch (error) {
          console.error('Error creating default categories:', error);
        }
      }

      setData({
        categories,
        recurringIncomes: transformRecurringIncomes(recurringIncomesResult.data || []),
        recurringExpenses: transformRecurringExpenses(recurringExpensesResult.data || []),
        oneTimeIncomes: transformOneTimeIncomes(oneTimeIncomesResult.data || []),
        oneTimeExpenses: transformOneTimeExpenses(oneTimeExpensesResult.data || []),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
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
  const addRecurringIncome = async (income: Omit<RecurringIncome, 'id' | 'createdAt'>) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Adding recurring income...');
    console.log('Adding recurring income to Supabase:', income);
    
    const { data: newIncome, error } = await supabase
      .from('recurring_incomes')
      .insert([{ 
        name: income.name,
        amount: income.amount,
        recurrence: income.recurrence,
        start_date: income.startDate,
        end_date: income.endDate || null,
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) {
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
      createdAt: newIncome.created_at,
    };
    
    setData(prev => ({
      ...prev,
      recurringIncomes: [transformedIncome, ...prev.recurringIncomes],
    }));
    
    toast.success('Recurring income added successfully!', { id: loadingToast });
  };

  const updateRecurringIncome = async (income: RecurringIncome) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Updating recurring income...');
    
    const { error } = await supabase
      .from('recurring_incomes')
      .update({
        name: income.name,
        amount: income.amount,
        recurrence: income.recurrence,
        start_date: income.startDate,
        end_date: income.endDate || null,
      })
      .eq('id', income.id);

    if (error) {
      toast.error('Failed to update recurring income', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      recurringIncomes: prev.recurringIncomes.map(inc => 
        inc.id === income.id ? income : inc
      ),
    }));
    
    toast.success('Recurring income updated successfully!', { id: loadingToast });
  };

  const deleteRecurringIncome = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting recurring income...');
    
    const { error } = await supabase
      .from('recurring_incomes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete recurring income', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      recurringIncomes: prev.recurringIncomes.filter(inc => inc.id !== id),
    }));
    
    toast.success('Recurring income deleted successfully!', { id: loadingToast });
  };

  // Recurring Expense operations
  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Adding recurring expense...');
    console.log('Adding recurring expense to Supabase:', expense);
    
    const { data: newExpense, error } = await supabase
      .from('recurring_expenses')
      .insert([{ 
        name: expense.name,
        amount: expense.amount,
        recurrence: expense.recurrence,
        start_date: expense.startDate,
        end_date: expense.endDate || null,
        category_id: expense.categoryId,
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) {
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
      createdAt: newExpense.created_at,
    };
    
    setData(prev => ({
      ...prev,
      recurringExpenses: [transformedExpense, ...prev.recurringExpenses],
    }));
    
    toast.success('Recurring expense added successfully!', { id: loadingToast });
  };

  const updateRecurringExpense = async (expense: RecurringExpense) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Updating recurring expense...');
    
    const { error } = await supabase
      .from('recurring_expenses')
      .update({
        name: expense.name,
        amount: expense.amount,
        recurrence: expense.recurrence,
        start_date: expense.startDate,
        end_date: expense.endDate || null,
        category_id: expense.categoryId,
      })
      .eq('id', expense.id);

    if (error) {
      toast.error('Failed to update recurring expense', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map(exp => 
        exp.id === expense.id ? expense : exp
      ),
    }));
    
    toast.success('Recurring expense updated successfully!', { id: loadingToast });
  };

  const deleteRecurringExpense = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting recurring expense...');
    
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete recurring expense', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter(exp => exp.id !== id),
    }));
    
    toast.success('Recurring expense deleted successfully!', { id: loadingToast });
  };

  // One-time Income operations
  const addOneTimeIncome = async (income: Omit<OneTimeIncome, 'id' | 'createdAt'>) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Adding one-time income...');
    console.log('Adding one-time income to Supabase:', income);
    
    const { data: newIncome, error } = await supabase
      .from('one_time_incomes')
      .insert([{ 
        name: income.name,
        amount: income.amount,
        date: income.date,
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) {
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
      createdAt: newIncome.created_at,
    };
    
    setData(prev => ({
      ...prev,
      oneTimeIncomes: [transformedIncome, ...prev.oneTimeIncomes],
    }));
    
    toast.success('One-time income added successfully!', { id: loadingToast });
  };

  const updateOneTimeIncome = async (income: OneTimeIncome) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Updating one-time income...');
    
    const { error } = await supabase
      .from('one_time_incomes')
      .update({
        name: income.name,
        amount: income.amount,
        date: income.date,
      })
      .eq('id', income.id);

    if (error) {
      toast.error('Failed to update one-time income', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      oneTimeIncomes: prev.oneTimeIncomes.map(inc => 
        inc.id === income.id ? income : inc
      ),
    }));
    
    toast.success('One-time income updated successfully!', { id: loadingToast });
  };

  const deleteOneTimeIncome = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting one-time income...');
    
    const { error } = await supabase
      .from('one_time_incomes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete one-time income', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      oneTimeIncomes: prev.oneTimeIncomes.filter(inc => inc.id !== id),
    }));
    
    toast.success('One-time income deleted successfully!', { id: loadingToast });
  };

  // One-time Expense operations
  const addOneTimeExpense = async (expense: Omit<OneTimeExpense, 'id' | 'createdAt'>) => {
    if (!user || !supabase) return;
    
    const loadingToast = toast.loading('Adding one-time expense...');
    console.log('Adding one-time expense to Supabase:', expense);
    
    const { data: newExpense, error } = await supabase
      .from('one_time_expenses')
      .insert([{ 
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        category_id: expense.categoryId,
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) {
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
      createdAt: newExpense.created_at,
    };
    
    setData(prev => ({
      ...prev,
      oneTimeExpenses: [transformedExpense, ...prev.oneTimeExpenses],
    }));
    
    toast.success('One-time expense added successfully!', { id: loadingToast });
  };

  const updateOneTimeExpense = async (expense: OneTimeExpense) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Updating one-time expense...');
    
    const { error } = await supabase
      .from('one_time_expenses')
      .update({
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        category_id: expense.categoryId,
      })
      .eq('id', expense.id);

    if (error) {
      toast.error('Failed to update one-time expense', { id: loadingToast });
      throw error;
    }
    
    setData(prev => ({
      ...prev,
      oneTimeExpenses: prev.oneTimeExpenses.map(exp => 
        exp.id === expense.id ? expense : exp
      ),
    }));
    
    toast.success('One-time expense updated successfully!', { id: loadingToast });
  };

  const deleteOneTimeExpense = async (id: string) => {
    if (!supabase) return;
    
    const loadingToast = toast.loading('Deleting one-time expense...');
    
    const { error } = await supabase
      .from('one_time_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete one-time expense', { id: loadingToast });
      throw error;
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