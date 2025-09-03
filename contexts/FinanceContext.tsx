'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  FinanceData, 
  Category, 
  RecurringIncome, 
  RecurringExpense, 
  OneTimeIncome, 
  OneTimeExpense 
} from '@/types';
import { loadFinanceData, saveFinanceData, defaultData } from '@/lib/storage';

type FinanceAction =
  | { type: 'LOAD_DATA'; payload: FinanceData }
  | { type: 'ADD_CATEGORY'; payload: Omit<Category, 'id'> }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_RECURRING_INCOME'; payload: Omit<RecurringIncome, 'id' | 'createdAt'> }
  | { type: 'UPDATE_RECURRING_INCOME'; payload: RecurringIncome }
  | { type: 'DELETE_RECURRING_INCOME'; payload: string }
  | { type: 'ADD_RECURRING_EXPENSE'; payload: Omit<RecurringExpense, 'id' | 'createdAt'> }
  | { type: 'UPDATE_RECURRING_EXPENSE'; payload: RecurringExpense }
  | { type: 'DELETE_RECURRING_EXPENSE'; payload: string }
  | { type: 'ADD_ONE_TIME_INCOME'; payload: Omit<OneTimeIncome, 'id' | 'createdAt'> }
  | { type: 'UPDATE_ONE_TIME_INCOME'; payload: OneTimeIncome }
  | { type: 'DELETE_ONE_TIME_INCOME'; payload: string }
  | { type: 'ADD_ONE_TIME_EXPENSE'; payload: Omit<OneTimeExpense, 'id' | 'createdAt'> }
  | { type: 'UPDATE_ONE_TIME_EXPENSE'; payload: OneTimeExpense }
  | { type: 'DELETE_ONE_TIME_EXPENSE'; payload: string };

const financeReducer = (state: FinanceData, action: FinanceAction): FinanceData => {
  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;
      
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, { ...action.payload, id: uuidv4() }],
      };
      
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat => 
          cat.id === action.payload.id ? action.payload : cat
        ),
      };
      
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload),
      };
      
    case 'ADD_RECURRING_INCOME':
      return {
        ...state,
        recurringIncomes: [...state.recurringIncomes, {
          ...action.payload,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }],
      };
      
    case 'UPDATE_RECURRING_INCOME':
      return {
        ...state,
        recurringIncomes: state.recurringIncomes.map(income => 
          income.id === action.payload.id ? action.payload : income
        ),
      };
      
    case 'DELETE_RECURRING_INCOME':
      return {
        ...state,
        recurringIncomes: state.recurringIncomes.filter(income => income.id !== action.payload),
      };
      
    case 'ADD_RECURRING_EXPENSE':
      return {
        ...state,
        recurringExpenses: [...state.recurringExpenses, {
          ...action.payload,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }],
      };
      
    case 'UPDATE_RECURRING_EXPENSE':
      return {
        ...state,
        recurringExpenses: state.recurringExpenses.map(expense => 
          expense.id === action.payload.id ? action.payload : expense
        ),
      };
      
    case 'DELETE_RECURRING_EXPENSE':
      return {
        ...state,
        recurringExpenses: state.recurringExpenses.filter(expense => expense.id !== action.payload),
      };
      
    case 'ADD_ONE_TIME_INCOME':
      return {
        ...state,
        oneTimeIncomes: [...state.oneTimeIncomes, {
          ...action.payload,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }],
      };
      
    case 'UPDATE_ONE_TIME_INCOME':
      return {
        ...state,
        oneTimeIncomes: state.oneTimeIncomes.map(income => 
          income.id === action.payload.id ? action.payload : income
        ),
      };
      
    case 'DELETE_ONE_TIME_INCOME':
      return {
        ...state,
        oneTimeIncomes: state.oneTimeIncomes.filter(income => income.id !== action.payload),
      };
      
    case 'ADD_ONE_TIME_EXPENSE':
      return {
        ...state,
        oneTimeExpenses: [...state.oneTimeExpenses, {
          ...action.payload,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        }],
      };
      
    case 'UPDATE_ONE_TIME_EXPENSE':
      return {
        ...state,
        oneTimeExpenses: state.oneTimeExpenses.map(expense => 
          expense.id === action.payload.id ? action.payload : expense
        ),
      };
      
    case 'DELETE_ONE_TIME_EXPENSE':
      return {
        ...state,
        oneTimeExpenses: state.oneTimeExpenses.filter(expense => expense.id !== action.payload),
      };
      
    default:
      return state;
  }
};

interface FinanceContextType {
  data: FinanceData;
  dispatch: React.Dispatch<FinanceAction>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, dispatch] = useReducer(financeReducer, defaultData);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialData = loadFinanceData();
    dispatch({ type: 'LOAD_DATA', payload: initialData });
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      saveFinanceData(data);
    }
  }, [data, isInitialized]);

  return (
    <FinanceContext.Provider value={{ data, dispatch }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};