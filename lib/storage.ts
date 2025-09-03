import { FinanceData, Category } from '@/types';

const STORAGE_KEY = 'finance-tracker-data';

const defaultCategories: Category[] = [
  { id: '1', name: 'Food', color: '#ef4444' },
  { id: '2', name: 'Housing', color: '#3b82f6' },
  { id: '3', name: 'Insurance', color: '#8b5cf6' },
  { id: '4', name: 'Transport', color: '#10b981' },
  { id: '5', name: 'Sports', color: '#f59e0b' },
  { id: '6', name: 'Fun', color: '#ec4899' },
  { id: '7', name: 'Other', color: '#6b7280' },
];

export const defaultData: FinanceData = {
  categories: defaultCategories,
  recurringIncomes: [],
  recurringExpenses: [],
  oneTimeIncomes: [],
  oneTimeExpenses: [],
};

export const loadFinanceData = (): FinanceData => {
  if (typeof window === 'undefined') return defaultData;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    saveFinanceData(defaultData);
    return defaultData;
  }
  
  try {
    const parsed = JSON.parse(stored);
    return {
      ...defaultData,
      ...parsed,
      categories: parsed.categories?.length ? parsed.categories : defaultCategories,
    };
  } catch {
    return defaultData;
  }
};

export const saveFinanceData = (data: FinanceData): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};