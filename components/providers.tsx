'use client';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { SupabaseFinanceProvider } from '@/contexts/SupabaseFinanceContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SupabaseFinanceProvider>
        {children}
      </SupabaseFinanceProvider>
    </AuthProvider>
  );
}