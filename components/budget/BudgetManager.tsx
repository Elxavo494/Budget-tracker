'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { CategoryBudget, Category, CategoryBudgetProgress } from '@/types';
import { useCurrency } from '@/hooks/use-currency';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { Settings, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetManagerProps {
  categories: Category[];
  categoryBudgets: CategoryBudget[];
  budgetProgress: CategoryBudgetProgress[];
  onCreateBudget: (categoryId: string, monthlyLimit: number, alertThreshold: number) => Promise<void>;
  onUpdateBudget: (budgetId: string, monthlyLimit: number, alertThreshold: number, isActive: boolean) => Promise<void>;
  onDeleteBudget: (budgetId: string) => Promise<void>;
  onCreateCategory?: (category: Omit<Category, 'id'>) => Promise<void>;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  categories,
  categoryBudgets,
  budgetProgress,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
  onCreateCategory
}) => {
  const { formatCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [monthlyLimit, setMonthlyLimit] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<number[]>([80]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const categoriesWithoutBudgets = categories.filter(
    category => !categoryBudgets.some(budget => budget.categoryId === category.id && budget.isActive)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyLimit || parseFloat(monthlyLimit) <= 0) return;

    setLoading(true);
    try {
      if (editingBudget) {
        await onUpdateBudget(
          editingBudget.id,
          parseFloat(monthlyLimit),
          alertThreshold[0] / 100,
          isActive
        );
      } else {
        if (!selectedCategoryId) return;
        await onCreateBudget(
          selectedCategoryId,
          parseFloat(monthlyLimit),
          alertThreshold[0] / 100
        );
      }
      handleClose();
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBudget(null);
    setSelectedCategoryId('');
    setMonthlyLimit('');
    setAlertThreshold([80]);
    setIsActive(true);
  };

  const handleEdit = (budget: CategoryBudget) => {
    setEditingBudget(budget);
    setMonthlyLimit(budget.monthlyLimit.toString());
    setAlertThreshold([budget.alertThreshold * 100]);
    setIsActive(budget.isActive);
    setOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (confirm('Are you sure you want to delete this budget?')) {
      await onDeleteBudget(budgetId);
    }
  };

  const getBudgetStatusColor = (progress: CategoryBudgetProgress) => {
    if (progress.isOverBudget) return 'text-red-600 dark:text-red-400';
    if (progress.shouldAlert) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getBudgetStatusIcon = (progress: CategoryBudgetProgress) => {
    if (progress.isOverBudget) return <AlertTriangle className="h-4 w-4" />;
    if (progress.shouldAlert) return <Target className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Budget Manager</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Set spending limits for your categories and track your progress
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingBudget && (
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="flex gap-2">
                    <select
                      id="category"
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
                      required
                    >
                      <option value="">Select a category</option>
                      {categoriesWithoutBudgets.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  {onCreateCategory && (
                    <CategoryForm>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="px-3"
                        title="Create new category"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CategoryForm>
                  )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="monthlyLimit">Monthly Budget Limit</Label>
                <Input
                  id="monthlyLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Alert Threshold: {alertThreshold[0]}%</Label>
                <Slider
                  value={alertThreshold}
                  onValueChange={setAlertThreshold}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You&apos;ll be notified when spending reaches this percentage
                </p>
              </div>

              {editingBudget && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : editingBudget ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetProgress.map((progress) => {
          const budget = categoryBudgets.find(b => b.categoryId === progress.categoryId);
          if (!budget) return null;

          return (
            <Card key={progress.categoryId} className="glass-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: progress.categoryColor }}
                    />
                    <CardTitle className="text-lg">{progress.categoryName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={cn("flex items-center gap-1", getBudgetStatusColor(progress))}>
                      {getBudgetStatusIcon(progress)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(budget)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(budget.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatCurrency(progress.currentSpent)} spent
                    </span>
                    <span className="font-medium">
                      {formatCurrency(progress.budgetLimit)} budget
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(progress.progressPercentage, 100)} 
                    className="h-2"
                    style={{ '--progress-background': progress.isOverBudget ? '#ef4444' : (progress.categoryColor || 'hsl(var(--primary))') } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={cn("font-medium", getBudgetStatusColor(progress))}>
                      {progress.progressPercentage.toFixed(1)}% used
                    </span>
                    <span className={progress.remainingBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {progress.remainingBudget >= 0 ? 
                        `${formatCurrency(progress.remainingBudget)} left` : 
                        `${formatCurrency(Math.abs(progress.remainingBudget))} over`
                      }
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  {progress.isOverBudget ? (
                    <Badge variant="destructive" className="text-xs">
                      Over Budget
                    </Badge>
                  ) : progress.shouldAlert ? (
                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Near Limit
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      On Track
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Budget Card */}
        {categoriesWithoutBudgets.length > 0 && (
          <Card className="glass-card border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 mb-4">
                <Plus className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Add Budget
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Set spending limits for your categories
              </p>
              <Button onClick={() => setOpen(true)} variant="outline" size="sm">
                Create Budget
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No Budgets State */}
      {budgetProgress.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-6">
              <Target className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No Budgets Set
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
              Create budgets for your spending categories to track your progress and stay on top of your finances.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
