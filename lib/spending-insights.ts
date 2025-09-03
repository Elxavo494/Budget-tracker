import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { 
  RecurringExpense, 
  OneTimeExpense, 
  Category,
  RecurringIncome,
  OneTimeIncome 
} from '@/types';
import { 
  calculateMonthlyRecurringExpenses, 
  calculateOneTimeExpensesForMonth,
  calculateMonthlyRecurringIncome,
  calculateOneTimeIncomeForMonth,
  calculateExpensesByCategory 
} from './calculations';

export interface SpendingInsight {
  id: string;
  type: 'increase' | 'decrease' | 'warning' | 'success' | 'info';
  title: string;
  description: string;
  value?: string;
  category?: string;
}

export const generateSpendingInsights = (
  recurringExpenses: RecurringExpense[],
  oneTimeExpenses: OneTimeExpense[],
  recurringIncomes: RecurringIncome[],
  oneTimeIncomes: OneTimeIncome[],
  categories: Category[],
  currentMonth: Date
): SpendingInsight[] => {
  const insights: SpendingInsight[] = [];
  
  const currentMonthStart = startOfMonth(currentMonth);
  const currentMonthEnd = endOfMonth(currentMonth);
  const previousMonth = subMonths(currentMonth, 1);
  const previousMonthStart = startOfMonth(previousMonth);
  const previousMonthEnd = endOfMonth(previousMonth);

  // Calculate current and previous month totals
  const currentTotalExpenses = 
    calculateMonthlyRecurringExpenses(recurringExpenses, currentMonthStart, currentMonthEnd) +
    calculateOneTimeExpensesForMonth(oneTimeExpenses, currentMonthStart, currentMonthEnd);
    
  const previousTotalExpenses = 
    calculateMonthlyRecurringExpenses(recurringExpenses, previousMonthStart, previousMonthEnd) +
    calculateOneTimeExpensesForMonth(oneTimeExpenses, previousMonthStart, previousMonthEnd);

  const currentTotalIncome = 
    calculateMonthlyRecurringIncome(recurringIncomes, currentMonthStart, currentMonthEnd) +
    calculateOneTimeIncomeForMonth(oneTimeIncomes, currentMonthStart, currentMonthEnd);
    
  const previousTotalIncome = 
    calculateMonthlyRecurringIncome(recurringIncomes, previousMonthStart, previousMonthEnd) +
    calculateOneTimeIncomeForMonth(oneTimeIncomes, previousMonthStart, previousMonthEnd);

  // Overall spending comparison
  if (previousTotalExpenses > 0) {
    const expenseChange = ((currentTotalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100;
    
    if (Math.abs(expenseChange) > 5) {
      insights.push({
        id: 'total-expense-change',
        type: expenseChange > 0 ? 'increase' : 'decrease',
        title: `${expenseChange > 0 ? 'Increased' : 'Decreased'} Spending`,
        description: `You spent ${Math.abs(expenseChange).toFixed(1)}% ${expenseChange > 0 ? 'more' : 'less'} this month compared to ${format(previousMonth, 'MMMM')}`,
        value: `${expenseChange > 0 ? '+' : ''}${expenseChange.toFixed(1)}%`
      });
    }
  }

  // Income comparison
  if (previousTotalIncome > 0) {
    const incomeChange = ((currentTotalIncome - previousTotalIncome) / previousTotalIncome) * 100;
    
    if (Math.abs(incomeChange) > 5) {
      insights.push({
        id: 'total-income-change',
        type: incomeChange > 0 ? 'success' : 'warning',
        title: `${incomeChange > 0 ? 'Increased' : 'Decreased'} Income`,
        description: `Your income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(1)}% this month`,
        value: `${incomeChange > 0 ? '+' : ''}${incomeChange.toFixed(1)}%`
      });
    }
  }

  // Category-specific insights
  const currentCategoryExpenses = calculateExpensesByCategory(
    recurringExpenses, oneTimeExpenses, categories, currentMonthStart, currentMonthEnd
  );
  const previousCategoryExpenses = calculateExpensesByCategory(
    recurringExpenses, oneTimeExpenses, categories, previousMonthStart, previousMonthEnd
  );

  currentCategoryExpenses.forEach(currentCat => {
    const previousCat = previousCategoryExpenses.find(p => p.name === currentCat.name);
    
    if (previousCat && previousCat.value > 0) {
      const categoryChange = ((currentCat.value - previousCat.value) / previousCat.value) * 100;
      
      if (Math.abs(categoryChange) > 15 && currentCat.value > 50) {
        insights.push({
          id: `category-${currentCat.name.toLowerCase()}`,
          type: categoryChange > 0 ? 'increase' : 'decrease',
          title: `${currentCat.name} Spending ${categoryChange > 0 ? 'Up' : 'Down'}`,
          description: `${Math.abs(categoryChange).toFixed(1)}% ${categoryChange > 0 ? 'increase' : 'decrease'} in ${currentCat.name.toLowerCase()} expenses`,
          value: `€${currentCat.value.toFixed(2)}`,
          category: currentCat.name
        });
      }
    }
  });

  // Savings rate insight
  const currentSavings = currentTotalIncome - currentTotalExpenses;
  const currentSavingsRate = currentTotalIncome > 0 ? (currentSavings / currentTotalIncome) * 100 : 0;
  
  if (currentTotalIncome > 0) {
    if (currentSavingsRate > 20) {
      insights.push({
        id: 'savings-rate-good',
        type: 'success',
        title: 'Great Savings Rate!',
        description: `You're saving ${currentSavingsRate.toFixed(1)}% of your income this month`,
        value: `${currentSavingsRate.toFixed(1)}%`
      });
    } else if (currentSavingsRate < 0) {
      insights.push({
        id: 'savings-rate-negative',
        type: 'warning',
        title: 'Spending More Than Earning',
        description: `Your expenses exceed your income by €${Math.abs(currentSavings).toFixed(2)} this month`,
        value: `€${Math.abs(currentSavings).toFixed(2)}`
      });
    } else if (currentSavingsRate < 10) {
      insights.push({
        id: 'savings-rate-low',
        type: 'info',
        title: 'Low Savings Rate',
        description: `You're only saving ${currentSavingsRate.toFixed(1)}% of your income. Consider reducing expenses`,
        value: `${currentSavingsRate.toFixed(1)}%`
      });
    }
  }

  // Top spending category
  if (currentCategoryExpenses.length > 0) {
    const topCategory = currentCategoryExpenses.reduce((max, cat) => 
      cat.value > max.value ? cat : max
    );
    
    const categoryPercentage = currentTotalExpenses > 0 ? 
      (topCategory.value / currentTotalExpenses) * 100 : 0;
    
    if (categoryPercentage > 40) {
      insights.push({
        id: 'top-category',
        type: 'info',
        title: `${topCategory.name} Dominates Spending`,
        description: `${topCategory.name} accounts for ${categoryPercentage.toFixed(1)}% of your total expenses`,
        value: `€${topCategory.value.toFixed(2)}`,
        category: topCategory.name
      });
    }
  }

  return insights.slice(0, 5); // Return top 5 insights
};