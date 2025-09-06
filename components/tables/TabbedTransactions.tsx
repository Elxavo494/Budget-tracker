'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Plus, Search, ArrowUpDown, ChevronDown, ChevronUp, Filter } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc, name-asc
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all'); // all, onetime, recurring
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, or specific category id
  
  // Show More state - default to showing 5 items per tab
  const [visibleCounts, setVisibleCounts] = useState({
    all: 5,
    income: 5,
    spendings: 5
  });

  const INITIAL_VISIBLE_COUNT = 5;

  // Helper functions for show more/less functionality
  const handleShowMore = (tab: keyof typeof visibleCounts, totalCount: number) => {
    setVisibleCounts(prev => ({
      ...prev,
      [tab]: totalCount // Show all remaining transactions
    }));
  };

  const handleShowLess = (tab: keyof typeof visibleCounts) => {
    setVisibleCounts(prev => ({
      ...prev,
      [tab]: INITIAL_VISIBLE_COUNT
    }));
  };

  // Handle tab change and reset visible count for consistency
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Reset the visible count for the new tab to ensure consistency
    setVisibleCounts(prev => ({
      ...prev,
      [newTab as keyof typeof visibleCounts]: INITIAL_VISIBLE_COUNT
    }));
  };

  // Convert all transactions to a unified format with filtering and sorting
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

    // Apply search filter
    let filteredTransactions = transactions;
    if (searchTerm.trim()) {
      filteredTransactions = transactions.filter(transaction =>
        transaction.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply transaction type filter
    if (transactionTypeFilter !== 'all') {
      filteredTransactions = filteredTransactions.filter(transaction =>
        transaction.subtype === transactionTypeFilter
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filteredTransactions = filteredTransactions.filter(transaction =>
        transaction.categoryId === categoryFilter
      );
    }

    // Apply sorting
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'name-asc':
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return sortedTransactions;
  }, [data, monthStart, monthEnd, searchTerm, sortBy, transactionTypeFilter, categoryFilter]);

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


  // Drag state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    currentX: number;
    transactionId: string;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, transaction: TransactionItem) => {
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    const elementRect = element.getBoundingClientRect();
    const touchX = touch.clientX;
    
    // Only start drag if touch is within 30px of the right edge (for swipe left to delete)
    const edgeThreshold = 30;
    const isNearRightEdge = touchX >= (elementRect.right - edgeThreshold);
    
    if (!isNearRightEdge) return; // Don't start drag if not near edge
    
    setDragState({
      isDragging: false,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      transactionId: transaction.id
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.startX;
    const deltaY = touch.clientY - dragState.startY;
    
    // If vertical movement is greater than horizontal, don't trigger swipe (allow scrolling)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      setDragState(null);
      return;
    }
    
    // Only trigger for significant horizontal movement (increased threshold)
    if (Math.abs(deltaX) > 20) {
      setDragState(prev => prev ? {
        ...prev,
        isDragging: true,
        currentX: touch.clientX
      } : null);
    }
  };

  const handleTouchEnd = (transaction: TransactionItem) => {
    if (!dragState) return;
    
    const deltaX = dragState.currentX - dragState.startX;
    const threshold = 120; // Increased threshold to make it less sensitive
    
    // Only handle swipe left to delete (removed swipe right for edit)
    if (deltaX < -threshold && dragState.isDragging) {
      const normalizedSubtype = transaction.subtype === 'onetime' ? 'one-time' : transaction.subtype;
      const deleteType = `${normalizedSubtype}-${transaction.type}`;
      handleDeleteClick(deleteType, transaction.id, transaction.name);
    }
    
    setDragState(null);
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

    // Calculate drag overlay properties (only for delete)
    let overlayOpacity = 0;
    let overlayColor = '';
    let overlayIcon = null;
    let overlayText = '';
    let overlayPosition = '';
    let overlayWidth = '0%';
    
    if (dragState && dragState.transactionId === transaction.id && dragState.isDragging) {
      const deltaX = dragState.currentX - dragState.startX;
      const maxOpacity = 0.8;
      const threshold = 120; // Updated to match the new threshold
      
      if (deltaX < -20) {
        // Swipe left - delete (red) - slides from right
        overlayOpacity = maxOpacity;
        overlayWidth = `${Math.min(100, (Math.abs(deltaX) / threshold) * 100)}%`;
        overlayColor = 'bg-red-500';
        overlayIcon = <Trash2 className="h-6 w-6 text-white" />;
        overlayText = 'Delete';
        overlayPosition = 'right-0';
      }
    }

    const EditFormComponent = isIncome ? UnifiedIncomeForm : UnifiedExpenseForm;
    const editProps = isIncome 
      ? {
          recurringIncome: transaction.subtype === 'recurring' ? originalTransaction as any : undefined,
          oneTimeIncome: transaction.subtype === 'onetime' ? originalTransaction as any : undefined,
        }
      : {
          recurringExpense: transaction.subtype === 'recurring' ? originalTransaction as any : undefined,
          oneTimeExpense: transaction.subtype === 'onetime' ? originalTransaction as any : undefined,
        };

    return (
      <div key={transaction.id}>
        <div className="relative overflow-hidden rounded-xl">
          {/* Swipe overlay */}
          {dragState && dragState.transactionId === transaction.id && overlayOpacity > 0 && (
            <div
              className={`absolute top-0 bottom-0 ${overlayPosition} ${overlayColor} flex items-center justify-center z-10 transition-all duration-150`}
              style={{ 
                opacity: overlayOpacity,
                width: overlayWidth
              }}
            >
              <div className="flex flex-col items-center gap-1">
                {overlayIcon}
                <span className="text-white text-sm font-medium">{overlayText}</span>
              </div>
            </div>
          )}
          
          {/* Transaction item */}
          <div
            className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border ${bgColor} ${borderColor} transition-all duration-200 hover:shadow-sm dark:hover:shadow-lg touch-pan-y select-none relative`}
            onTouchStart={(e) => handleTouchStart(e, transaction)}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => handleTouchEnd(transaction)}
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
          
              {/* Edit button - now larger and more prominent */}
              <div className="flex items-center">
                <EditFormComponent {...editProps}>
                <Button variant="ghost" size="default" className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </Button>
                </EditFormComponent>
          </div>
        </div>
          </div>
        </div>

      </div>
    );
  };

  // Show More Button Component
  const ShowMoreButton = ({ 
    tab, 
    totalCount, 
    visibleCount 
  }: { 
    tab: keyof typeof visibleCounts; 
    totalCount: number; 
    visibleCount: number; 
  }) => {
    if (totalCount <= INITIAL_VISIBLE_COUNT) return null;

    return (
      <div className="flex justify-center pt-4">
        {visibleCount < totalCount ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowMore(tab, totalCount)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Show All ({totalCount - visibleCount} more)
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowLess(tab)}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 gap-2"
          >
            <ChevronUp className="h-4 w-4" />
            Show Less
          </Button>
        )}
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
          <Button variant="ghost" size="sm" className="gap-2 rounded-full border-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
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

          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-2 mb-4 sm:mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
              />
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex flex-row gap-2">
              {/* Transaction Type Filter */}
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger className="flex-1 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="onetime">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="flex-1 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {data.categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="amount-desc">Amount: High to Low</SelectItem>
                  <SelectItem value="amount-asc">Amount: Low to High</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                <>
                  {allTransactions.slice(0, visibleCounts.all).map(renderTransaction)}
                  <ShowMoreButton 
                    tab="all" 
                    totalCount={allTransactions.length} 
                    visibleCount={visibleCounts.all} 
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-2 sm:space-y-3 mt-0">
              {(() => {
                const incomeTransactions = allTransactions.filter(t => t.type === 'income');
                return incomeTransactions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm sm:text-base">No income transactions</p>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                      Add your salary or other income sources
                    </p>
                  </div>
                ) : (
                  <>
                    {incomeTransactions.slice(0, visibleCounts.income).map(renderTransaction)}
                    <ShowMoreButton 
                      tab="income" 
                      totalCount={incomeTransactions.length} 
                      visibleCount={visibleCounts.income} 
                    />
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="spendings" className="space-y-2 sm:space-y-3 mt-0">
              {(() => {
                const expenseTransactions = allTransactions.filter(t => t.type === 'expense');
                return expenseTransactions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm sm:text-base">No expense transactions</p>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                      Track your spending by adding expenses
                    </p>
                  </div>
                ) : (
                  <>
                    {expenseTransactions.slice(0, visibleCounts.spendings).map(renderTransaction)}
                    <ShowMoreButton 
                      tab="spendings" 
                      totalCount={expenseTransactions.length} 
                      visibleCount={visibleCounts.spendings} 
                    />
                  </>
                );
              })()}
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