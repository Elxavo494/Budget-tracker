'use client';

import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import { UnifiedIncomeForm } from '@/components/forms/UnifiedIncomeForm';
import { UnifiedExpenseForm } from '@/components/forms/UnifiedExpenseForm';
import { StatsCards } from '@/components/dashboard/StatsCards';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableItem } from '@/components/ui/draggable-item';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { presetIcons, getLogoUrl } from '@/lib/preset-icons';

interface TransactionsTableProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthStart: Date;
  monthEnd: Date;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  totalIncome,
  totalExpenses,
  balance,
  monthStart,
  monthEnd,
}) => {
  const { 
    data, 
    deleteRecurringIncome, 
    deleteRecurringExpense, 
    deleteOneTimeIncome, 
    deleteOneTimeExpense,
    reorderRecurringIncomes,
    reorderRecurringExpenses,
    reorderOneTimeIncomes,
    reorderOneTimeExpenses
  } = useSupabaseFinance();
  const [recurringIncomeSearch, setRecurringIncomeSearch] = useState('');
  const [recurringExpenseSearch, setRecurringExpenseSearch] = useState('');
  const [oneTimeIncomeSearch, setOneTimeIncomeSearch] = useState('');
  const [oneTimeExpenseSearch, setOneTimeExpenseSearch] = useState('');
  
  // Show More state - default to showing 5 items per section
  const [visibleCounts, setVisibleCounts] = useState({
    oneTimeExpenses: 5,
    oneTimeIncomes: 5,
    recurringIncomes: 5,
    recurringExpenses: 5
  });

  const INITIAL_VISIBLE_COUNT = 5;

  // Helper functions for show more/less functionality
  const handleShowMore = (section: keyof typeof visibleCounts, totalCount: number) => {
    setVisibleCounts(prev => ({
      ...prev,
      [section]: totalCount // Show all remaining transactions
    }));
  };

  const handleShowLess = (section: keyof typeof visibleCounts) => {
    setVisibleCounts(prev => ({
      ...prev,
      [section]: INITIAL_VISIBLE_COUNT
    }));
  };

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'recurring-income' | 'recurring-expense' | 'one-time-income' | 'one-time-expense';
    id: string;
    name: string;
  }>({ open: false, type: 'recurring-income', id: '', name: '' });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCategoryName = (categoryId: string) => {
    return data.categories.find(cat => cat.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    return data.categories.find(cat => cat.id === categoryId)?.color || '#6b7280';
  };

  // Individual search filters for each section
  const filteredData = useMemo(() => {
    const filterBySearch = (items: any[], searchTerm: string) => {
      if (!searchTerm) return items;
      return items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    };

    // Filter one-time expenses by date range and search
    const filteredOneTimeExpenses = filterBySearch(data.oneTimeExpenses, oneTimeExpenseSearch)
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter one-time incomes by date range and search
    const filteredOneTimeIncomes = filterBySearch(data.oneTimeIncomes, oneTimeIncomeSearch)
      .filter(income => {
        const incomeDate = new Date(income.date);
        return incomeDate >= monthStart && incomeDate <= monthEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      recurringIncomes: filterBySearch(data.recurringIncomes, recurringIncomeSearch),
      recurringExpenses: filterBySearch(data.recurringExpenses, recurringExpenseSearch),
      oneTimeIncomes: filteredOneTimeIncomes,
      oneTimeExpenses: filteredOneTimeExpenses,
    };
  }, [data, recurringIncomeSearch, recurringExpenseSearch, oneTimeIncomeSearch, oneTimeExpenseSearch, monthStart, monthEnd]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    try {
      // Find which list the dragged item belongs to
      const activeId = active.id;
      
      // Check recurring incomes
      const recurringIncomeIndex = filteredData.recurringIncomes.findIndex(item => item.id === activeId);
      if (recurringIncomeIndex !== -1) {
        const items = Array.from(filteredData.recurringIncomes);
        const overIndex = items.findIndex(item => item.id === over.id);
        const reorderedItems = arrayMove(items, recurringIncomeIndex, overIndex);
        await reorderRecurringIncomes(reorderedItems);
        return;
      }
      
      // Check recurring expenses
      const recurringExpenseIndex = filteredData.recurringExpenses.findIndex(item => item.id === activeId);
      if (recurringExpenseIndex !== -1) {
        const items = Array.from(filteredData.recurringExpenses);
        const overIndex = items.findIndex(item => item.id === over.id);
        const reorderedItems = arrayMove(items, recurringExpenseIndex, overIndex);
        await reorderRecurringExpenses(reorderedItems);
        return;
      }
      
      // Check one-time incomes
      const oneTimeIncomeIndex = filteredData.oneTimeIncomes.findIndex(item => item.id === activeId);
      if (oneTimeIncomeIndex !== -1) {
        const items = Array.from(filteredData.oneTimeIncomes);
        const overIndex = items.findIndex(item => item.id === over.id);
        const reorderedItems = arrayMove(items, oneTimeIncomeIndex, overIndex);
        await reorderOneTimeIncomes(reorderedItems);
        return;
      }
      
      // Check one-time expenses
      const oneTimeExpenseIndex = filteredData.oneTimeExpenses.findIndex(item => item.id === activeId);
      if (oneTimeExpenseIndex !== -1) {
        const items = Array.from(filteredData.oneTimeExpenses);
        const overIndex = items.findIndex(item => item.id === over.id);
        const reorderedItems = arrayMove(items, oneTimeExpenseIndex, overIndex);
        await reorderOneTimeExpenses(reorderedItems);
        return;
      }
    } catch (error) {
      console.error('Error reordering items:', error);
      // You could show a toast notification here
    }
  };

  const handleDeleteClick = (type: typeof deleteDialog.type, id: string, name: string) => {
    setDeleteDialog({ open: true, type, id, name });
  };

  const handleConfirmDelete = async () => {
    try {
      switch (deleteDialog.type) {
        case 'recurring-income':
          await deleteRecurringIncome(deleteDialog.id);
          break;
        case 'recurring-expense':
          await deleteRecurringExpense(deleteDialog.id);
          break;
        case 'one-time-income':
          await deleteOneTimeIncome(deleteDialog.id);
          break;
        case 'one-time-expense':
          await deleteOneTimeExpense(deleteDialog.id);
          break;
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleteDialog({ open: false, type: 'recurring-income', id: '', name: '' });
    }
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">



      {/* Section: One-time Transactions */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">One-time Transactions</h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Your occasional income and expenses</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* One-time Expenses */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <div className="space-y-2 sm:space-y-3">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-rose-400 rounded-full"></div>
                    One-time Expenses
                  </div>
                  <UnifiedExpenseForm>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-rose-100 dark:hover:bg-rose-800"
                    >
                      <Plus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                  </UnifiedExpenseForm>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search one-time expenses..."
                    value={oneTimeExpenseSearch}
                    onChange={(e) => setOneTimeExpenseSearch(e.target.value)}
                    className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-6">
              {filteredData.oneTimeExpenses.length === 0 ? (
                <div className="text-center py-4 sm:py-6">
                  <p className="text-slate-400 dark:text-slate-500 mb-2 text-sm sm:text-base">
                    {oneTimeExpenseSearch ? 'No matching one-time expenses' : 'No one-time expenses yet'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-600">
                    {oneTimeExpenseSearch ? 'Try a different search term' : 'Add purchases or occasional expenses'}
                  </p>
                </div>
              ) : (
                <>
                  <SortableContext items={filteredData.oneTimeExpenses.slice(0, visibleCounts.oneTimeExpenses).map(e => e.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {filteredData.oneTimeExpenses
                        .slice(0, visibleCounts.oneTimeExpenses)
                        .map((expense) => (
                        <DraggableItem key={expense.id} id={expense.id}>
                          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-rose-50/30 dark:bg-rose-900/10 rounded-lg border border-rose-100 dark:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 transition-colors duration-200 w-full">
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate pr-2">{expense.name}</div>
                              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                <div>
                                  {formatCurrency(expense.amount)} • {format(new Date(expense.date), 'MMM dd, yyyy')}
                                </div>
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    borderColor: getCategoryColor(expense.categoryId),
                                    color: getCategoryColor(expense.categoryId),
                                    backgroundColor: `${getCategoryColor(expense.categoryId)}10`
                                  }}
                                  className="text-xs px-1.5 py-0.5 rounded-md border font-normal w-fit"
                                >
                                  {getCategoryName(expense.categoryId)}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1 ml-2">
                              <UnifiedExpenseForm oneTimeExpense={expense}>
                                <Button variant="ghost" size="sm" className="hover:bg-rose-100 dark:hover:bg-rose-800 h-8 w-8 p-0">
                                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                                </Button>
                              </UnifiedExpenseForm>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="hover:bg-rose-100 dark:hover:bg-rose-800 h-8 w-8 p-0"
                               onClick={() => handleDeleteClick('one-time-expense', expense.id, expense.name)}
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                              </Button>
                            </div>
                          </div>
                        </DraggableItem>
                      ))}
                    </div>
                  </SortableContext>
                  
                  {/* Show More/Less Button for One-time Expenses */}
                  {filteredData.oneTimeExpenses.length > INITIAL_VISIBLE_COUNT && (
                    <div className="flex justify-center pt-3">
                      {visibleCounts.oneTimeExpenses < filteredData.oneTimeExpenses.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowMore('oneTimeExpenses', filteredData.oneTimeExpenses.length)}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show All ({filteredData.oneTimeExpenses.length - visibleCounts.oneTimeExpenses} more)
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowLess('oneTimeExpenses')}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          {/* One-time Incomes */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <div className="space-y-2 sm:space-y-3">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
                    One-time Incomes
                  </div>
        <UnifiedIncomeForm>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-800"
                    >
                      <Plus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </UnifiedIncomeForm>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search one-time incomes..."
                    value={oneTimeIncomeSearch}
                    onChange={(e) => setOneTimeIncomeSearch(e.target.value)}
                    className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-6">
              {filteredData.oneTimeIncomes.length === 0 ? (
                <div className="text-center py-4 sm:py-6">
                  <p className="text-slate-400 dark:text-slate-500 mb-2 text-sm sm:text-base">
                    {oneTimeIncomeSearch ? 'No matching one-time incomes' : 'No one-time incomes yet'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-600">
                    {oneTimeIncomeSearch ? 'Try a different search term' : 'Add bonuses or occasional income'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {filteredData.oneTimeIncomes
                      .slice(0, visibleCounts.oneTimeIncomes)
                      .map((income) => (
                      <div key={income.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors duration-200">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate pr-2">{income.name}</div>
                          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {formatCurrency(income.amount)} • {format(new Date(income.date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1 ml-2">
                          <UnifiedIncomeForm oneTimeIncome={income}>
                            <Button variant="ghost" size="sm" className="hover:bg-emerald-100 dark:hover:bg-emerald-800 h-8 w-8 p-0">
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
          </Button>
                          </UnifiedIncomeForm>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-rose-100 dark:hover:bg-rose-800 h-8 w-8 p-0"
                            onClick={() => handleDeleteClick('one-time-income', income.id, income.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
            </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Show More/Less Button for One-time Incomes */}
                  {filteredData.oneTimeIncomes.length > INITIAL_VISIBLE_COUNT && (
                    <div className="flex justify-center pt-3">
                      {visibleCounts.oneTimeIncomes < filteredData.oneTimeIncomes.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowMore('oneTimeIncomes', filteredData.oneTimeIncomes.length)}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show All ({filteredData.oneTimeIncomes.length - visibleCounts.oneTimeIncomes} more)
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowLess('oneTimeIncomes')}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Section: Recurring Transactions */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Recurring Transactions</h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Your regular income and expenses</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Recurring Incomes */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <div className="space-y-2 sm:space-y-3">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                  Recurring Incomes
                  </div>
                  <UnifiedIncomeForm>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-800"
                    >
                      <Plus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                  </UnifiedIncomeForm>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search recurring incomes..."
                    value={recurringIncomeSearch}
                    onChange={(e) => setRecurringIncomeSearch(e.target.value)}
                    className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-6">
              {filteredData.recurringIncomes.length === 0 ? (
                <div className="text-center py-4 sm:py-6">
                  <p className="text-slate-400 dark:text-slate-500 mb-2 text-sm sm:text-base">
                    {recurringIncomeSearch ? 'No matching recurring incomes' : 'No recurring incomes yet'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-600">
                    {recurringIncomeSearch ? 'Try a different search term' : 'Add your salary or regular income'}
                  </p>
                </div>
              ) : (
                <>
                  <SortableContext items={filteredData.recurringIncomes.slice(0, visibleCounts.recurringIncomes).map(i => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {filteredData.recurringIncomes
                        .slice(0, visibleCounts.recurringIncomes)
                        .map((income) => (
                      <DraggableItem key={income.id} id={income.id}>
                        <div className="flex items-center justify-between p-2.5 sm:p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors duration-200 w-full">
                      <div className="flex-1">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate pr-2">{income.name}</div>
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {formatCurrency(income.amount)} • {income.recurrence} • 
                          Since {format(new Date(income.startDate), 'MMM yyyy')}
                          {income.endDate && ` until ${format(new Date(income.endDate), 'MMM yyyy')}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 ml-2">
                        <UnifiedIncomeForm recurringIncome={income}>
                              <Button variant="ghost" size="sm" className="hover:bg-emerald-100 dark:hover:bg-emerald-800 h-8 w-8 p-0">
                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                          </Button>
                        </UnifiedIncomeForm>
                        <Button 
                          variant="ghost" 
                          size="sm"
                              className="hover:bg-rose-100 dark:hover:bg-rose-800 h-8 w-8 p-0"
                          onClick={() => handleDeleteClick('recurring-income', income.id, income.name)}
                        >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                        </Button>
                      </div>
                        </div>
                      </DraggableItem>
                    ))}
                    </div>
                  </SortableContext>
                  
                  {/* Show More/Less Button for Recurring Incomes */}
                  {filteredData.recurringIncomes.length > INITIAL_VISIBLE_COUNT && (
                    <div className="flex justify-center pt-3">
                      {visibleCounts.recurringIncomes < filteredData.recurringIncomes.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowMore('recurringIncomes', filteredData.recurringIncomes.length)}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show All ({filteredData.recurringIncomes.length - visibleCounts.recurringIncomes} more)
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowLess('recurringIncomes')}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recurring Expenses */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <div className="space-y-2 sm:space-y-3">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-rose-500 rounded-full"></div>
                  Recurring Expenses
                  </div>
                  <UnifiedExpenseForm>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-rose-100 dark:hover:bg-rose-800"
                    >
                      <Plus className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </Button>
                  </UnifiedExpenseForm>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search recurring expenses..."
                    value={recurringExpenseSearch}
                    onChange={(e) => setRecurringExpenseSearch(e.target.value)}
                    className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3 sm:p-6">
              {filteredData.recurringExpenses.length === 0 ? (
                <div className="text-center py-4 sm:py-6">
                  <p className="text-slate-400 dark:text-slate-500 mb-2 text-sm sm:text-base">
                    {recurringExpenseSearch ? 'No matching recurring expenses' : 'No recurring expenses yet'}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-600">
                    {recurringExpenseSearch ? 'Try a different search term' : 'Add your rent, subscriptions, or bills'}
                  </p>
                </div>
              ) : (
                <>
                  <SortableContext items={filteredData.recurringExpenses.slice(0, visibleCounts.recurringExpenses).map(e => e.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {filteredData.recurringExpenses
                        .slice(0, visibleCounts.recurringExpenses)
                        .map((expense) => (
                      <DraggableItem key={expense.id} id={expense.id}>
                        <div className="flex items-center justify-between p-2.5 sm:p-3 bg-rose-50/50 dark:bg-rose-900/20 rounded-lg border border-rose-100 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors duration-200 w-full">
                      <div className="flex items-center gap-3 flex-1">
                        {expense.imageUrl && (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 border border-rose-200 dark:border-rose-700">
                            <img 
                              src={expense.imageUrl} 
                              alt={expense.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base truncate pr-2">{expense.name}</div>
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                              <div>
                          {formatCurrency(expense.amount)} • {expense.recurrence} • 
                          Since {format(new Date(expense.startDate), 'MMM yyyy')}
                          {expense.endDate && ` until ${format(new Date(expense.endDate), 'MMM yyyy')}`}
                              </div>
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: getCategoryColor(expense.categoryId),
                              color: getCategoryColor(expense.categoryId),
                              backgroundColor: `${getCategoryColor(expense.categoryId)}10`
                            }}
                            className="text-xs px-1.5 py-0.5 rounded-md border font-normal w-fit"
                          >
                            {getCategoryName(expense.categoryId)}
                          </Badge>
                        </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 ml-2">
                        <UnifiedExpenseForm recurringExpense={expense}>
                              <Button variant="ghost" size="sm" className="hover:bg-rose-100 dark:hover:bg-rose-800 h-8 w-8 p-0">
                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                          </Button>
                        </UnifiedExpenseForm>
                        <Button 
                          variant="ghost" 
                          size="sm"
                              className="hover:bg-rose-100 dark:hover:bg-rose-800 h-8 w-8 p-0"
                          onClick={() => handleDeleteClick('recurring-expense', expense.id, expense.name)}
                              >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600 dark:text-slate-400" />
                              </Button>
                            </div>
                          </div>
                        </DraggableItem>
                      ))}
                    </div>
                  </SortableContext>
                  
                  {/* Show More/Less Button for Recurring Expenses */}
                  {filteredData.recurringExpenses.length > INITIAL_VISIBLE_COUNT && (
                    <div className="flex justify-center pt-3">
                      {visibleCounts.recurringExpenses < filteredData.recurringExpenses.length ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowMore('recurringExpenses', filteredData.recurringExpenses.length)}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show All ({filteredData.recurringExpenses.length - visibleCounts.recurringExpenses} more)
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowLess('recurringExpenses')}
                          className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <ConfirmationDialog
      open={deleteDialog.open}
      onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
      title="Delete Transaction"
      description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={handleConfirmDelete}
      variant="destructive"
    />
    </DndContext>
  );
};