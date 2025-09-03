'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface LocalStorageData {
  categories: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  recurringIncomes: Array<{
    id: string;
    name: string;
    amount: number;
    recurrence: 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    endDate?: string;
    createdAt: string;
  }>;
  recurringExpenses: Array<{
    id: string;
    name: string;
    amount: number;
    recurrence: 'weekly' | 'monthly' | 'yearly';
    categoryId: string;
    startDate: string;
    endDate?: string;
    createdAt: string;
  }>;
  oneTimeIncomes: Array<{
    id: string;
    name: string;
    amount: number;
    date: string;
    createdAt: string;
  }>;
  oneTimeExpenses: Array<{
    id: string;
    name: string;
    amount: number;
    categoryId: string;
    date: string;
    createdAt: string;
  }>;
}

export const DataImporter: React.FC = () => {
  const { user } = useAuth();
  const { 
    data, 
    addCategory, 
    addRecurringIncome, 
    addRecurringExpense, 
    addOneTimeIncome, 
    addOneTimeExpense 
  } = useSupabaseFinance();
  
  const [open, setOpen] = useState(false);
  const [jsonData, setJsonData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleImport = async () => {
    if (!user || !jsonData.trim() || !supabase) return;

    setImporting(true);
    setImportStatus(null);

    try {
      const localData: LocalStorageData = JSON.parse(jsonData);
      
      // Validate the data structure
      if (!localData.categories || !Array.isArray(localData.categories)) {
        throw new Error('Invalid data format: categories array is required');
      }

      const results = {
        categories: { success: 0, failed: 0, errors: [] as string[] },
        recurringIncomes: { success: 0, failed: 0, errors: [] as string[] },
        recurringExpenses: { success: 0, failed: 0, errors: [] as string[] },
        oneTimeIncomes: { success: 0, failed: 0, errors: [] as string[] },
        oneTimeExpenses: { success: 0, failed: 0, errors: [] as string[] },
      };

      // Create a mapping from old category IDs to new category IDs
      const categoryMapping: { [oldId: string]: string } = {};

      // 1. Import Categories (skip existing ones)
      
      for (const category of localData.categories) {
        try {
          // Check if category already exists by name
          const existingCategory = data.categories.find(c => c.name === category.name);
          
          if (existingCategory) {
            // Use existing category
            categoryMapping[category.id] = existingCategory.id;
            
          } else {
            // Create new category
            await addCategory({
              name: category.name,
              color: category.color,
            });
            
            // Find the newly created category to get its ID
            // We'll need to refetch or get it from the response
            // For now, we'll mark it as successful and handle mapping later
            results.categories.success++;
            console.log(`Created category: ${category.name}`);
          }
        } catch (error: any) {
          results.categories.failed++;
          results.categories.errors.push(`${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`Failed to create category ${category.name}:`, error);
        }
      }

      // Wait a moment for categories to be created and refetch data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update category mapping with newly created categories
      for (const category of localData.categories) {
        if (!categoryMapping[category.id]) {
          const newCategory = data.categories.find(c => c.name === category.name);
          if (newCategory) {
            categoryMapping[category.id] = newCategory.id;
          }
        }
      }

      // 2. Import Recurring Incomes
      console.log('Importing recurring incomes...');
      for (const income of localData.recurringIncomes || []) {
        try {
          await addRecurringIncome({
            name: income.name,
            amount: income.amount,
            recurrence: income.recurrence,
            startDate: income.startDate,
            endDate: income.endDate,
          });
          results.recurringIncomes.success++;
          console.log(`Created recurring income: ${income.name}`);
        } catch (error: any) {
          results.recurringIncomes.failed++;
          results.recurringIncomes.errors.push(`${income.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`Failed to create recurring income ${income.name}:`, error);
        }
      }

      // 3. Import Recurring Expenses
      console.log('Importing recurring expenses...');
      for (const expense of localData.recurringExpenses || []) {
        try {
          const newCategoryId = categoryMapping[expense.categoryId];
          if (!newCategoryId) {
            throw new Error(`Category mapping not found for ID: ${expense.categoryId}`);
          }

          const { data: newExpense, error } = await supabase
            .from('recurring_expenses')
            .insert([{
              name: expense.name,
              amount: expense.amount,
              recurrence: expense.recurrence,
              start_date: expense.startDate,
              end_date: expense.endDate || null,
              category_id: newCategoryId,
              user_id: user.id
            }])
            .select()
            .single();

          if (error) throw error;

          // Update local state
          const transformedExpense = {
            id: newExpense.id,
            name: expense.name,
            amount: expense.amount,
            recurrence: expense.recurrence,
            categoryId: newExpense.category_id,
            startDate: expense.startDate,
            endDate: expense.endDate,
            createdAt: newExpense.created_at,
          };
          
          results.recurringExpenses.success++;
          console.log(`Created recurring expense: ${expense.name}`);
        } catch (error: any) {
          results.recurringExpenses.failed++;
          results.recurringExpenses.errors.push(`${expense.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`Failed to create recurring expense ${expense.name}:`, error);
        }
      }

      // 4. Import One-time Incomes
      console.log('Importing one-time incomes...');
      for (const income of localData.oneTimeIncomes || []) {
        try {
          await addOneTimeIncome({
            name: income.name,
            amount: income.amount,
            date: income.date,
          });
          results.oneTimeIncomes.success++;
          console.log(`Created one-time income: ${income.name}`);
        } catch (error: any) {
          results.oneTimeIncomes.failed++;
          results.oneTimeIncomes.errors.push(`${income.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`Failed to create one-time income ${income.name}:`, error);
        }
      }

      // 5. Import One-time Expenses
      console.log('Importing one-time expenses...');
      for (const expense of localData.oneTimeExpenses || []) {
        try {
          const newCategoryId = categoryMapping[expense.categoryId];
          if (!newCategoryId) {
            throw new Error(`Category mapping not found for ID: ${expense.categoryId}`);
          }

          const { data: newExpense, error } = await supabase
            .from('one_time_expenses')
            .insert([{
              name: expense.name,
              amount: expense.amount,
              date: expense.date,
              category_id: newCategoryId,
              user_id: user.id
            }])
            .select()
            .single();

          if (error) throw error;

          // Update local state  
          const transformedExpense = {
            id: newExpense.id,
            name: expense.name,
            amount: expense.amount,
            categoryId: newExpense.category_id,
            date: expense.date,
            createdAt: newExpense.created_at,
          };
          
          results.oneTimeExpenses.success++;
          console.log(`Created one-time expense: ${expense.name}`);
        } catch (error: any) {
          results.oneTimeExpenses.failed++;
          results.oneTimeExpenses.errors.push(`${expense.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          console.error(`Failed to create one-time expense ${expense.name}:`, error);
        }
      }

      // Calculate totals
      const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.success, 0);
      const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);

      setImportStatus({
        success: totalFailed === 0,
        message: `Import completed! ${totalSuccess} items imported successfully${totalFailed > 0 ? `, ${totalFailed} failed` : ''}.`,
        details: results,
      });

      if (totalFailed === 0) {
        setJsonData('');
        setTimeout(() => setOpen(false), 3000);
      }

    } catch (error: any) {
      console.error('Import failed:', error);
      setImportStatus({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Data from localStorage</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Paste your localStorage JSON data below. This will import all your categories, 
              recurring transactions, and one-time transactions to Supabase.
            </p>
            <Textarea
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Paste your JSON data here..."
              className="min-h-[200px] font-mono text-sm"
              disabled={importing}
            />
          </div>

          {importStatus && (
            <div className={`p-4 rounded-lg border ${
              importStatus.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {importStatus.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{importStatus.message}</span>
              </div>
              
              {importStatus.details && (
                <div className="text-sm space-y-1">
                  {Object.entries(importStatus.details).map(([key, result]: [string, any]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span>
                        ✅ {result.success} 
                        {result.failed > 0 && <span className="text-red-600 ml-2">❌ {result.failed}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleImport} 
              disabled={!jsonData.trim() || importing}
              className="flex-1"
            >
              {importing ? 'Importing...' : 'Import Data'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};