'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetProgressCards, BudgetOverviewCard } from '@/components/budget/BudgetProgressCards';
import { GoalsProgressCards, GoalsOverviewCard } from '@/components/goals/GoalsProgressCards';
import { AlertsSystem } from '@/components/alerts/AlertsSystem';
import { CelebrationModal } from '@/components/celebrations/CelebrationModal';
import { 
  CategoryBudgetProgress, 
  GoalProgress, 
  BudgetAlert,
  SavingsGoal 
} from '@/types';
import { 
  calculateCategoryBudgetProgress, 
  calculateAllGoalsProgress, 
  calculateMonthlyBudgetSummary 
} from '@/lib/budget-calculations';
import { useCurrency } from '@/hooks/use-currency';
import { Target, TrendingUp, AlertTriangle, CheckCircle, DollarSign, PiggyBank } from 'lucide-react';

interface BudgetGoalsDashboardProps {
  budgetProgress: CategoryBudgetProgress[];
  goalsProgress: GoalProgress[];
  budgetAlerts: BudgetAlert[];
  onManageBudgets: () => void;
  onManageGoals: () => void;
  onAddGoalContribution: (goalId: string) => void;
  onUpdateAlertSettings: (alertType: string, isEnabled: boolean) => Promise<void>;
  onDismissAlert: (alertId: string) => void;
}

export const BudgetGoalsDashboard: React.FC<BudgetGoalsDashboardProps> = ({
  budgetProgress,
  goalsProgress,
  budgetAlerts,
  onManageBudgets,
  onManageGoals,
  onAddGoalContribution,
  onUpdateAlertSettings,
  onDismissAlert
}) => {
  const { formatCurrency } = useCurrency();
  const [celebrationGoal, setCelebrationGoal] = useState<SavingsGoal | null>(null);
  const [celebrationMilestone, setCelebrationMilestone] = useState<number | undefined>();
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate summary statistics
  const budgetSummary = calculateMonthlyBudgetSummary(budgetProgress);
  const activeGoals = goalsProgress.filter(g => !g.goal.isCompleted);
  const completedGoals = goalsProgress.filter(g => g.goal.isCompleted);
  const totalGoalProgress = goalsProgress.reduce((sum, g) => sum + g.progressPercentage, 0) / Math.max(goalsProgress.length, 1);

  const handleCelebration = (goal: SavingsGoal, milestone?: number) => {
    setCelebrationGoal(goal);
    setCelebrationMilestone(milestone);
    setShowCelebration(true);
  };

  const handleShareAchievement = (goal: SavingsGoal, milestone?: number) => {
    const isCompleted = milestone === 1.0 || goal.isCompleted;
    const text = isCompleted 
      ? `🎉 I just completed my "${goal.name}" savings goal of ${formatCurrency(goal.targetAmount)}! #FinancialGoals #Savings`
      : `🎯 I reached ${(milestone! * 100).toFixed(0)}% of my "${goal.name}" savings goal! Making great progress! #FinancialGoals #Savings`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Financial Achievement',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      // You could show a toast here
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Overview */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Monthly Budget
              </CardTitle>
              <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(budgetSummary.totalBudget)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  {formatCurrency(budgetSummary.totalSpent)} spent
                </span>
                <span className={`font-medium ${
                  budgetSummary.isOverBudget 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  ({budgetSummary.overallProgress.toFixed(1)}%)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Budget Status
              </CardTitle>
              {budgetSummary.categoriesOverBudget > 0 ? (
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {budgetSummary.categoriesOverBudget === 0 ? 'On Track' : `${budgetSummary.categoriesOverBudget} Over`}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {budgetSummary.categoriesNearLimit > 0 && 
                  `${budgetSummary.categoriesNearLimit} near limit`
                }
                {budgetSummary.categoriesOverBudget === 0 && budgetSummary.categoriesNearLimit === 0 && 
                  'All categories within budget'
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Goals Progress
              </CardTitle>
              <Target className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {totalGoalProgress.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {completedGoals.length}/{goalsProgress.length} goals completed
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Savings Rate
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {budgetSummary.totalBudget > 0 ? 
                  `${((budgetSummary.totalRemaining / budgetSummary.totalBudget) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {formatCurrency(budgetSummary.totalRemaining)} remaining
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Overview */}
            <BudgetOverviewCard
              budgetProgress={budgetProgress}
              onViewDetails={onManageBudgets}
            />

            {/* Goals Overview */}
            <GoalsOverviewCard
              goalsProgress={goalsProgress}
              onViewDetails={onManageGoals}
            />
          </div>

          {/* Quick Progress Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Budget Categories */}
            <BudgetProgressCards
              budgetProgress={budgetProgress.slice(0, 3)}
              onManageBudgets={onManageBudgets}
              showManageButton={false}
              maxCards={3}
            />

            {/* Top Goals */}
            <GoalsProgressCards
              goalsProgress={goalsProgress.slice(0, 3)}
              onManageGoals={onManageGoals}
              onAddContribution={onAddGoalContribution}
              showManageButton={false}
              maxCards={3}
            />
          </div>

          {/* Alerts Summary */}
          <AlertsSystem
            budgetProgress={budgetProgress}
            goalsProgress={goalsProgress}
            budgetAlerts={budgetAlerts}
            onUpdateAlertSettings={onUpdateAlertSettings}
            onDismissAlert={onDismissAlert}
          />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Budget Management
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track your spending against your budget limits
              </p>
            </div>
            <Button onClick={onManageBudgets}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Manage Budgets
            </Button>
          </div>

          <BudgetProgressCards
            budgetProgress={budgetProgress}
            onManageBudgets={onManageBudgets}
            showManageButton={false}
          />
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Savings Goals
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track your progress towards your financial goals
              </p>
            </div>
            <Button onClick={onManageGoals}>
              <Target className="h-4 w-4 mr-2" />
              Manage Goals
            </Button>
          </div>

          <GoalsProgressCards
            goalsProgress={goalsProgress}
            onManageGoals={onManageGoals}
            onAddContribution={onAddGoalContribution}
            showManageButton={false}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <AlertsSystem
            budgetProgress={budgetProgress}
            goalsProgress={goalsProgress}
            budgetAlerts={budgetAlerts}
            onUpdateAlertSettings={onUpdateAlertSettings}
            onDismissAlert={onDismissAlert}
          />
        </TabsContent>
      </Tabs>

      {/* Celebration Modal */}
      <CelebrationModal
        goal={celebrationGoal}
        milestone={celebrationMilestone}
        isOpen={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setCelebrationGoal(null);
          setCelebrationMilestone(undefined);
        }}
        onShare={handleShareAchievement}
      />
    </div>
  );
};
