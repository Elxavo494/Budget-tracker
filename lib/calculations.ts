import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { RecurringIncome, RecurringExpense, OneTimeIncome, OneTimeExpense, Category } from '@/types';

export const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
};

export const isRecurringItemActiveInMonth = (
  startDate: string,
  endDate: string | undefined,
  monthStart: Date,
  monthEnd: Date
): boolean => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date('2099-12-31');
  
  return start <= monthEnd && end >= monthStart;
};

export const calculateMonthlyRecurringIncome = (
  recurringIncomes: RecurringIncome[],
  monthStart: Date,
  monthEnd: Date
): number => {
  return recurringIncomes
    .filter(income => isRecurringItemActiveInMonth(income.startDate, income.endDate, monthStart, monthEnd))
    .reduce((total, income) => {
      switch (income.recurrence) {
        case 'monthly':
          return total + income.amount;
        case 'weekly':
          return total + income.amount * 4.33; // Average weeks per month
        case 'yearly':
          return total + income.amount / 12;
        default:
          return total;
      }
    }, 0);
};

export const calculateMonthlyRecurringExpenses = (
  recurringExpenses: RecurringExpense[],
  monthStart: Date,
  monthEnd: Date
): number => {
  return recurringExpenses
    .filter(expense => isRecurringItemActiveInMonth(expense.startDate, expense.endDate, monthStart, monthEnd))
    .reduce((total, expense) => {
      switch (expense.recurrence) {
        case 'monthly':
          return total + expense.amount;
        case 'weekly':
          return total + expense.amount * 4.33;
        case 'yearly':
          return total + expense.amount / 12;
        default:
          return total;
      }
    }, 0);
};

export const calculateOneTimeIncomeForMonth = (
  oneTimeIncomes: OneTimeIncome[],
  monthStart: Date,
  monthEnd: Date
): number => {
  return oneTimeIncomes
    .filter(income => {
      const incomeDate = new Date(income.date);
      return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
    })
    .reduce((total, income) => total + income.amount, 0);
};

export const calculateOneTimeExpensesForMonth = (
  oneTimeExpenses: OneTimeExpense[],
  monthStart: Date,
  monthEnd: Date
): number => {
  return oneTimeExpenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    })
    .reduce((total, expense) => total + expense.amount, 0);
};

export const calculateExpensesByCategory = (
  recurringExpenses: RecurringExpense[],
  oneTimeExpenses: OneTimeExpense[],
  categories: Category[],
  monthStart: Date,
  monthEnd: Date
) => {
  const categoryTotals: { [categoryId: string]: number } = {};
  
  // Initialize all categories with 0
  categories.forEach(category => {
    categoryTotals[category.id] = 0;
  });

  // Add recurring expenses
  recurringExpenses
    .filter(expense => isRecurringItemActiveInMonth(expense.startDate, expense.endDate, monthStart, monthEnd))
    .forEach(expense => {
      const monthlyAmount = expense.recurrence === 'monthly' ? expense.amount :
        expense.recurrence === 'weekly' ? expense.amount * 4.33 :
        expense.amount / 12;
      categoryTotals[expense.categoryId] += monthlyAmount;
    });

  // Add one-time expenses
  oneTimeExpenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    })
    .forEach(expense => {
      categoryTotals[expense.categoryId] += expense.amount;
    });

  return categories.map(category => ({
    name: category.name,
    value: Math.round(categoryTotals[category.id] * 100) / 100,
    color: category.color,
  })).filter(item => item.value > 0);
};

export const calculateWeeksRemainingInMonth = (selectedDate: Date): number => {
  const today = new Date();
  const monthEnd = endOfMonth(selectedDate);
  
  // If we're looking at a past month, return 0
  if (selectedDate < startOfMonth(today)) {
    return 0;
  }
  
  // If we're looking at a future month, return the total weeks in that month
  if (selectedDate > endOfMonth(today)) {
    const monthStart = startOfMonth(selectedDate);
    const totalDays = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.ceil(totalDays / 7));
  }
  
  // For current month, calculate remaining weeks from today
  const remainingDays = Math.ceil((monthEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.ceil(remainingDays / 7));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};