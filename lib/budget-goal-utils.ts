import { startOfMonth, endOfMonth } from 'date-fns';
import { 
  RecurringExpense, 
  OneTimeExpense, 
  GoalContribution,
  GoalMilestone,
  SavingsGoal 
} from '@/types';
import { getTransactionsByCategory } from './enhanced-expense-analytics';

/**
 * Get all transactions for a specific budget category in a given month
 */
export const getBudgetTransactions = (
  recurringExpenses: RecurringExpense[],
  oneTimeExpenses: OneTimeExpense[],
  categoryId: string,
  monthStart: Date,
  monthEnd: Date
) => {
  return getTransactionsByCategory(
    recurringExpenses,
    oneTimeExpenses,
    categoryId,
    monthStart,
    monthEnd
  );
};

/**
 * Get all contributions for a specific goal
 */
export const getGoalContributions = (
  goalContributions: GoalContribution[],
  goalId: string
): GoalContribution[] => {
  return goalContributions
    .filter(contribution => contribution.goalId === goalId)
    .sort((a, b) => new Date(b.contributionDate).getTime() - new Date(a.contributionDate).getTime());
};

/**
 * Get all milestones for a specific goal
 */
export const getGoalMilestones = (
  goalMilestones: GoalMilestone[],
  goalId: string
): GoalMilestone[] => {
  return goalMilestones
    .filter(milestone => milestone.goalId === goalId)
    .sort((a, b) => b.milestonePercentage - a.milestonePercentage);
};

/**
 * Calculate goal progress percentage
 */
export const calculateGoalProgressPercentage = (goal: SavingsGoal): number => {
  if (goal.targetAmount <= 0) return 0;
  return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
};

/**
 * Calculate remaining amount to reach goal
 */
export const calculateGoalRemainingAmount = (goal: SavingsGoal): number => {
  return Math.max(0, goal.targetAmount - goal.currentAmount);
};
