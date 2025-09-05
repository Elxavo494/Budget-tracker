'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { AuthModal } from '@/components/auth/AuthModal';
import { 
  getCurrentMonthRange,
  calculateMonthlyRecurringIncome,
  calculateMonthlyRecurringExpenses,
  calculateOneTimeIncomeForMonth,
  calculateOneTimeExpensesForMonth,
  calculateExpensesByCategory,
  calculateWeeksRemainingInMonth,
  formatCurrency
} from '@/lib/calculations';
import { StatsCards } from './StatsCards';
import { ExpenseChart } from '@/components/charts/ExpenseChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TabbedTransactions } from '@/components/tables/TabbedTransactions';
import { FloatingActionButton, FloatingActionItem } from '@/components/ui/floating-action-button';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { SpendingInsights } from '@/components/ui/spending-insights';
import { SearchFilter } from '@/components/ui/search-filter';
import { UnifiedIncomeForm } from '@/components/forms/UnifiedIncomeForm';
import { UnifiedExpenseForm } from '@/components/forms/UnifiedExpenseForm';
import { DataImporter } from '@/components/utils/DataImporter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { generateSpendingInsights } from '@/lib/spending-insights';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { user, isSupabaseConfigured, loading: authLoading } = useAuth();
  const { data, loading, error } = useSupabaseFinance();
  
  // (logging removed)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Show auth modal if not authenticated
  if (!user) {
    // Show configuration message if Supabase is not configured
    if (!isSupabaseConfigured) {
          return (
      <div className="min-h-screen gradient-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md">
          <h1 className="text-4xl font-bold text-shimmer">Finance Tracker</h1>
          <div className="glass-card p-4">
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Supabase Configuration Required
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
                To use this app, you need to configure your Supabase credentials in the <code>.env.local</code> file.
              </p>
              <div className="text-left bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs font-mono">
                <div>NEXT_PUBLIC_SUPABASE_URL=your_url_here</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here</div>
              </div>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-3">
                After adding your credentials, restart the development server.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen gradient-background flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-4xl font-bold text-shimmer">Finance Tracker</h1>
          <p className="text-muted-foreground text-lg font-medium">
            Sign in to start tracking your finances
          </p>
          <Button 
            onClick={() => setAuthModalOpen(true)}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen gradient-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground font-medium">Loading your financial data...</p>
          <p className="text-xs text-muted-foreground/70">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen gradient-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Data</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="destructive" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Use selected date instead of current month
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const goToPreviousMonth = () => {
    setSelectedDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setSelectedDate(prev => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedDate(new Date());
  };

  const isCurrentMonth = format(selectedDate, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  const recurringIncome = calculateMonthlyRecurringIncome(data.recurringIncomes, monthStart, monthEnd);
  const recurringExpenses = calculateMonthlyRecurringExpenses(data.recurringExpenses, monthStart, monthEnd);
  const oneTimeIncome = calculateOneTimeIncomeForMonth(data.oneTimeIncomes, monthStart, monthEnd);
  const oneTimeExpenses = calculateOneTimeExpensesForMonth(data.oneTimeExpenses, monthStart, monthEnd);

  const totalIncome = recurringIncome + oneTimeIncome;
  const totalExpenses = recurringExpenses + oneTimeExpenses;
  const balance = totalIncome - totalExpenses;
  
  // Calculate budget-related values - use total income as the monthly budget
  const monthlyBudget = totalIncome;
  const leftToSpend = monthlyBudget - totalExpenses;
  const spendingProgress = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  
  // Calculate weekly spending amount
  const weeksRemaining = calculateWeeksRemainingInMonth(selectedDate);
  const leftToSpendPerWeek = weeksRemaining > 0 ? leftToSpend / weeksRemaining : 0;

  const expensesByCategory = calculateExpensesByCategory(
    data.recurringExpenses,
    data.oneTimeExpenses,
    data.categories,
    monthStart,
    monthEnd
  );

  // Generate spending insights
  const spendingInsights = generateSpendingInsights(
    data.recurringExpenses,
    data.oneTimeExpenses,
    data.recurringIncomes,
    data.oneTimeIncomes,
    data.categories,
    selectedDate
  );

  const handleRefresh = async () => {
    // Simulate refresh by reloading data
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  };
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterType('');
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 pointer-events-none" />
        <div className="relative max-w-[1680px] mx-auto px-4 py-12 pt-16">
        {/* New Header Design */}
        <div className="mb-3">
          {/* Large Amount Display */}
          <div className="text-center mb-3">
            <div className="relative inline-block">
              <div className="text-7xl sm:text-8xl font-black text-gray-100 mb-2 tracking-tighter w-max mx-auto">
                {formatCurrency(leftToSpend)}
              </div>
              <p className="absolute -top-4 -right-0 text-gray-100/70 dark:text-gray-100/70 text-xs font-normal whitespace-nowrap">
                {formatCurrency(leftToSpendPerWeek)}/ remaining weeks
              </p>
            </div>
            <p className="text-gray-100 dark:text-gray-100 text-base font-medium">
              Left to spend this month
            </p>
          </div>

           {/* Month Selector */}
           <div className="flex justify-center mb-14">
            <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/10 backdrop-blur-sm rounded-lg shadow-sm p-1">
              {/* Previous Month Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              </Button>

              {/* Current Month Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 gap-1.5 h-auto hover:bg-slate-100 dark:hover:bg-slate-700/50 min-w-[140px] transition-colors rounded-md"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                      {format(selectedDate, 'MMMM yyyy')}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-64 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                  {/* Quick navigation header */}
                  <div className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Quick Navigation
                  </div>
                  
                  {/* Current month option */}
                  {!isCurrentMonth && (
                    <>
                      <DropdownMenuItem 
                        onClick={goToCurrentMonth} 
                        className="flex items-center justify-center mx-1 px-3 py-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-150 group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                            {format(new Date(), 'MMMM yyyy')} (Current)
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <div className="mx-3 my-2 border-t border-slate-100 dark:border-slate-700"></div>
                    </>
                  )}
                  
                  {/* Month navigation */}
                  <div className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Navigate Months
                  </div>
                  
                  {/* Previous months */}
                  {Array.from({ length: 3 }, (_, i) => {
                    const monthDate = subMonths(selectedDate, i + 1);
                    const isSelected = format(monthDate, 'yyyy-MM') === format(selectedDate, 'yyyy-MM');
                    return (
                      <DropdownMenuItem 
                        key={`prev-${i}`}
                        onClick={() => setSelectedDate(monthDate)} 
                        className={`flex items-center justify-between mx-1 px-3 py-2.5 rounded-lg transition-colors duration-150 group ${
                          isSelected 
                            ? 'bg-slate-100 dark:bg-slate-700' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className={`font-medium ${
                          isSelected 
                            ? 'text-slate-900 dark:text-slate-100' 
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {format(monthDate, 'MMMM yyyy')}
                        </span>
                        {isSelected && (
                          <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  
                  {/* Current selected month if not current */}
                  {!isCurrentMonth && (
                    <DropdownMenuItem 
                      className="flex items-center justify-between mx-1 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700"
                      disabled
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {format(selectedDate, 'MMMM yyyy')}
                      </span>
                      <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                    </DropdownMenuItem>
                  )}
                  
                  {/* Future months */}
                  {Array.from({ length: 3 }, (_, i) => {
                    const monthDate = addMonths(selectedDate, i + 1);
                    const isSelected = format(monthDate, 'yyyy-MM') === format(selectedDate, 'yyyy-MM');
                    return (
                      <DropdownMenuItem 
                        key={`next-${i}`}
                        onClick={() => setSelectedDate(monthDate)} 
                        className={`flex items-center justify-between mx-1 px-3 py-2.5 rounded-lg transition-colors duration-150 group ${
                          isSelected 
                            ? 'bg-slate-100 dark:bg-slate-700' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className={`font-medium ${
                          isSelected 
                            ? 'text-slate-900 dark:text-slate-100' 
                            : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {format(monthDate, 'MMMM yyyy')}
                        </span>
                        {isSelected && (
                          <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Next Month Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              </Button>
            </div>
          </div>

          {/* Budget Card */}
          <div className="mx-auto sm:max-w-none">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Left to spend</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(leftToSpend)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Monthly budget</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(monthlyBudget)}
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full gradient-primary transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(spendingProgress, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>{(spendingProgress).toFixed(1)}% spent</span>
                  <span>{(100 - spendingProgress).toFixed(1)}% remaining</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data Import Section - Show only if user has no data */}
        {(data.recurringIncomes.length + 
          data.recurringExpenses.length + 
          data.oneTimeIncomes.length + 
          data.oneTimeExpenses.length) < 10 && (
          <div className="mb-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base">Import Your Existing Data</h3>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  Have data from localStorage? Import it to add more transactions.
                </p>
              </div>
              <DataImporter />
            </div>
          </div>
        )}

        <StatsCards
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          balance={balance}
        />

        <TabbedTransactions 
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          balance={balance}
          monthStart={monthStart}
          monthEnd={monthEnd}
        />
        
        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <SpendingInsights insights={spendingInsights} />
          
          <Card className="lg:col-span-2 glass-card order-2 lg:order-1">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseChart 
                data={expensesByCategory} 
                monthStart={monthStart}
                monthEnd={monthEnd}
                selectedDate={selectedDate}
                recurringExpenses={data.recurringExpenses}
                oneTimeExpenses={data.oneTimeExpenses}
              />
            </CardContent>
          </Card>

          <Card className="glass-card order-1 lg:order-2">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200">Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Recurring Income</span>
                  <span className="font-semibold text-emerald-600 text-sm sm:text-base">{formatCurrency(recurringIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">One-time Income</span>
                  <span className="font-semibold text-emerald-600 text-sm sm:text-base">{formatCurrency(oneTimeIncome)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Recurring Expenses</span>
                  <span className="font-semibold text-rose-600 text-sm sm:text-base">{formatCurrency(recurringExpenses)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">One-time Expenses</span>
                  <span className="font-semibold text-rose-600 text-sm sm:text-base">{formatCurrency(oneTimeExpenses)}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-2.5 sm:p-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm sm:text-base">Net Balance</span>
                    <span className={`text-base sm:text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Friendly Action Buttons */}
        <div className="fixed bottom-4 w-fit mx-auto left-1/2 -translate-x-1/2 sm:bottom-6 z-50">
          <div className="flex items-center justify-center gap-2 sm:gap-3 glass-card rounded-full shadow-sm dark:shadow-lg px-3 sm:px-4 py-2.5 sm:py-3 max-w-sm mx-auto sm:max-w-none">
            <UnifiedIncomeForm>
              <Button variant="income" size="lg" className="rounded-full px-4 py-2 gap-2 hover:scale-105 active:scale-95 transition-transform duration-200">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm font-medium">Add income</span>
              </Button>
            </UnifiedIncomeForm>
            <div className="w-px h-6 sm:h-8 bg-border/50"></div>
            <UnifiedExpenseForm>
              <Button variant="expense" size="lg" className="rounded-full px-4 py-2 gap-2 hover:scale-105 active:scale-95 transition-transform duration-200">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm font-medium">Add expense</span>
              </Button>
            </UnifiedExpenseForm>
          </div>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
};