import { subMonths, startOfMonth, endOfMonth, format, subYears, isSameMonth, isWithinInterval } from 'date-fns';
import { 
  RecurringExpense, 
  OneTimeExpense, 
  Category,
  CategoryBudget,
  CategoryBudgetProgress
} from '@/types';
import { calculateExpensesByCategory } from './calculations';
import { calculateCategoryBudgetProgress } from './budget-calculations';

export interface CategoryHistoricalData {
  name: string;
  value: number;
  color: string;
  categoryId: string;
  change: {
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  ranking: {
    current: number;
    previous: number;
    change: number;
  };
  averages: {
    threeMonth: number;
    sixMonth: number;
    comparison: 'above' | 'below' | 'normal';
  };
  seasonal: {
    isTypical: boolean;
    seasonalAverage: number;
    deviation: number;
  };
  budget?: {
    limit: number;
    spent: number;
    remaining: number;
    isOverBudget: boolean;
    progressPercentage: number;
  };
  transactions: {
    count: number;
    averageAmount: number;
    largestTransaction: number;
  };
}

export interface EnhancedExpenseAnalytics {
  categories: CategoryHistoricalData[];
  summary: {
    totalCurrent: number;
    totalPrevious: number;
    overallChange: {
      amount: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
    budgetSummary?: {
      totalBudget: number;
      totalSpent: number;
      categoriesOverBudget: number;
    };
  };
}

/**
 * Calculate enhanced expense analytics with historical comparisons
 */
export const calculateEnhancedExpenseAnalytics = (
  recurringExpenses: RecurringExpense[],
  oneTimeExpenses: OneTimeExpense[],
  categories: Category[],
  categoryBudgets: CategoryBudget[],
  currentMonth: Date
): EnhancedExpenseAnalytics => {
  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);
  
  // Calculate previous month
  const previousMonth = subMonths(currentMonth, 1);
  const previousMonthStart = startOfMonth(previousMonth);
  const previousMonthEnd = endOfMonth(previousMonth);
  
  // Calculate historical averages (3 and 6 months)
  const threeMonthsAgo = subMonths(currentMonth, 3);
  const sixMonthsAgo = subMonths(currentMonth, 6);
  
  // Calculate seasonal comparison (same month last year)
  const lastYear = subYears(currentMonth, 1);
  const lastYearStart = startOfMonth(lastYear);
  const lastYearEnd = endOfMonth(lastYear);
  
  // Get current and previous month expenses
  const currentExpenses = calculateExpensesByCategory(
    recurringExpenses,
    oneTimeExpenses,
    categories,
    currentMonthStart,
    currentMonthEnd
  );
  
  const previousExpenses = calculateExpensesByCategory(
    recurringExpenses,
    oneTimeExpenses,
    categories,
    previousMonthStart,
    previousMonthEnd
  );
  
  const lastYearExpenses = calculateExpensesByCategory(
    recurringExpenses,
    oneTimeExpenses,
    categories,
    lastYearStart,
    lastYearEnd
  );
  
  // Calculate historical averages for each category
  const getHistoricalAverages = (categoryName: string, months: number) => {
    let total = 0;
    let count = 0;
    
    for (let i = 1; i <= months; i++) {
      const monthDate = subMonths(currentMonth, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthExpenses = calculateExpensesByCategory(
        recurringExpenses,
        oneTimeExpenses,
        categories,
        monthStart,
        monthEnd
      );
      
      const categoryExpense = monthExpenses.find(e => e.name === categoryName);
      if (categoryExpense) {
        total += categoryExpense.value;
        count++;
      }
    }
    
    return count > 0 ? total / count : 0;
  };
  
  // Calculate transaction details for each category
  const getTransactionDetails = (categoryId: string) => {
    const categoryTransactions = [
      ...recurringExpenses.filter(e => e.categoryId === categoryId),
      ...oneTimeExpenses.filter(e => 
        e.categoryId === categoryId &&
        new Date(e.date) >= currentMonthStart &&
        new Date(e.date) <= currentMonthEnd
      )
    ];
    
    const amounts = categoryTransactions.map(t => t.amount);
    const count = amounts.length;
    const averageAmount = count > 0 ? amounts.reduce((sum, amt) => sum + amt, 0) / count : 0;
    const largestTransaction = count > 0 ? Math.max(...amounts) : 0;
    
    return { count, averageAmount, largestTransaction };
  };
  
  // Create rankings
  const currentRanking = currentExpenses
    .sort((a, b) => b.value - a.value)
    .map((category, index) => ({ name: category.name, rank: index + 1 }));
  
  const previousRanking = previousExpenses
    .sort((a, b) => b.value - a.value)
    .map((category, index) => ({ name: category.name, rank: index + 1 }));
  
  // Get budget progress
  const budgetProgress = calculateCategoryBudgetProgress(
    categoryBudgets,
    categories,
    recurringExpenses,
    oneTimeExpenses,
    currentMonthStart,
    currentMonthEnd
  );
  
  // Build enhanced category data
  const enhancedCategories: CategoryHistoricalData[] = currentExpenses.map(currentCategory => {
    const category = categories.find(c => c.name === currentCategory.name);
    const previousCategory = previousExpenses.find(p => p.name === currentCategory.name);
    const lastYearCategory = lastYearExpenses.find(p => p.name === currentCategory.name);
    const budget = budgetProgress.find(b => b.categoryName === currentCategory.name);
    
    // Calculate changes
    const previousValue = previousCategory?.value || 0;
    const changeAmount = currentCategory.value - previousValue;
    const changePercentage = previousValue > 0 ? (changeAmount / previousValue) * 100 : 0;
    const trend = Math.abs(changePercentage) < 5 ? 'stable' : 
                  changePercentage > 0 ? 'up' : 'down';
    
    // Calculate rankings
    const currentRank = currentRanking.find(r => r.name === currentCategory.name)?.rank || 0;
    const previousRank = previousRanking.find(r => r.name === currentCategory.name)?.rank || 0;
    const rankingChange = previousRank - currentRank; // Positive means moved up
    
    // Calculate averages
    const threeMonthAverage = getHistoricalAverages(currentCategory.name, 3);
    const sixMonthAverage = getHistoricalAverages(currentCategory.name, 6);
    const avgComparison = currentCategory.value > threeMonthAverage * 1.1 ? 'above' :
                         currentCategory.value < threeMonthAverage * 0.9 ? 'below' : 'normal';
    
    // Calculate seasonal comparison
    const lastYearValue = lastYearCategory?.value || 0;
    const seasonalDeviation = lastYearValue > 0 ? 
      Math.abs((currentCategory.value - lastYearValue) / lastYearValue) * 100 : 0;
    const isTypical = seasonalDeviation < 25; // Within 25% is considered typical
    
    // Get transaction details
    const transactionDetails = getTransactionDetails(category?.id || '');
    
    return {
      name: currentCategory.name,
      value: currentCategory.value,
      color: currentCategory.color,
      categoryId: category?.id || '',
      change: {
        amount: changeAmount,
        percentage: changePercentage,
        trend
      },
      ranking: {
        current: currentRank,
        previous: previousRank,
        change: rankingChange
      },
      averages: {
        threeMonth: threeMonthAverage,
        sixMonth: sixMonthAverage,
        comparison: avgComparison
      },
      seasonal: {
        isTypical,
        seasonalAverage: lastYearValue,
        deviation: seasonalDeviation
      },
      budget: budget ? {
        limit: budget.budgetLimit,
        spent: budget.currentSpent,
        remaining: budget.remainingBudget,
        isOverBudget: budget.isOverBudget,
        progressPercentage: budget.progressPercentage
      } : undefined,
      transactions: transactionDetails
    };
  });
  
  // Calculate summary
  const totalCurrent = currentExpenses.reduce((sum, cat) => sum + cat.value, 0);
  const totalPrevious = previousExpenses.reduce((sum, cat) => sum + cat.value, 0);
  const overallChangeAmount = totalCurrent - totalPrevious;
  const overallChangePercentage = totalPrevious > 0 ? (overallChangeAmount / totalPrevious) * 100 : 0;
  const overallTrend = Math.abs(overallChangePercentage) < 5 ? 'stable' : 
                       overallChangePercentage > 0 ? 'up' : 'down';
  
  const budgetSummary = budgetProgress.length > 0 ? {
    totalBudget: budgetProgress.reduce((sum, b) => sum + b.budgetLimit, 0),
    totalSpent: budgetProgress.reduce((sum, b) => sum + b.currentSpent, 0),
    categoriesOverBudget: budgetProgress.filter(b => b.isOverBudget).length
  } : undefined;
  
  return {
    categories: enhancedCategories.sort((a, b) => b.value - a.value),
    summary: {
      totalCurrent,
      totalPrevious,
      overallChange: {
        amount: overallChangeAmount,
        percentage: overallChangePercentage,
        trend: overallTrend
      },
      budgetSummary
    }
  };
};

/**
 * Filter transactions by category for drill-down
 */
export const getTransactionsByCategory = (
  recurringExpenses: RecurringExpense[],
  oneTimeExpenses: OneTimeExpense[],
  categoryId: string,
  monthStart: Date,
  monthEnd: Date
) => {
  const recurring = recurringExpenses.filter(e => e.categoryId === categoryId);
  const oneTime = oneTimeExpenses.filter(e => 
    e.categoryId === categoryId &&
    new Date(e.date) >= monthStart &&
    new Date(e.date) <= monthEnd
  );
  
  return {
    recurring,
    oneTime,
    total: recurring.length + oneTime.length
  };
};
