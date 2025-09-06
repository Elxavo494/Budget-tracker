import { startOfMonth, endOfMonth, differenceInMonths, addMonths, isAfter, isBefore } from 'date-fns';
import { 
  CategoryBudget, 
  SavingsGoal, 
  CategoryBudgetProgress, 
  GoalProgress,
  RecurringExpense,
  OneTimeExpense,
  Category,
  GoalMilestone,
  GoalContribution
} from '@/types';
import { 
  calculateMonthlyRecurringExpenses, 
  calculateOneTimeExpensesForMonth,
  calculateExpensesByCategory 
} from './calculations';

/**
 * Calculate budget progress for all categories in a given month
 */
export const calculateCategoryBudgetProgress = (
  categoryBudgets: CategoryBudget[],
  categories: Category[],
  recurringExpenses: RecurringExpense[],
  oneTimeExpenses: OneTimeExpense[],
  monthStart: Date,
  monthEnd: Date
): CategoryBudgetProgress[] => {
  const expensesByCategory = calculateExpensesByCategory(
    recurringExpenses,
    oneTimeExpenses,
    categories,
    monthStart,
    monthEnd
  );

  return categoryBudgets
    .filter(budget => budget.isActive)
    .map(budget => {
      const category = categories.find(c => c.id === budget.categoryId);
      const categoryExpense = expensesByCategory.find(e => e.name === category?.name);
      const currentSpent = categoryExpense?.value || 0;
      const remainingBudget = budget.monthlyLimit - currentSpent;
      const progressPercentage = budget.monthlyLimit > 0 ? (currentSpent / budget.monthlyLimit) * 100 : 0;
      const isOverBudget = currentSpent > budget.monthlyLimit;
      const shouldAlert = progressPercentage >= (budget.alertThreshold * 100);

      return {
        categoryId: budget.categoryId,
        categoryName: category?.name || 'Unknown Category',
        categoryColor: category?.color || '#6b7280',
        budgetLimit: budget.monthlyLimit,
        currentSpent,
        remainingBudget,
        progressPercentage: Math.min(progressPercentage, 100),
        isOverBudget,
        alertThreshold: budget.alertThreshold,
        shouldAlert
      };
    })
    .sort((a, b) => b.progressPercentage - a.progressPercentage); // Sort by progress, highest first
};

/**
 * Calculate progress for a single savings goal
 */
export const calculateGoalProgress = (
  goal: SavingsGoal,
  milestones: GoalMilestone[],
  contributions: GoalContribution[]
): GoalProgress => {
  const progressPercentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  
  // Calculate monthly target contribution if target date is set
  let monthlyTargetContribution: number | undefined;
  let isOnTrack = true;
  
  if (goal.targetDate && !goal.isCompleted) {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining = Math.max(1, differenceInMonths(targetDate, today));
    monthlyTargetContribution = remainingAmount / monthsRemaining;
    
    // Check if on track based on expected progress by now
    const totalMonths = differenceInMonths(targetDate, new Date(goal.createdAt));
    const monthsElapsed = Math.max(0, differenceInMonths(today, new Date(goal.createdAt)));
    const expectedProgress = totalMonths > 0 ? (monthsElapsed / totalMonths) * 100 : 0;
    isOnTrack = progressPercentage >= expectedProgress * 0.9; // 10% tolerance
  }

  // Get recent contributions (last 6 months)
  const sixMonthsAgo = addMonths(new Date(), -6);
  const recentContributions = contributions
    .filter(c => c.goalId === goal.id && isAfter(new Date(c.contributionDate), sixMonthsAgo))
    .sort((a, b) => new Date(b.contributionDate).getTime() - new Date(a.contributionDate).getTime());

  return {
    goal,
    progressPercentage: Math.min(progressPercentage, 100),
    remainingAmount,
    monthlyTargetContribution,
    isOnTrack,
    milestones: milestones.filter(m => m.goalId === goal.id),
    recentContributions
  };
};

/**
 * Calculate progress for all active savings goals
 */
export const calculateAllGoalsProgress = (
  goals: SavingsGoal[],
  milestones: GoalMilestone[],
  contributions: GoalContribution[]
): GoalProgress[] => {
  return goals
    .filter(goal => goal.isActive)
    .map(goal => calculateGoalProgress(goal, milestones, contributions))
    .sort((a, b) => {
      // Sort by priority first, then by progress
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.goal.priority] - priorityOrder[a.goal.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.progressPercentage - a.progressPercentage;
    });
};

/**
 * Calculate total budget vs actual spending for the month
 */
export const calculateMonthlyBudgetSummary = (
  categoryBudgets: CategoryBudgetProgress[]
) => {
  const totalBudget = categoryBudgets.reduce((sum, budget) => sum + budget.budgetLimit, 0);
  const totalSpent = categoryBudgets.reduce((sum, budget) => sum + budget.currentSpent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const categoriesOverBudget = categoryBudgets.filter(budget => budget.isOverBudget).length;
  const categoriesNearLimit = categoryBudgets.filter(budget => budget.shouldAlert && !budget.isOverBudget).length;

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    overallProgress: Math.min(overallProgress, 100),
    isOverBudget: totalSpent > totalBudget,
    categoriesOverBudget,
    categoriesNearLimit,
    totalCategories: categoryBudgets.length
  };
};

/**
 * Check if a goal milestone should be triggered
 */
export const checkGoalMilestones = (
  goal: SavingsGoal,
  existingMilestones: GoalMilestone[]
): number[] => {
  const progressPercentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) : 0;
  const milestoneThresholds = [0.25, 0.50, 0.75, 1.0]; // 25%, 50%, 75%, 100%
  
  const achievedMilestones = existingMilestones.map(m => m.milestonePercentage);
  const newMilestones: number[] = [];
  
  for (const threshold of milestoneThresholds) {
    if (progressPercentage >= threshold && !achievedMilestones.includes(threshold)) {
      newMilestones.push(threshold);
    }
  }
  
  return newMilestones;
};

/**
 * Generate budget alerts based on current spending
 */
export const generateBudgetAlerts = (
  categoryBudgets: CategoryBudgetProgress[]
): Array<{
  type: 'budget_threshold' | 'budget_exceeded';
  categoryName: string;
  categoryColor: string;
  message: string;
  severity: 'warning' | 'danger';
  progressPercentage: number;
}> => {
  const alerts: Array<{
    type: 'budget_threshold' | 'budget_exceeded';
    categoryName: string;
    categoryColor: string;
    message: string;
    severity: 'warning' | 'danger';
    progressPercentage: number;
  }> = [];

  categoryBudgets.forEach(budget => {
    if (budget.isOverBudget) {
      alerts.push({
        type: 'budget_exceeded',
        categoryName: budget.categoryName,
        categoryColor: budget.categoryColor,
        message: `You've exceeded your ${budget.categoryName} budget by €${Math.abs(budget.remainingBudget).toFixed(2)}`,
        severity: 'danger',
        progressPercentage: budget.progressPercentage
      });
    } else if (budget.shouldAlert) {
      const percentageUsed = Math.round(budget.progressPercentage);
      alerts.push({
        type: 'budget_threshold',
        categoryName: budget.categoryName,
        categoryColor: budget.categoryColor,
        message: `You've used ${percentageUsed}% of your ${budget.categoryName} budget`,
        severity: 'warning',
        progressPercentage: budget.progressPercentage
      });
    }
  });

  return alerts.sort((a, b) => b.progressPercentage - a.progressPercentage);
};

/**
 * Calculate savings rate based on goals vs income
 */
export const calculateSavingsRate = (
  totalIncome: number,
  totalExpenses: number,
  goalContributions: GoalContribution[],
  monthStart: Date,
  monthEnd: Date
): {
  savingsRate: number;
  actualSavings: number;
  goalContributionsThisMonth: number;
  recommendedSavingsRate: number;
} => {
  const actualSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (actualSavings / totalIncome) * 100 : 0;
  
  // Calculate goal contributions for this month
  const goalContributionsThisMonth = goalContributions
    .filter(contribution => {
      const contributionDate = new Date(contribution.contributionDate);
      return contributionDate >= monthStart && contributionDate <= monthEnd;
    })
    .reduce((sum, contribution) => sum + contribution.amount, 0);

  // Recommended savings rate is typically 20%
  const recommendedSavingsRate = 20;

  return {
    savingsRate,
    actualSavings,
    goalContributionsThisMonth,
    recommendedSavingsRate
  };
};
