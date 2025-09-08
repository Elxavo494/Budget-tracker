'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCurrency } from '@/hooks/use-currency';
import { format, differenceInDays } from 'date-fns';
import { RecurringExpense, OneTimeExpense } from '@/types';
import { Calendar, Repeat, TrendingUp, DollarSign, BarChart3, Target } from 'lucide-react';

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
  const { formatCurrency } = useCurrency();
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

  const getAnalytics = () => {
    const recurringTotal = transactions.recurring.reduce((sum, expense) => {
      const monthlyAmount = expense.recurrence === 'monthly' ? expense.amount :
        expense.recurrence === 'weekly' ? expense.amount * 4.33 :
        expense.amount / 12;
      return sum + monthlyAmount;
    }, 0);
    
    const oneTimeTotal = transactions.oneTime.reduce((sum, expense) => sum + expense.amount, 0);
    const totalAmount = recurringTotal + oneTimeTotal;
    const totalTransactions = transactions.recurring.length + transactions.oneTime.length;
    
    // Calculate average transaction amount
    const averageTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    // Find largest and smallest transactions
    const allAmounts = [
      ...transactions.recurring.map(t => t.amount),
      ...transactions.oneTime.map(t => t.amount)
    ];
    const largestTransaction = allAmounts.length > 0 ? Math.max(...allAmounts) : 0;
    const smallestTransaction = allAmounts.length > 0 ? Math.min(...allAmounts) : 0;
    
    // Calculate frequency (transactions per day over the period)
    const periodDays = Math.max(1, differenceInDays(monthEnd, monthStart) + 1);
    const frequencyPerDay = totalTransactions / periodDays;
    
    // One-time transaction analysis
    const oneTimeAmounts = transactions.oneTime.map(t => t.amount);
    const oneTimeAverage = oneTimeAmounts.length > 0 ? 
      oneTimeAmounts.reduce((sum, amount) => sum + amount, 0) / oneTimeAmounts.length : 0;
    
    return {
      totalAmount,
      recurringTotal,
      oneTimeTotal,
      totalTransactions,
      averageTransaction,
      largestTransaction,
      smallestTransaction,
      frequencyPerDay,
      oneTimeAverage,
      periodDays
    };
  };

  const analytics = getAnalytics();

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

          {/* Analytics Summary */}
          {transactions.total > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">Category Summary</h3>
                </div>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Amount */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-red-200 dark:border-red-800/50 ">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-3 w-3 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-red-900 dark:text-red-100 ">Total Spent</span>
                    </div>
                    <div className="font-semibold text-lg text-red-900 dark:text-red-100">
                      {formatCurrency(analytics.totalAmount)}
                    </div>
                  </div>

                  {/* Average Transaction */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg Transaction</span>
                    </div>
                    <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                      {formatCurrency(analytics.averageTransaction)}
                    </div>
                  </div>

                  {/* Transaction Count */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 className="h-3 w-3 text-purple-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Transactions</span>
                    </div>
                    <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                      {analytics.totalTransactions}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {analytics.frequencyPerDay.toFixed(1)}/day
                    </div>
                  </div>

                  {/* Largest Transaction */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-3 w-3 text-orange-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Largest</span>
                    </div>
                    <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                      {formatCurrency(analytics.largestTransaction)}
                    </div>
                  </div>
                </div>

                {/* Breakdown by Type */}
                {(analytics.recurringTotal > 0 || analytics.oneTimeTotal > 0) && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">Spending Breakdown</h4>
                    <div className="space-y-2">
                      {analytics.recurringTotal > 0 && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2">
                            <Repeat className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Recurring Expenses</span>
                            <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                              {transactions.recurring.length} items
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-blue-900 dark:text-blue-100">
                              {formatCurrency(analytics.recurringTotal)}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">
                              {((analytics.recurringTotal / analytics.totalAmount) * 100).toFixed(1)}% of total
                            </div>
                          </div>
                        </div>
                      )}

                      {analytics.oneTimeTotal > 0 && (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-800 dark:text-green-300">One-time Expenses</span>
                            <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                              {transactions.oneTime.length} items
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-900 dark:text-green-100">
                              {formatCurrency(analytics.oneTimeTotal)}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400">
                              {((analytics.oneTimeTotal / analytics.totalAmount) * 100).toFixed(1)}% of total
                            </div>
                            {analytics.oneTimeAverage > 0 && (
                              <div className="text-xs text-green-600 dark:text-green-400">
                                Avg: {formatCurrency(analytics.oneTimeAverage)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Insights */}
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Quick Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Period: {analytics.periodDays} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Range: {formatCurrency(analytics.smallestTransaction)} - {formatCurrency(analytics.largestTransaction)}</span>
                    </div>
                    {analytics.frequencyPerDay > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Activity: {analytics.frequencyPerDay < 0.1 ? 'Low' : analytics.frequencyPerDay < 0.5 ? 'Moderate' : 'High'} frequency</span>
                      </div>
                    )}
                    {analytics.totalTransactions > 1 && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>
                          {analytics.recurringTotal > analytics.oneTimeTotal ? 'Mostly recurring expenses' : 
                           analytics.oneTimeTotal > analytics.recurringTotal ? 'Mostly one-time expenses' : 
                           'Balanced spending mix'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};