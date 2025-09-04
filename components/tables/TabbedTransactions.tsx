'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import { UnifiedIncomeForm } from '@/components/forms/UnifiedIncomeForm';
import { UnifiedExpenseForm } from '@/components/forms/UnifiedExpenseForm';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { presetIcons, getLogoUrl } from '@/lib/preset-icons';
import toast from 'react-hot-toast';

interface TabbedTransactionsProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthStart: Date;
  monthEnd: Date;
}

interface TransactionItem {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  subtype: 'recurring' | 'onetime';
  categoryId?: string;
  recurrence?: string;
  startDate?: string;
  endDate?: string;
  iconUrl?: string;
  iconType?: 'custom' | 'preset';
  presetIconId?: string;
}

export const TabbedTransactions: React.FC<TabbedTransactionsProps> = ({
  totalIncome,
  totalExpenses,
  balance,
  monthStart,
  monthEnd,
}) => {
  const { data, deleteRecurringIncome, deleteRecurringExpense, deleteOneTimeIncome, deleteOneTimeExpense } = useSupabaseFinance();
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Convert all transactions to a unified format
  const allTransactions = useMemo((): TransactionItem[] => {
    const transactions: TransactionItem[] = [];

    // Add recurring incomes
    data.recurringIncomes.forEach(income => {
      transactions.push({
        id: income.id,
        name: income.name,
        amount: income.amount,
        date: income.startDate,
        type: 'income',
        subtype: 'recurring',
        recurrence: income.recurrence,
        startDate: income.startDate,
        endDate: income.endDate,
        iconUrl: income.iconUrl,
        iconType: income.iconType,
        presetIconId: income.presetIconId,
      });
    });

    // Add recurring expenses
    data.recurringExpenses.forEach(expense => {
      transactions.push({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        date: expense.startDate,
        type: 'expense',
        subtype: 'recurring',
        categoryId: expense.categoryId,
        recurrence: expense.recurrence,
        startDate: expense.startDate,
        endDate: expense.endDate,
        iconUrl: expense.iconUrl,
        iconType: expense.iconType,
        presetIconId: expense.presetIconId,
      });
    });

    // Add one-time incomes
    data.oneTimeIncomes.forEach(income => {
      const incomeDate = new Date(income.date);
      if (incomeDate >= monthStart && incomeDate <= monthEnd) {
        transactions.push({
          id: income.id,
          name: income.name,
          amount: income.amount,
          date: income.date,
          type: 'income',
          subtype: 'onetime',
          iconUrl: income.iconUrl,
          iconType: income.iconType,
          presetIconId: income.presetIconId,
        });
      }
    });

    // Add one-time expenses
    data.oneTimeExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= monthStart && expenseDate <= monthEnd) {
        transactions.push({
          id: expense.id,
          name: expense.name,
          amount: expense.amount,
          date: expense.date,
          type: 'expense',
          subtype: 'onetime',
          categoryId: expense.categoryId,
          iconUrl: expense.iconUrl,
          iconType: expense.iconType,
          presetIconId: expense.presetIconId,
        });
      }
    });

    // Sort by date (most recent first)
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, monthStart, monthEnd]);

  const getCategoryName = (categoryId?: string): string => {
    if (!categoryId) return '';
    const category = data.categories.find(cat => cat.id === categoryId);
    return category?.name || 'Other';
  };

  const getCategoryColor = (categoryId?: string): string => {
    if (!categoryId) return '#6b7280';
    const category = data.categories.find(cat => cat.id === categoryId);
    return category?.color || '#6b7280';
  };

  const handleDeleteClick = (type: string, id: string, name: string) => {
    setDeleteItem({ type, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      switch (deleteItem.type) {
        case 'recurring-income':
          await deleteRecurringIncome(deleteItem.id);
          toast.success('Recurring income deleted');
          break;
        case 'recurring-expense':
          await deleteRecurringExpense(deleteItem.id);
          toast.success('Recurring expense deleted');
          break;
        case 'one-time-income':
          await deleteOneTimeIncome(deleteItem.id);
          toast.success('One-time income deleted');
          break;
        case 'one-time-expense':
          await deleteOneTimeExpense(deleteItem.id);
          toast.success('One-time expense deleted');
          break;
      }
    } catch (error) {
      toast.error('Failed to delete transaction');
    } finally {
      setDeleteItem(null);
    }
  };

  const renderTransactionIcon = (transaction: TransactionItem) => {
    // If it's a preset icon, use it
    if (transaction.iconType === 'preset' && transaction.presetIconId) {
      const presetIcon = presetIcons.find(icon => icon.id === transaction.presetIconId);
      if (presetIcon) {
        return (
          <div 
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{ backgroundColor: presetIcon.backgroundColor }}
          >
            <img 
              src={getLogoUrl(presetIcon.domain)} 
              alt={transaction.name}
              className="w-6 h-6 sm:w-7 sm:h-7"
            />
          </div>
        );
      }
    }
    
    // If it's a custom icon, use it
    if (transaction.iconType === 'custom' && transaction.iconUrl) {
      return (
        <img 
          src={transaction.iconUrl} 
          alt={transaction.name}
          className="w-full h-full object-cover rounded-full"
        />
      );
    }
    
    // Fallback to first letter
    return (
      <span className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-300">
        {transaction.name.charAt(0).toUpperCase()}
      </span>
    );
  };

  const renderTransaction = (transaction: TransactionItem) => {
    const isIncome = transaction.type === 'income';
    const bgColor = isIncome ? 'bg-green-50/70 dark:bg-green-950/30' : 'bg-red-50/70 dark:bg-red-950/30';
    const borderColor = isIncome ? 'border-green-200/60 dark:border-green-800/60' : 'border-red-200/60 dark:border-red-800/60';
    
    const originalTransaction = transaction.subtype === 'recurring' 
      ? (isIncome 
          ? data.recurringIncomes.find(i => i.id === transaction.id)
          : data.recurringExpenses.find(e => e.id === transaction.id))
      : (isIncome 
          ? data.oneTimeIncomes.find(i => i.id === transaction.id)
          : data.oneTimeExpenses.find(e => e.id === transaction.id));

    const normalizedSubtype = transaction.subtype === 'onetime' ? 'one-time' : transaction.subtype;
    const deleteType = `${normalizedSubtype}-${transaction.type}`;

    return (
      <div
        key={transaction.id}
        className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border ${bgColor} ${borderColor} transition-all duration-200 hover:shadow-sm dark:hover:shadow-lg`}
      >
        {/* Avatar with icon or first letter */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 border-2 border-white/60 dark:border-slate-600/60 shadow-sm overflow-hidden">
          {renderTransactionIcon(transaction)}
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base">
              {transaction.name}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {transaction.subtype === 'recurring' && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 rounded-md border font-normal text-slate-600 dark:text-slate-400">
                  {transaction.recurrence}
                </Badge>
              )}
              {transaction.categoryId && (
                <Badge 
                  variant="outline"
                  style={{ 
                    borderColor: getCategoryColor(transaction.categoryId),
                    color: getCategoryColor(transaction.categoryId),
                    backgroundColor: `${getCategoryColor(transaction.categoryId)}10`
                  }}
                  className="text-xs px-1.5 py-0.5 rounded-md border font-normal"
                >
                  {getCategoryName(transaction.categoryId)}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {transaction.subtype === 'recurring' 
              ? `Since ${format(new Date(transaction.startDate!), 'MMM yyyy')}`
              : format(new Date(transaction.date), 'MMM dd')}
            <span className="text-xs text-slate-400 dark:text-slate-500 font-light ml-1">
              / {transaction.subtype === 'recurring' ? transaction.recurrence : 'one-time'}
            </span>
          </p>
        </div>

        {/* Amount and Actions */}
        <div className="flex flex-col items-end gap-2">
          <p className={`font-bold text-sm sm:text-base ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
          </p>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {isIncome ? (
              <UnifiedIncomeForm 
                recurringIncome={transaction.subtype === 'recurring' && isIncome ? originalTransaction as any : undefined}
                oneTimeIncome={transaction.subtype === 'onetime' && isIncome ? originalTransaction as any : undefined}
              >
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-600">
                  <Edit className="h-3 w-3" />
                </Button>
              </UnifiedIncomeForm>
            ) : (
              <UnifiedExpenseForm 
                recurringExpense={transaction.subtype === 'recurring' && !isIncome ? originalTransaction as any : undefined}
                oneTimeExpense={transaction.subtype === 'onetime' && !isIncome ? originalTransaction as any : undefined}
              >
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-600">
                  <Edit className="h-3 w-3" />
                </Button>
              </UnifiedExpenseForm>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => handleDeleteClick(deleteType, transaction.id, transaction.name)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Dynamic Add Button Component
  const DynamicAddButton = () => {
    if (activeTab === 'income') {
      return (
        <UnifiedIncomeForm>
          <Button variant="income" size="sm" className="gap-2 rounded-full">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Income</span>
          </Button>
        </UnifiedIncomeForm>
      );
    } else if (activeTab === 'spendings') {
      return (
        <UnifiedExpenseForm>
          <Button variant="expense" size="sm" className="gap-2 rounded-full">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Expense</span>
          </Button>
        </UnifiedExpenseForm>
      );
    } else {
      // All tab - show both options in a dropdown or default to expense
      return (
        <UnifiedExpenseForm>
          <Button size="sm" className="gap-2 rounded-full">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </UnifiedExpenseForm>
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 glass-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Transactions</h2>
            <DynamicAddButton />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-10 sm:h-11">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="income" className="text-xs sm:text-sm">Income</TabsTrigger>
              <TabsTrigger value="spendings" className="text-xs sm:text-sm">Spendings</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 sm:space-y-3 mt-0">
              {allTransactions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm sm:text-base">No transactions yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                    Add your first income or expense to get started
                  </p>
                </div>
              ) : (
                allTransactions.map(renderTransaction)
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-2 sm:space-y-3 mt-0">
              {allTransactions.filter(t => t.type === 'income').length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm sm:text-base">No income transactions</p>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                    Add your salary or other income sources
                  </p>
                </div>
              ) : (
                allTransactions
                  .filter(t => t.type === 'income')
                  .map(renderTransaction)
              )}
            </TabsContent>

            <TabsContent value="spendings" className="space-y-2 sm:space-y-3 mt-0">
              {allTransactions.filter(t => t.type === 'expense').length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm sm:text-base">No expense transactions</p>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                    Track your spending by adding expenses
                  </p>
                </div>
              ) : (
                allTransactions
                  .filter(t => t.type === 'expense')
                  .map(renderTransaction)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction"
        description={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};