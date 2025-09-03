'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-lg font-medium">No expenses to display</p>
        <p className="text-sm">Add some expenses to see your spending breakdown</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
          <p className="font-semibold text-slate-800 dark:text-slate-200">{data.name}</p>
          <p className="text-rose-600 font-medium">
            €{data.value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const ResponsiveContainerComponent = ResponsiveContainer as any;
  const PieChartComponent = PieChart as any;
  const PieComponent = Pie as any;
  const CellComponent = Cell as any;
  const TooltipComponent = Tooltip as any;

  return (
    <ResponsiveContainerComponent width="100%" height={320}>
      <PieChartComponent>
        <PieComponent
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={110}
          dataKey="value"
          label={({ name, percent }: any) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <CellComponent key={`cell-${index}`} fill={entry.color} />
          ))}
        </PieComponent>
        <TooltipComponent content={CustomTooltip} />
      </PieChartComponent>
    </ResponsiveContainerComponent>
  );
};