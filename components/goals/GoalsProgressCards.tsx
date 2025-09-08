'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GoalProgress } from '@/types';
import { useCurrency } from '@/hooks/use-currency';
import { Target, Calendar, TrendingUp, CheckCircle2, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface GoalsProgressCardsProps {
  goalsProgress: GoalProgress[];
  onManageGoals?: () => void;
  onAddContribution?: (goalId: string) => void;
  showManageButton?: boolean;
  maxCards?: number;
}

export const GoalsProgressCards: React.FC<GoalsProgressCardsProps> = ({
  goalsProgress,
  onManageGoals,
  onAddContribution,
  showManageButton = true,
  maxCards = 3
}) => {
  const { formatCurrency } = useCurrency();
  const displayedGoals = goalsProgress.slice(0, maxCards);
  const hasMoreGoals = goalsProgress.length > maxCards;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDaysRemaining = (targetDate?: string) => {
    if (!targetDate) return null;
    const days = differenceInDays(new Date(targetDate), new Date());
    return days > 0 ? days : 0;
  };

  if (goalsProgress.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Savings Goals
            </CardTitle>
            {showManageButton && onManageGoals && (
              <Button variant="outline" size="sm" onClick={onManageGoals}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
            <Target className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No Goals Set
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Create savings goals to track your progress
          </p>
          {showManageButton && onManageGoals && (
            <Button onClick={onManageGoals} size="sm">
              Create Goal
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
            Savings Goals
          </CardTitle>
          {showManageButton && onManageGoals && (
            <Button variant="outline" size="sm" onClick={onManageGoals}>
              <Target className="h-4 w-4 mr-2" />
              Manage
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedGoals.map((goalProgress) => {
          const goal = goalProgress.goal;
          const daysRemaining = getDaysRemaining(goal.targetDate);
          
          return (
            <div key={goal.id} className="space-y-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              {/* Goal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {goal.iconUrl && (
                    <img 
                      src={goal.iconUrl} 
                      alt={goal.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {goal.name}
                  </span>
                  {goal.isCompleted && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(goal.currentAmount)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    of {formatCurrency(goal.targetAmount)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <Progress 
                  value={Math.min(Math.max(goalProgress.progressPercentage || 0, 0), 100)} 
                  className="h-2"
                  style={{ '--progress-background': goal.color || 'hsl(var(--primary))' } as React.CSSProperties}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium" style={{ color: goal.color }}>
                    {goalProgress.progressPercentage.toFixed(1)}% complete
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatCurrency(goalProgress.remainingAmount)} to go
                  </span>
                </div>
              </div>

              {/* Goal Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(goal.priority)} variant="secondary">
                    {goal.priority}
                  </Badge>
                  {goal.targetDate && (
                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {daysRemaining !== null && daysRemaining > 0 ? (
                          <span className={cn(
                            daysRemaining < 30 ? "text-red-600 dark:text-red-400" :
                            daysRemaining < 90 ? "text-yellow-600 dark:text-yellow-400" :
                            "text-green-600 dark:text-green-400"
                          )}>
                            {daysRemaining}d left
                          </span>
                        ) : (
                          format(new Date(goal.targetDate), 'MMM yyyy')
                        )}
                      </span>
                    </div>
                  )}
                </div>
                {!goal.isCompleted && onAddContribution && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onAddContribution(goal.id)}
                    className="text-xs px-2 py-1 h-6"
                  >
                    Add
                  </Button>
                )}
              </div>

              {/* Monthly Target */}
              {goalProgress.monthlyTargetContribution && !goal.isCompleted && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded px-2 py-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>
                    Suggested: {formatCurrency(goalProgress.monthlyTargetContribution)}/month
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Show More Button */}
        {hasMoreGoals && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onManageGoals}
              className="w-full text-slate-600 dark:text-slate-400"
            >
              View {goalsProgress.length - maxCards} more goals
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact overview version for dashboard
export const GoalsOverviewCard: React.FC<{
  goalsProgress: GoalProgress[];
  onViewDetails?: () => void;
}> = ({ goalsProgress, onViewDetails }) => {
  const { formatCurrency } = useCurrency();
  const activeGoals = goalsProgress.filter(g => !g.goal.isCompleted);
  const completedGoals = goalsProgress.filter(g => g.goal.isCompleted);
  const totalTargetAmount = goalsProgress.reduce((sum, g) => sum + g.goal.targetAmount, 0);
  const totalCurrentAmount = goalsProgress.reduce((sum, g) => sum + g.goal.currentAmount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
  const highPriorityGoals = activeGoals.filter(g => g.goal.priority === 'high').length;

  return (
    <Card className="glass-card cursor-pointer hover:shadow-md transition-shadow" onClick={onViewDetails}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Goals Overview
          </CardTitle>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {completedGoals.length}/{goalsProgress.length} completed
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              {formatCurrency(totalCurrentAmount)} saved
            </span>
            <span className="font-medium">
              {formatCurrency(totalTargetAmount)} target
            </span>
          </div>
          <Progress 
            value={Math.min(overallProgress, 100)} 
            className="h-2"
            style={{ '--progress-background': 'hsl(var(--primary))' } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs">
            <span className="font-medium text-green-600 dark:text-green-400">
              {overallProgress.toFixed(1)}% complete
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {activeGoals.length} active
            </span>
          </div>
        </div>

        {/* Quick Status Summary */}
        <div className="flex gap-2 flex-wrap">
          {completedGoals.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {completedGoals.length} completed
            </Badge>
          )}
          {highPriorityGoals > 0 && (
            <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              {highPriorityGoals} high priority
            </Badge>
          )}
          {activeGoals.length === 0 && goalsProgress.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              All goals completed!
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
