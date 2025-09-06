'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { uploadTransactionIcon, deleteTransactionIcon } from '@/lib/image-utils';
import { formatCurrency } from '@/lib/calculations';
import { 
  FinanceData, 
  Category, 
  RecurringIncome, 
  RecurringExpense, 
  OneTimeIncome, 
  OneTimeExpense,
  CategoryBudget,
  SavingsGoal,
  BudgetAlert,
  GoalMilestone,
  GoalContribution
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
  // Budget methods
  addCategoryBudget: (categoryId: string, monthlyLimit: number, alertThreshold: number) => Promise<void>;
  updateCategoryBudget: (budgetId: string, monthlyLimit: number, alertThreshold: number, isActive: boolean) => Promise<void>;
  deleteCategoryBudget: (budgetId: string) => Promise<void>;
  // Goals methods
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSavingsGoal: (goalId: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number, description?: string) => Promise<void>;
  // Alert methods
  updateBudgetAlert: (alertType: string, isEnabled: boolean) => Promise<void>;
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
    categoryBudgets: [],
    savingsGoals: [],
    budgetAlerts: [],
    goalMilestones: [],
    goalContributions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load all data when user is authenticated
  useEffect(() => {
    
    if (authLoading) {
      setLoading(true);
      return;
    }
    
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
        categoryBudgets: [],
        savingsGoals: [],
        budgetAlerts: [],
        goalMilestones: [],
        goalContributions: [],
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

      const startTime = Date.now();

      // Add timeout to prevent hanging
      const dataPromise = Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('recurring_incomes').select('*').order('created_at', { ascending: false }),
        supabase.from('recurring_expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('one_time_incomes').select('*').order('date', { ascending: false }),
        supabase.from('one_time_expenses').select('*').order('date', { ascending: false }),
        supabase.from('category_budgets').select('*').order('created_at', { ascending: false }),
        supabase.from('savings_goals').select('*').order('created_at', { ascending: false }),
        supabase.from('budget_alerts').select('*').order('created_at', { ascending: false }),
        supabase.from('goal_milestones').select('*').order('achieved_at', { ascending: false }),
        supabase.from('goal_contributions').select('*').order('contribution_date', { ascending: false }),
      ]);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data loading timeout after 15 seconds')), 15000)
      );

      const [
        categoriesResult,
        recurringIncomesResult,
        recurringExpensesResult,
        oneTimeIncomesResult,
        oneTimeExpensesResult,
        categoryBudgetsResult,
        savingsGoalsResult,
        budgetAlertsResult,
        goalMilestonesResult,
        goalContributionsResult,
      ] = await Promise.race([dataPromise, timeoutPromise]) as any;


      // Check for errors in individual queries
      if (categoriesResult.error) {
        throw categoriesResult.error;
      }
      if (recurringIncomesResult.error) {
        throw recurringIncomesResult.error;
      }
      if (recurringExpensesResult.error) {
        throw recurringExpensesResult.error;
      }
      if (oneTimeIncomesResult.error) {
        throw oneTimeIncomesResult.error;
      }
      if (oneTimeExpensesResult.error) {
        throw oneTimeExpensesResult.error;
      }
      if (categoryBudgetsResult.error) {
        throw categoryBudgetsResult.error;
      }
      if (savingsGoalsResult.error) {
        throw savingsGoalsResult.error;
      }
      if (budgetAlertsResult.error) {
        throw budgetAlertsResult.error;
      }
      if (goalMilestonesResult.error) {
        throw goalMilestonesResult.error;
      }
      if (goalContributionsResult.error) {
        throw goalContributionsResult.error;
      }

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

      const transformCategoryBudgets = (dbBudgets: any[]) => 
        dbBudgets.map(budget => ({
          id: budget.id,
          categoryId: budget.category_id,
          monthlyLimit: budget.monthly_limit,
          alertThreshold: budget.alert_threshold,
          isActive: budget.is_active,
          createdAt: budget.created_at,
          updatedAt: budget.updated_at,
        }));

      const transformSavingsGoals = (dbGoals: any[]) => 
        dbGoals.map(goal => ({
          id: goal.id,
          name: goal.name,
          description: goal.description,
          targetAmount: goal.target_amount,
          currentAmount: goal.current_amount,
          targetDate: goal.target_date,
          priority: goal.priority,
          color: goal.color,
          iconUrl: goal.icon_url,
          iconType: goal.icon_type,
          presetIconId: goal.preset_icon_id,
          isActive: goal.is_active,
          isCompleted: goal.is_completed,
          completedAt: goal.completed_at,
          createdAt: goal.created_at,
          updatedAt: goal.updated_at,
        }));

      const transformBudgetAlerts = (dbAlerts: any[]) => 
        dbAlerts.map(alert => ({
          id: alert.id,
          alertType: alert.alert_type,
          isEnabled: alert.is_enabled,
          thresholdPercentage: alert.threshold_percentage,
          milestonePercentage: alert.milestone_percentage,
          createdAt: alert.created_at,
          updatedAt: alert.updated_at,
        }));

      const transformGoalMilestones = (dbMilestones: any[]) => 
        dbMilestones.map(milestone => ({
          id: milestone.id,
          goalId: milestone.goal_id,
          milestonePercentage: milestone.milestone_percentage,
          achievedAt: milestone.achieved_at,
          amountAtAchievement: milestone.amount_at_achievement,
          createdAt: milestone.created_at,
        }));

      const transformGoalContributions = (dbContributions: any[]) => 
        dbContributions.map(contribution => ({
          id: contribution.id,
          goalId: contribution.goal_id,
          amount: contribution.amount,
          description: contribution.description,
          contributionDate: contribution.contribution_date,
          createdAt: contribution.created_at,
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
              categories = newCategories;
            } else {
              // ignore
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
          // ignore
        }
      }

      setData({
        categories,
        recurringIncomes: transformRecurringIncomes(recurringIncomesResult.data || []),
        recurringExpenses: transformRecurringExpenses(recurringExpensesResult.data || []),
        oneTimeIncomes: transformOneTimeIncomes(oneTimeIncomesResult.data || []),
        oneTimeExpenses: transformOneTimeExpenses(oneTimeExpensesResult.data || []),
        categoryBudgets: transformCategoryBudgets(categoryBudgetsResult.data || []),
        savingsGoals: transformSavingsGoals(savingsGoalsResult.data || []),
        budgetAlerts: transformBudgetAlerts(budgetAlertsResult.data || []),
        goalMilestones: transformGoalMilestones(goalMilestonesResult.data || []),
        goalContributions: transformGoalContributions(goalContributionsResult.data || []),
      });
      
      // Reset retry count on successful load
      setRetryCount(0);
    } catch (err: any) {
      setError(err.message || 'Failed to load financial data');
      
      // Auto-retry on timeout or network errors (max 2 retries)
      if (retryCount < 2 && (err.message?.includes('timeout') || err.message?.includes('network'))) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          loadAllData();
        }, 2000);
        return;
      } else {
        // ignore
      }
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

  // Budget CRUD methods
  const addCategoryBudget = async (categoryId: string, monthlyLimit: number, alertThreshold: number) => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('category_budgets')
      .insert({
        category_id: categoryId,
        monthly_limit: monthlyLimit,
        alert_threshold: alertThreshold,
        is_active: true,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    const newBudget: CategoryBudget = {
      id: data.id,
      categoryId: data.category_id,
      monthlyLimit: data.monthly_limit,
      alertThreshold: data.alert_threshold,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setData(prev => ({
      ...prev,
      categoryBudgets: [newBudget, ...prev.categoryBudgets],
    }));

    toast.success('Budget created successfully');
  };

  const updateCategoryBudget = async (budgetId: string, monthlyLimit: number, alertThreshold: number, isActive: boolean) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase
      .from('category_budgets')
      .update({
        monthly_limit: monthlyLimit,
        alert_threshold: alertThreshold,
        is_active: isActive
      })
      .eq('id', budgetId)
      .select()
      .single();

    if (error) throw error;

    const updatedBudget: CategoryBudget = {
      id: data.id,
      categoryId: data.category_id,
      monthlyLimit: data.monthly_limit,
      alertThreshold: data.alert_threshold,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setData(prev => ({
      ...prev,
      categoryBudgets: prev.categoryBudgets.map(budget => 
        budget.id === budgetId ? updatedBudget : budget
      ),
    }));

    toast.success('Budget updated successfully');
  };

  const deleteCategoryBudget = async (budgetId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('category_budgets')
      .delete()
      .eq('id', budgetId);

    if (error) throw error;

    setData(prev => ({
      ...prev,
      categoryBudgets: prev.categoryBudgets.filter(budget => budget.id !== budgetId),
    }));

    toast.success('Budget deleted successfully');
  };

  // Goals CRUD methods
  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        name: goal.name,
        description: goal.description,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        target_date: goal.targetDate,
        priority: goal.priority,
        color: goal.color,
        icon_url: goal.iconUrl,
        icon_type: goal.iconType,
        preset_icon_id: goal.presetIconId,
        is_active: goal.isActive,
        is_completed: goal.isCompleted,
        completed_at: goal.completedAt,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    const newGoal: SavingsGoal = {
      id: data.id,
      name: data.name,
      description: data.description,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      targetDate: data.target_date,
      priority: data.priority,
      color: data.color,
      iconUrl: data.icon_url,
      iconType: data.icon_type,
      presetIconId: data.preset_icon_id,
      isActive: data.is_active,
      isCompleted: data.is_completed,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setData(prev => ({
      ...prev,
      savingsGoals: [newGoal, ...prev.savingsGoals],
    }));

    toast.success('Savings goal created successfully');
  };

  const updateSavingsGoal = async (goalId: string, updates: Partial<SavingsGoal>) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.iconUrl !== undefined) dbUpdates.icon_url = updates.iconUrl;
    if (updates.iconType !== undefined) dbUpdates.icon_type = updates.iconType;
    if (updates.presetIconId !== undefined) dbUpdates.preset_icon_id = updates.presetIconId;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

    const { data, error } = await supabase
      .from('savings_goals')
      .update(dbUpdates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    const updatedGoal: SavingsGoal = {
      id: data.id,
      name: data.name,
      description: data.description,
      targetAmount: data.target_amount,
      currentAmount: data.current_amount,
      targetDate: data.target_date,
      priority: data.priority,
      color: data.color,
      iconUrl: data.icon_url,
      iconType: data.icon_type,
      presetIconId: data.preset_icon_id,
      isActive: data.is_active,
      isCompleted: data.is_completed,
      completedAt: data.completed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ),
    }));

    toast.success('Savings goal updated successfully');
  };

  const deleteSavingsGoal = async (goalId: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;

    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter(goal => goal.id !== goalId),
      goalMilestones: prev.goalMilestones.filter(milestone => milestone.goalId !== goalId),
      goalContributions: prev.goalContributions.filter(contribution => contribution.goalId !== goalId),
    }));

    toast.success('Savings goal deleted successfully');
  };

  const addGoalContribution = async (goalId: string, amount: number, description?: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!user) throw new Error('User not authenticated');
    
    // Add the contribution
    const { data: contributionData, error: contributionError } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        amount: amount,
        description: description,
        contribution_date: new Date().toISOString().split('T')[0],
        user_id: user.id
      })
      .select()
      .single();

    if (contributionError) throw contributionError;

    // Update the goal's current amount
    const currentGoal = data.savingsGoals.find(g => g.id === goalId);
    if (!currentGoal) throw new Error('Goal not found');

    const newCurrentAmount = currentGoal.currentAmount + amount;
    const isCompleted = newCurrentAmount >= currentGoal.targetAmount;

    const { data: goalData, error: goalError } = await supabase
      .from('savings_goals')
      .update({
        current_amount: newCurrentAmount,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', goalId)
      .select()
      .single();

    if (goalError) throw goalError;

    // Transform the data
    const newContribution: GoalContribution = {
      id: contributionData.id,
      goalId: contributionData.goal_id,
      amount: contributionData.amount,
      description: contributionData.description,
      contributionDate: contributionData.contribution_date,
      createdAt: contributionData.created_at,
    };

    const updatedGoal: SavingsGoal = {
      id: goalData.id,
      name: goalData.name,
      description: goalData.description,
      targetAmount: goalData.target_amount,
      currentAmount: goalData.current_amount,
      targetDate: goalData.target_date,
      priority: goalData.priority,
      color: goalData.color,
      iconUrl: goalData.icon_url,
      iconType: goalData.icon_type,
      presetIconId: goalData.preset_icon_id,
      isActive: goalData.is_active,
      isCompleted: goalData.is_completed,
      completedAt: goalData.completed_at,
      createdAt: goalData.created_at,
      updatedAt: goalData.updated_at,
    };

    setData(prev => ({
      ...prev,
      goalContributions: [newContribution, ...prev.goalContributions],
      savingsGoals: prev.savingsGoals.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ),
    }));

    toast.success(`Added ${formatCurrency(amount)} to ${currentGoal.name}`);
  };

  const updateBudgetAlert = async (alertType: string, isEnabled: boolean) => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('budget_alerts')
      .update({ is_enabled: isEnabled })
      .eq('alert_type', alertType)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const updatedAlert: BudgetAlert = {
      id: data.id,
      alertType: data.alert_type,
      isEnabled: data.is_enabled,
      thresholdPercentage: data.threshold_percentage,
      milestonePercentage: data.milestone_percentage,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    setData(prev => ({
      ...prev,
      budgetAlerts: prev.budgetAlerts.map(alert => 
        alert.alertType === alertType ? updatedAlert : alert
      ),
    }));

    toast.success(`Alert ${isEnabled ? 'enabled' : 'disabled'}`);
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
      addCategoryBudget,
      updateCategoryBudget,
      deleteCategoryBudget,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      addGoalContribution,
      updateBudgetAlert,
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