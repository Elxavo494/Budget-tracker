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
  createdAt: string;
}

export interface OneTimeIncome {
  id: string;
  name: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface OneTimeExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  date: string;
  createdAt: string;
}

export interface FinanceData {
  categories: Category[];
  recurringIncomes: RecurringIncome[];
  recurringExpenses: RecurringExpense[];
  oneTimeIncomes: OneTimeIncome[];
  oneTimeExpenses: OneTimeExpense[];
}