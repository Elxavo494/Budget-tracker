import { startOfMonth, endOfMonth, isWithinInterval, format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay } from 'date-fns';
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

export const calculateWeeklyExpenses = (
  recurringExpenses: RecurringExpense[],
  oneTimeExpenses: OneTimeExpense[],
  monthStart: Date,
  monthEnd: Date
) => {
  const weeks = [];
  let current = startOfWeek(monthStart);
  
  while (current <= monthEnd) {
    const weekEnd = endOfWeek(current);
    const weekStart = current;
    const actualWeekEnd = weekEnd > monthEnd ? monthEnd : weekEnd;
    
    // Calculate days in this week that fall within the month
    const daysInWeek = Math.ceil((actualWeekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate recurring expenses for this week
    const weeklyRecurring = recurringExpenses
      .filter(expense => isRecurringItemActiveInMonth(expense.startDate, expense.endDate, monthStart, monthEnd))
      .reduce((total, expense) => {
        let weeklyAmount = 0;
        if (expense.recurrence === 'weekly') {
          weeklyAmount = expense.amount;
        } else if (expense.recurrence === 'monthly') {
          // Distribute monthly amount proportionally across the weeks in the month
          weeklyAmount = (expense.amount / daysInMonth) * daysInWeek;
        } else if (expense.recurrence === 'yearly') {
          // Distribute yearly amount proportionally
          weeklyAmount = (expense.amount / 365) * daysInWeek;
        }
        return total + weeklyAmount;
      }, 0);
    
    // Calculate one-time expenses for this week
    const weeklyOneTime = oneTimeExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return isWithinInterval(expenseDate, { start: weekStart, end: actualWeekEnd });
      })
      .reduce((total, expense) => total + expense.amount, 0);
    
    const totalWeeklyExpenses = weeklyRecurring + weeklyOneTime;
    
    weeks.push({
      week: format(weekStart, 'MMM dd'),
      weekEnd: format(actualWeekEnd, 'MMM dd'),
      fullDate: weekStart,
      value: Math.round(totalWeeklyExpenses * 100) / 100,
      days: eachDayOfInterval({ start: weekStart, end: actualWeekEnd }).map(day => ({
        day: format(day, 'EEE'),
        date: day,
        value: calculateDailyExpenses(recurringExpenses, oneTimeExpenses, day),
        isToday: isSameDay(day, new Date())
      }))
    });
    
    current = addDays(actualWeekEnd, 1);
  }
  
  return weeks;
};

export const calculateDailyExpenses = (
  recurringExpenses: RecurringExpense[],
  oneTimeExpenses: OneTimeExpense[],
  date: Date
): number => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  // Calculate recurring expenses for this day
  const dailyRecurring = recurringExpenses
    .filter(expense => isRecurringItemActiveInMonth(expense.startDate, expense.endDate, dayStart, dayEnd))
    .reduce((total, expense) => {
      const dailyAmount = expense.recurrence === 'weekly' ? expense.amount / 7 :
        expense.recurrence === 'monthly' ? expense.amount / 30 :
        expense.amount / 365; // yearly
      return total + dailyAmount;
    }, 0);
  
  // Calculate one-time expenses for this day
  const dailyOneTime = oneTimeExpenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return isSameDay(expenseDate, date);
    })
    .reduce((total, expense) => total + expense.amount, 0);
  
  return Math.round((dailyRecurring + dailyOneTime) * 100) / 100;
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  // Map currency codes to locale for better formatting
  const localeMap: Record<string, string> = {
    'USD': 'en-US',
    'EUR': 'en-DE',
    'GBP': 'en-GB',
    'JPY': 'ja-JP',
    'CAD': 'en-CA',
    'AUD': 'en-AU',
    'CHF': 'de-CH',
    'CNY': 'zh-CN',
  };

  const locale = localeMap[currency] || 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};