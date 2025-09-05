'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, calculateWeeklyExpenses } from '@/lib/calculations';
import { RecurringExpense, OneTimeExpense } from '@/types';
import { Calendar, PieChart, BarChart3 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay } from 'date-fns';

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
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ 
  data, 
  monthStart = new Date(), 
  monthEnd = new Date(),
  selectedDate = new Date(),
  recurringExpenses = [],
  oneTimeExpenses = []
}) => {
  const [viewMode, setViewMode] = useState('categories');

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm font-medium mb-1">No expenses to display</p>
        <p className="text-xs text-center max-w-sm text-slate-500">Add some expenses to see your spending breakdown</p>
      </div>
    );
  }

  // Generate weekly data for the current month
  const weeklyData = calculateWeeklyExpenses(
    recurringExpenses,
    oneTimeExpenses,
    monthStart,
    monthEnd
  );

  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);
  const maxCategoryValue = Math.max(...data.map(d => d.value));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="font-medium text-slate-800 dark:text-slate-200 mb-1 text-sm">
            {viewMode === 'categories' ? data.payload.name : `Week of ${label}`}
          </p>
          <p className="text-rose-600 dark:text-rose-400 font-semibold">
            {formatCurrency(data.value)}
          </p>
          {viewMode === 'categories' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {((data.value / totalExpenses) * 100).toFixed(1)}% of total
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CategoryBarChart = () => (
    <div className="space-y-4">
      {/* Header - compact */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total expenses this month
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {data.length} categories
        </Badge>
      </div>

      {/* Category list - compact design */}
      <div className="space-y-2">
        {data
          .sort((a, b) => b.value - a.value)
          .map((category, index) => {
            const percentage = (category.value / totalExpenses) * 100;
            const barWidth = (category.value / maxCategoryValue) * 100;
            
            return (
              <div 
                key={category.name}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none pl-0"
              >
                <div className="flex items-center gap-3 flex-1">
                 
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                        {category.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${barWidth}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 ml-3">
                  {formatCurrency(category.value)}
                </span>
              </div>
            );
          })
        }
      </div>
    </div>
  );

  const WeeklyBarChart = () => (
    <div className="space-y-4">
      {/* Header - compact */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Weekly Breakdown
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {format(monthStart, 'MMMM yyyy')} spending pattern
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Calendar className="h-3 w-3 mr-1" />
          {weeklyData.length} weeks
        </Badge>
      </div>

      {/* Weekly chart */}
      <div className="h-48">
        {React.createElement(ResponsiveContainer as any, { width: "100%", height: "100%" }, 
          React.createElement(BarChart as any, { 
            data: weeklyData, 
            margin: { top: 10, right: 10, left: 10, bottom: 5 } 
          }, [
            React.createElement(XAxis as any, { 
              key: 'xaxis',
              dataKey: "week", 
              axisLine: false,
              tickLine: false,
              tick: { fontSize: 11, fill: 'currentColor' },
              className: "text-slate-600 dark:text-slate-400"
            }),
            React.createElement(YAxis as any, { 
              key: 'yaxis',
              axisLine: false,
              tickLine: false,
              tick: { fontSize: 11, fill: 'currentColor' },
              className: "text-slate-600 dark:text-slate-400",
              tickFormatter: (value: number) => `€${value}`
            }),
            React.createElement(Tooltip as any, { key: 'tooltip', content: CustomTooltip }),
            React.createElement(Bar as any, { 
              key: 'bar',
              dataKey: "value", 
              radius: [4, 4, 0, 0],
              className: "fill-primary"
            })
          ])
        )}
      </div>

      {/* Daily breakdown for current week - compact */}
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-3">
          This Week&apos;s Daily Spending
        </p>
        <div className="grid grid-cols-7 gap-2">
          {weeklyData[weeklyData.length - 1]?.days.map((day, index) => (
            <div 
              key={index}
              className={`p-2 rounded-lg text-center transition-all focus:outline-none ${
                day.isToday 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <p className={`text-xs font-medium mb-1 ${
                day.isToday ? 'text-primary-foreground/90' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {day.day}
              </p>
              <p className={`text-sm font-semibold ${
                day.isToday ? 'text-primary-foreground' : 'text-slate-900 dark:text-slate-100'
              }`}>
                €{day.value.toFixed(0)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4 h-10">
        <TabsTrigger value="categories" className="text-xs sm:text-sm focus:outline-none focus:ring-0">
          <PieChart className="h-3 w-3 mr-1" />
          Categories
        </TabsTrigger>
        <TabsTrigger value="weekly" className="text-xs sm:text-sm focus:outline-none focus:ring-0">
          <BarChart3 className="h-3 w-3 mr-1" />
          Weekly
        </TabsTrigger>
      </TabsList>

      <TabsContent value="categories" className="mt-0">
        <CategoryBarChart />
      </TabsContent>

      <TabsContent value="weekly" className="mt-0">
        <WeeklyBarChart />
      </TabsContent>
    </Tabs>
  );
};