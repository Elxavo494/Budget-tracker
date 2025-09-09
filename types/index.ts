export type RecurrenceType = 'monthly' | 'weekly' | 'yearly';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  recurrence: RecurrenceType;
  startDate: string;
  endDate?: string;
  iconUrl?: string;
  iconType?: 'custom' | 'preset';
  presetIconId?: string;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  recurrence: RecurrenceType;
  startDate: string;
  endDate?: string;
  categoryId: string;
  iconUrl?: string;
  iconType?: 'custom' | 'preset';
  presetIconId?: string;
  isMaaltijdcheques?: boolean;
  createdAt: string;
}

export interface OneTimeIncome {
  id: string;
  name: string;
  amount: number;
  date: string;
  iconUrl?: string;
  iconType?: 'custom' | 'preset';
  presetIconId?: string;
  createdAt: string;
}

export interface OneTimeExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  date: string;
  iconUrl?: string;
  iconType?: 'custom' | 'preset';
  presetIconId?: string;
  isMaaltijdcheques?: boolean;
  createdAt: string;
}

// Budget and Goals Types
export interface CategoryBudget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  alertThreshold: number; // 0.80 = 80%
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  priority: 'low' | 'medium' | 'high';
  color: string;
  iconUrl?: string;
  iconType?: 'custom' | 'preset';
  presetIconId?: string;
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetAlert {
  id: string;
  alertType: 'budget_threshold' | 'budget_exceeded' | 'goal_milestone' | 'goal_completed';
  isEnabled: boolean;
  thresholdPercentage?: number; // For budget alerts
  milestonePercentage?: number; // For goal milestones
  createdAt: string;
  updatedAt: string;
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  milestonePercentage: number; // 0.25 = 25%
  achievedAt: string;
  amountAtAchievement: number;
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  description?: string;
  contributionDate: string;
  createdAt: string;
}

// Budget Progress Calculation Types
export interface CategoryBudgetProgress {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetLimit: number;
  currentSpent: number;
  remainingBudget: number;
  progressPercentage: number;
  isOverBudget: boolean;
  alertThreshold: number;
  shouldAlert: boolean;
}

export interface GoalProgress {
  goal: SavingsGoal;
  progressPercentage: number;
  remainingAmount: number;
  monthlyTargetContribution?: number; // Based on target date
  isOnTrack: boolean;
  milestones: GoalMilestone[];
  recentContributions: GoalContribution[];
}

export interface FinanceData {
  categories: Category[];
  recurringIncomes: RecurringIncome[];
  recurringExpenses: RecurringExpense[];
  oneTimeIncomes: OneTimeIncome[];
  oneTimeExpenses: OneTimeExpense[];
  categoryBudgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  budgetAlerts: BudgetAlert[];
  goalMilestones: GoalMilestone[];
  goalContributions: GoalContribution[];
}