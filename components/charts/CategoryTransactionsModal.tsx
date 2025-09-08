'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import { RecurringExpense, OneTimeExpense } from '@/types';
import { Calendar, Repeat } from 'lucide-react';

interface CategoryTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  categoryColor: string;
  transactions: {
    recurring: RecurringExpense[];
    oneTime: OneTimeExpense[];
    total: number;
  };
  monthStart: Date;
  monthEnd: Date;
}

export const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  categoryColor,
  transactions,
  monthStart,
  monthEnd
}) => {
  const getRecurrenceLabel = (recurrence: string) => {
    switch (recurrence) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'yearly': return 'Yearly';
      default: return recurrence;
    }
  };

  const getTotalValue = () => {
    const recurringTotal = transactions.recurring.reduce((sum, expense) => {
      const monthlyAmount = expense.recurrence === 'monthly' ? expense.amount :
        expense.recurrence === 'weekly' ? expense.amount * 4.33 :
        expense.amount / 12;
      return sum + monthlyAmount;
    }, 0);
    
    const oneTimeTotal = transactions.oneTime.reduce((sum, expense) => sum + expense.amount, 0);
    
    return recurringTotal + oneTimeTotal;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
            <DialogTitle className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200">
              {categoryName} Transactions
            </DialogTitle>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {format(monthStart, 'MMM d')} - {format(monthEnd, 'MMM d, yyyy')}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {transactions.total} transactions
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatCurrency(getTotalValue())} total
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recurring Expenses */}
          {transactions.recurring.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Repeat className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">Recurring Expenses</h3>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {transactions.recurring.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {transactions.recurring.map((expense) => {
                  const monthlyAmount = expense.recurrence === 'monthly' ? expense.amount :
                    expense.recurrence === 'weekly' ? expense.amount * 4.33 :
                    expense.amount / 12;
                  
                  return (
                    <div 
                      key={expense.id}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl border bg-slate-50/30 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{expense.name}</h4>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-md">
                            {getRecurrenceLabel(expense.recurrence)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            {formatCurrency(expense.amount)} {expense.recurrence}
                          </span>
                          {expense.recurrence !== 'monthly' && (
                            <span>
                              ≈ {formatCurrency(monthlyAmount)}/month
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {formatCurrency(monthlyAmount)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          This month
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Separator if both types exist */}
          {transactions.recurring.length > 0 && transactions.oneTime.length > 0 && (
            <Separator />
          )}

          {/* One-time Expenses */}
          {transactions.oneTime.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">One-time Expenses</h3>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {transactions.oneTime.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {transactions.oneTime
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <div 
                      key={expense.id}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl border bg-slate-50/30 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{expense.name}</h4>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-md">
                            {format(new Date(expense.date), 'MMM d')}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {format(new Date(expense.date), 'EEEE, MMMM d, yyyy')}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {formatCurrency(expense.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {transactions.total === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">No transactions found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No expenses recorded for {categoryName} this month.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};