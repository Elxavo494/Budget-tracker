'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryBudgetProgress } from '@/types';
import { useCurrency } from '@/hooks/use-currency';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetProgressCardsProps {
  budgetProgress: CategoryBudgetProgress[];
  onManageBudgets?: () => void;
  showManageButton?: boolean;
  maxCards?: number;
}

export const BudgetProgressCards: React.FC<BudgetProgressCardsProps> = ({
  budgetProgress,
  onManageBudgets,
  showManageButton = true,
  maxCards = 6
}) => {
  const { formatCurrency } = useCurrency();
  const displayedBudgets = budgetProgress.slice(0, maxCards);
  const hasMoreBudgets = budgetProgress.length > maxCards;

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

  const getProgressBarColor = (progress: CategoryBudgetProgress) => {
    if (progress.isOverBudget) return 'bg-red-500';
    if (progress.shouldAlert) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (budgetProgress.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Budget Progress
            </CardTitle>
            {showManageButton && onManageBudgets && (
              <Button variant="outline" size="sm" onClick={onManageBudgets}>
                <Settings className="h-4 w-4 mr-2" />
                Set Budgets
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
            <Target className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No Budgets Set
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Set spending limits to track your progress
          </p>
          {showManageButton && onManageBudgets && (
            <Button onClick={onManageBudgets} size="sm">
              Create Budget
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Budget Progress
          </CardTitle>
          {showManageButton && onManageBudgets && (
            <Button variant="outline" size="sm" onClick={onManageBudgets}>
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedBudgets.map((progress) => (
          <div key={progress.categoryId} className="space-y-2">
            {/* Category Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: progress.categoryColor }}
                />
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {progress.categoryName}
                </span>
                <div className={cn("flex items-center", getBudgetStatusColor(progress))}>
                  {getBudgetStatusIcon(progress)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(progress.currentSpent)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  of {formatCurrency(progress.budgetLimit)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress 
                value={Math.min(progress.progressPercentage, 100)} 
                className="h-2"
                style={{
                  '--progress-background': progress.isOverBudget ? '#ef4444' : (progress.categoryColor || 'hsl(var(--primary))')
                } as React.CSSProperties}
              />
              <div className="flex justify-between items-center text-xs">
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
            <div className="flex justify-start">
              {progress.isOverBudget ? (
                <Badge variant="destructive" className="text-xs">
                  Over Budget
                </Badge>
              ) : progress.shouldAlert ? (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Near Limit ({Math.round(progress.alertThreshold * 100)}%)
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  On Track
                </Badge>
              )}
            </div>
          </div>
        ))}

        {/* Show More Button */}
        {hasMoreBudgets && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onManageBudgets}
              className="w-full text-slate-600 dark:text-slate-400"
            >
              View {budgetProgress.length - maxCards} more budgets
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact version for dashboard overview
export const BudgetOverviewCard: React.FC<{
  budgetProgress: CategoryBudgetProgress[];
  onViewDetails?: () => void;
}> = ({ budgetProgress, onViewDetails }) => {
  const totalBudget = budgetProgress.reduce((sum, budget) => sum + budget.budgetLimit, 0);
  const totalSpent = budgetProgress.reduce((sum, budget) => sum + budget.currentSpent, 0);
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const categoriesOverBudget = budgetProgress.filter(budget => budget.isOverBudget).length;
  const categoriesNearLimit = budgetProgress.filter(budget => budget.shouldAlert && !budget.isOverBudget).length;

  const getOverallStatusColor = () => {
    if (categoriesOverBudget > 0) return 'text-red-600 dark:text-red-400';
    if (categoriesNearLimit > 0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getOverallStatusText = () => {
    if (categoriesOverBudget > 0) return `${categoriesOverBudget} over budget`;
    if (categoriesNearLimit > 0) return `${categoriesNearLimit} near limit`;
    return 'All on track';
  };

  return (
    <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={onViewDetails}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Budget Overview
          </CardTitle>
          <div className={cn("text-sm font-medium", getOverallStatusColor())}>
            {getOverallStatusText()}
          </div>
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
          <Progress value={Math.min(overallProgress, 100)} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className={cn("font-medium", getOverallStatusColor())}>
              {overallProgress.toFixed(1)}% used
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {budgetProgress.length} categories
            </span>
          </div>
        </div>

        {/* Quick Status Summary */}
        <div className="flex gap-2 flex-wrap">
          {categoriesOverBudget > 0 && (
            <Badge variant="destructive" className="text-xs">
              {categoriesOverBudget} over
            </Badge>
          )}
          {categoriesNearLimit > 0 && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {categoriesNearLimit} near limit
            </Badge>
          )}
          {categoriesOverBudget === 0 && categoriesNearLimit === 0 && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              All on track
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
