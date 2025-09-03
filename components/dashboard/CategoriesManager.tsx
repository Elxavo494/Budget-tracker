'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit } from 'lucide-react';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import toast from 'react-hot-toast';

export const CategoriesManager: React.FC = () => {
  const { data, deleteCategory } = useSupabaseFinance();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    categoryId: string;
    categoryName: string;
  }>({ open: false, categoryId: '', categoryName: '' });

  const handleDeleteClick = (categoryId: string, categoryName: string) => {
    // Check if category is being used
    const isUsedInRecurring = data.recurringExpenses.some(exp => exp.categoryId === categoryId);
    const isUsedInOneTime = data.oneTimeExpenses.some(exp => exp.categoryId === categoryId);
    
    if (isUsedInRecurring || isUsedInOneTime) {
      toast.error('Cannot delete category that is being used by expenses. Please reassign or delete those expenses first.');
      return;
    }
    
    setDeleteDialog({ open: true, categoryId, categoryName });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteCategory(deleteDialog.categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setDeleteDialog({ open: false, categoryId: '', categoryName: '' });
    }
  };

  return (
    <div className="space-y-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">Expense Categories</CardTitle>
        <CategoryForm />
      </CardHeader>
      <div className="space-y-3">
        {data.categories.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 dark:text-slate-500 mb-2">No categories yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-600">Create categories to organize your expenses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{category.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CategoryForm category={category}>
                    <Button variant="ghost" size="sm" className="hover:bg-slate-200 dark:hover:bg-slate-500">
                      <Edit className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                  </CategoryForm>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="hover:bg-rose-100 dark:hover:bg-rose-800"
                    onClick={() => handleDeleteClick(category.id, category.name)}
                  >
                    <Trash2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        title="Delete Category"
        description={`Are you sure you want to delete the "${deleteDialog.categoryName}" category? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
};