'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BudgetManager } from './BudgetManager';
import { GoalsManager } from '../goals/GoalsManager';
import { CategoryBudgetProgress, GoalProgress } from '@/types';
import { useCurrency } from '@/hooks/use-currency';
import { Target, TrendingUp, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleBudgetGoalsOverviewProps {
  budgetProgress: CategoryBudgetProgress[];
  goalsProgress: GoalProgress[];
  onCreateBudget: (categoryId: string, monthlyLimit: number, alertThreshold: number) => Promise<void>;
  onUpdateBudget: (budgetId: string, monthlyLimit: number, alertThreshold: number, isActive: boolean) => Promise<void>;
  onDeleteBudget: (budgetId: string) => Promise<void>;
  onCreateGoal: (goal: any) => Promise<void>;
  onUpdateGoal: (goalId: string, updates: any) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onAddContribution: (goalId: string, amount: number, description?: string) => Promise<void>;
  categories: any[];
  goals: any[];
  categoryBudgets: any[];
  onCreateCategory?: (category: any) => Promise<void>;
}

export const SimpleBudgetGoalsOverview: React.FC<SimpleBudgetGoalsOverviewProps> = ({
  budgetProgress,
  goalsProgress,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddContribution,
  categories,
  goals,
  categoryBudgets,
  onCreateCategory
}) => {
  const { formatCurrency } = useCurrency();
  const [showBudgetManager, setShowBudgetManager] = useState(false);
  const [showGoalsManager, setShowGoalsManager] = useState(false);

  // Calculate summary stats
  const totalBudget = budgetProgress.reduce((sum, b) => sum + b.budgetLimit, 0);
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.currentSpent, 0);
  const overallBudgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const categoriesOverBudget = budgetProgress.filter(b => b.isOverBudget).length;

  const activeGoals = goalsProgress.filter(g => !g.goal.isCompleted);
  const completedGoals = goalsProgress.filter(g => g.goal.isCompleted);
  const totalGoalProgress = goalsProgress.length > 0 
    ? goalsProgress.reduce((sum, g) => sum + g.progressPercentage, 0) / goalsProgress.length 
    : 0;

  // Show only if there's data or user wants to create
  const hasBudgets = budgetProgress.length > 0;
  const hasGoals = goalsProgress.length > 0;
  
  if (!hasBudgets && !hasGoals) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mt-4">
        {/* Budget Quick Setup */}
        <Card className="rounded-2xl border glass-card text-card-foreground transition-smooth shadow-sm hover:shadow-md transition-shadow duration-200 glass-card">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-4 mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Set Budget Limits
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Track spending against monthly limits
            </p>
            <Button onClick={() => setShowBudgetManager(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </CardContent>
        </Card>

        {/* Goals Quick Setup */}
        <Card className="rounded-2xl border glass-card text-card-foreground transition-smooth shadow-sm hover:shadow-md transition-shadow duration-200 glass-card">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 mb-4">
              <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Set Savings Goals
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Track progress towards financial targets
            </p>
            <Button onClick={() => setShowGoalsManager(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </CardContent>
        </Card>

        {/* Budget Manager Modal */}
        <Dialog open={showBudgetManager} onOpenChange={setShowBudgetManager}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader className="space-y-3 pb-4">
              <DialogTitle className="text-xl sm:text-2xl">
                Manage Budgets
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-muted-foreground">
                Set spending limits for your categories and track your progress.
              </DialogDescription>
            </DialogHeader>
            <BudgetManager
              categories={categories}
              categoryBudgets={categoryBudgets}
              budgetProgress={budgetProgress}
              onCreateBudget={onCreateBudget}
              onUpdateBudget={onUpdateBudget}
              onDeleteBudget={onDeleteBudget}
              onCreateCategory={onCreateCategory}
            />
          </DialogContent>
        </Dialog>

        {/* Goals Manager Modal */}
        <Dialog open={showGoalsManager} onOpenChange={setShowGoalsManager}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader className="space-y-3 pb-4">
              <DialogTitle className="text-xl sm:text-2xl">
                Manage Savings Goals
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-muted-foreground">
                Create and track your financial goals with milestone celebrations.
              </DialogDescription>
            </DialogHeader>
            <GoalsManager
              goals={goals}
              goalsProgress={goalsProgress}
              onCreateGoal={onCreateGoal}
              onUpdateGoal={onUpdateGoal}
              onDeleteGoal={onDeleteGoal}
              onAddContribution={onAddContribution}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Budget Summary */}
        {hasBudgets && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Budget Overview
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  onClick={() => setShowBudgetManager(true)}
                >
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {formatCurrency(totalSpent)} spent
                  </span>
                  <span className="font-medium">
                    {formatCurrency(totalBudget)} budget
                  </span>
                </div>
                <Progress 
                  value={Math.min(overallBudgetProgress, 100)} 
                  className="h-2" 
                  style={{ '--progress-background': 'hsl(var(--primary))' } as React.CSSProperties}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className={cn(
                    "font-medium",
                    categoriesOverBudget > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  )}>
                    {overallBudgetProgress.toFixed(1)}% used
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {budgetProgress.length} categories
                  </span>
                </div>
              </div>

              {/* Budget List */}
              {budgetProgress.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {budgetProgress.slice(0, 2).map((budget) => (
                    <div key={budget.categoryId} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      {/* Budget Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: budget.categoryColor }}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {budget.categoryName}
                            </h4>
                          </div>
                        </div>
                      </div>

                      {/* Amount Display */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(budget.currentSpent)}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(budget.budgetLimit)}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <Progress 
                          value={Math.min(budget.progressPercentage, 100)} 
                          className="h-2"
                          style={{ 
                            '--progress-background': budget.isOverBudget ? '#ef4444' : budget.categoryColor 
                          } as React.CSSProperties}
                        />
                        <div className="flex justify-between items-center text-xs">
                          <span className={cn(
                            "font-medium",
                            budget.isOverBudget ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                          )}>
                            {budget.progressPercentage.toFixed(1)}% used
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {budget.isOverBudget 
                              ? `${formatCurrency(Math.abs(budget.remainingBudget))} over`
                              : `${formatCurrency(budget.remainingBudget)} left`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {budgetProgress.length > 2 && (
                    <div className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-slate-500 dark:text-slate-400 h-8"
                        onClick={() => setShowBudgetManager(true)}
                      >
                        +{budgetProgress.length - 2} more budgets
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="flex justify-center">
                {categoriesOverBudget > 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {categoriesOverBudget} over budget
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    All on track
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Goals Summary */}
        {hasGoals && (
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals Overview
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  onClick={() => setShowGoalsManager(true)}
                >
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    {completedGoals.length}/{goalsProgress.length} completed
                  </span>
       
                </div>
                <Progress 
                  value={Math.min(totalGoalProgress, 100)} 
                  className="h-2"
                  style={{ '--progress-background': 'hsl(var(--primary))' } as React.CSSProperties}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {activeGoals.length} active goals
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {completedGoals.length} completed
                  </span>
                </div>
              </div>

              {/* Goals List */}
              {goalsProgress.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {goalsProgress.slice(0, 2).map((goalProgress) => (
                    <div key={goalProgress.goal.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      {/* Goal Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: goalProgress.goal.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {goalProgress.goal.name}
                            </h4>
                            {goalProgress.goal.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                {goalProgress.goal.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount Display */}
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(goalProgress.goal.currentAmount)}
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {formatCurrency(goalProgress.goal.targetAmount)}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <Progress 
                          value={Math.min(Math.max(goalProgress.progressPercentage || 0, 0), 100)} 
                          className="h-2"
                          style={{ 
                            '--progress-background': goalProgress.goal.color 
                          } as React.CSSProperties}
                        />
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {goalProgress.progressPercentage.toFixed(1)}% complete
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {formatCurrency(goalProgress.remainingAmount)} to go
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {goalsProgress.length > 2 && (
                    <div className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-slate-500 dark:text-slate-400 h-8"
                        onClick={() => setShowGoalsManager(true)}
                      >
                        +{goalsProgress.length - 2} more goals
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Status */}
              <div className="flex justify-center">
                {completedGoals.length > 0 ? (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {completedGoals.length} completed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    In progress
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Budget/Goal if missing */}
        {!hasBudgets && hasGoals && (
          <Card className="glass-card border border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-4 mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Add Budget Limits
              </h3>
              <Button onClick={() => setShowBudgetManager(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </CardContent>
          </Card>
        )}

        {hasBudgets && !hasGoals && (
          <Card className="glass-card border border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 mb-4">
                <Target className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Add Savings Goals
              </h3>
              <Button onClick={() => setShowGoalsManager(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Manager Modal */}
      <Dialog open={showBudgetManager} onOpenChange={setShowBudgetManager}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-xl sm:text-2xl">
              Manage Budgets
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              Set spending limits for your categories and track your progress.
            </DialogDescription>
          </DialogHeader>
          <BudgetManager
            categories={categories}
            categoryBudgets={categoryBudgets}
            budgetProgress={budgetProgress}
            onCreateBudget={onCreateBudget}
            onUpdateBudget={onUpdateBudget}
            onDeleteBudget={onDeleteBudget}
            onCreateCategory={onCreateCategory}
          />
        </DialogContent>
      </Dialog>

      {/* Goals Manager Modal */}
      <Dialog open={showGoalsManager} onOpenChange={setShowGoalsManager}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader className="space-y-3 pb-4">
            <DialogTitle className="text-xl sm:text-2xl">
              Manage Savings Goals
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              Create and track your financial goals with milestone celebrations.
            </DialogDescription>
          </DialogHeader>
          <GoalsManager
            goals={goals}
            goalsProgress={goalsProgress}
            onCreateGoal={onCreateGoal}
            onUpdateGoal={onUpdateGoal}
            onDeleteGoal={onDeleteGoal}
            onAddContribution={onAddContribution}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
