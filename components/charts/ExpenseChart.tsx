'use client';

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/use-currency';
import { calculateEnhancedExpenseAnalytics, getTransactionsByCategory, CategoryHistoricalData } from '@/lib/enhanced-expense-analytics';
import { RecurringExpense, OneTimeExpense, Category, CategoryBudget } from '@/types';
import { Calendar, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, Target } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from '@/components/ui/date-range-picker';
import { CategoryTransactionsModal } from './CategoryTransactionsModal';

interface ExpenseChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  monthStart?: Date;
  monthEnd?: Date;
  selectedDate?: Date;
  recurringExpenses?: RecurringExpense[];
  oneTimeExpenses?: OneTimeExpense[];
  categories?: Category[];
  categoryBudgets?: CategoryBudget[];
  dateRange?: DateRange;
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ 
  data, 
  monthStart = new Date(), 
  monthEnd = new Date(),
  selectedDate = new Date(),
  recurringExpenses = [],
  oneTimeExpenses = [],
  categories = [],
  categoryBudgets = [],
  dateRange = {
    from: new Date(),
    to: new Date(),
    label: 'This Month'
  }
}) => {
  const { formatCurrency } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState<CategoryHistoricalData | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  // Calculate enhanced analytics
  const enhancedAnalytics = useMemo(() => {
    if (categories.length === 0) return null;
    return calculateEnhancedExpenseAnalytics(
      recurringExpenses,
      oneTimeExpenses,
      categories,
      categoryBudgets,
      new Date(dateRange.from)
    );
  }, [recurringExpenses, oneTimeExpenses, categories, categoryBudgets, dateRange]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm font-medium mb-1">No expenses to display</p>
        <p className="text-xs text-center max-w-sm text-slate-500">Add some expenses to see your spending breakdown</p>
      </div>
    );
  }


  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);
  const maxCategoryValue = Math.max(...data.map(d => d.value));

  // Handle category drill-down
  const handleCategoryClick = (categoryData: CategoryHistoricalData) => {
    setSelectedCategory(categoryData);
    setIsTransactionModalOpen(true);
  };

  const getTransactionData = () => {
    if (!selectedCategory) return { recurring: [], oneTime: [], total: 0 };
    return getTransactionsByCategory(
      recurringExpenses,
      oneTimeExpenses,
      selectedCategory.categoryId,
      startOfMonth(dateRange.from),
      endOfMonth(dateRange.to)
    );
  };


  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      default: return <Minus className="h-3 w-3 text-slate-400" />;
    }
  };

  const getRankingIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-3 w-3 text-green-500" />;
    if (change < 0) return <ArrowDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-slate-400" />;
  };

  const CategoryBarChart = () => {
    const displayData = enhancedAnalytics?.categories || data.map(d => ({
      name: d.name,
      value: d.value,
      color: d.color,
      categoryId: '',
      change: { amount: 0, percentage: 0, trend: 'stable' as const },
      ranking: { current: 0, previous: 0, change: 0 },
      averages: { threeMonth: 0, sixMonth: 0, comparison: 'normal' as const },
      seasonal: { isTypical: true, seasonalAverage: 0, deviation: 0 },
      transactions: { count: 0, averageAmount: 0, largestTransaction: 0 },
      budget: undefined
    }));

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(totalExpenses)}
              </p>
              {enhancedAnalytics && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(enhancedAnalytics.summary.overallChange.trend)}
                  <span className={`text-xs font-medium ${
                    enhancedAnalytics.summary.overallChange.trend === 'up' ? 'text-red-600' :
                    enhancedAnalytics.summary.overallChange.trend === 'down' ? 'text-green-600' :
                    'text-slate-500'
                  }`}>
                    {enhancedAnalytics.summary.overallChange.percentage > 0 ? '+' : ''}
                    {enhancedAnalytics.summary.overallChange.percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total expenses • {data.length} categories
            </p>
            {enhancedAnalytics?.summary.budgetSummary && (
              <div className="flex items-center gap-2 mt-1">
                <Target className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-500">
                  {formatCurrency(enhancedAnalytics.summary.budgetSummary.totalSpent)} of {formatCurrency(enhancedAnalytics.summary.budgetSummary.totalBudget)} budget
                </span>
                {enhancedAnalytics.summary.budgetSummary.categoriesOverBudget > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {enhancedAnalytics.summary.budgetSummary.categoriesOverBudget} over budget
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced category list */}
        <div className="space-y-2">
          {displayData
            .sort((a, b) => b.value - a.value)
            .map((category, index) => {
              const percentage = (category.value / totalExpenses) * 100;
              const barWidth = (category.value / maxCategoryValue) * 100;
              
              return (
                <div 
                  key={category.name}
                  className="group flex items-center gap-4 justify-between py-3 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 transition-colors cursor-pointer border border-transparent border-slate-200 dark:border-slate-700"
                  onClick={() => enhancedAnalytics && handleCategoryClick(category)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      {/* Category name and indicators */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                          {category.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {percentage.toFixed(1)}%
                        </span>
                        
                        {/* Historical indicators */}
                        {enhancedAnalytics && (
                          <div className="flex items-center gap-1">
                            {getTrendIcon(category.change.trend)}
                            {category.ranking.change !== 0 && getRankingIcon(category.ranking.change)}
                            {category.averages.comparison === 'above' && (
                              <Badge variant="outline" className="text-xs">Above avg</Badge>
                            )}
                            {category.averages.comparison === 'below' && (
                              <Badge variant="secondary" className="text-xs">Below avg</Badge>
                            )}
                            {!category.seasonal.isTypical && (
                              <Badge variant="outline" className="text-xs">Unusual</Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress bar with budget overlay */}
                      <div className="relative w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-1">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${barWidth}%`,
                            backgroundColor: category.color
                          }}
                        />
                        {/* Budget limit indicator */}
                        {category.budget && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-300"
                            style={{
                              left: `${Math.min((category.budget.limit / maxCategoryValue) * 100, 100)}%`
                            }}
                          />
                        )}
                      </div>

                      {/* Additional info */}
                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                        {category.transactions.count > 0 && (
                          <span>{category.transactions.count} transactions</span>
                        )}
                        {category.budget && (
                          <span className={category.budget.isOverBudget ? 'text-red-600' : 'text-slate-500'}>
                            {formatCurrency(category.budget.remaining)} {category.budget.isOverBudget ? 'over' : 'left'}
                          </span>
                        )}
                        {category.change.amount !== 0 && (
                          <span className={category.change.trend === 'up' ? 'text-red-600' : 'text-green-600'}>
                            {category.change.amount > 0 ? '+' : ''}{formatCurrency(category.change.amount)} vs last month
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-3">
                    <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {formatCurrency(category.value)}
                    </div>
                    {category.budget && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        of {formatCurrency(category.budget.limit)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };


  return (
    <>
      <CategoryBarChart />

      {/* Transaction Details Modal */}
      {selectedCategory && (
        <CategoryTransactionsModal
          isOpen={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          categoryName={selectedCategory.name}
          categoryColor={selectedCategory.color}
          transactions={getTransactionData()}
          monthStart={startOfMonth(dateRange.from)}
          monthEnd={endOfMonth(dateRange.to)}
        />
      )}
    </>
  );
};