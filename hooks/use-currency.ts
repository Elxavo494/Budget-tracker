'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { formatCurrency as baseFormatCurrency } from '@/lib/calculations';

export const useCurrency = () => {
  const { getUserCurrency } = useAuth();
  
  const formatCurrency = (amount: number): string => {
    const userCurrency = getUserCurrency();
    return baseFormatCurrency(amount, userCurrency);
  };
  
  const currency = getUserCurrency();
  
  return {
    formatCurrency,
    currency,
  };
};
