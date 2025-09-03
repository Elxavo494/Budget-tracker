'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { SpendingInsight } from '@/lib/spending-insights';

interface SpendingInsightsProps {
  insights: SpendingInsight[];
}

export const SpendingInsights: React.FC<SpendingInsightsProps> = ({ insights }) => {
  if (insights.length === 0) {
    return (
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Spending Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Add more transactions to see personalized insights about your spending patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getInsightIcon = (type: SpendingInsight['type']) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: SpendingInsight['type']) => {
    switch (type) {
      case 'increase':
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'decrease':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'warning':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'success':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <Card className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Info className="h-5 w-5" />
          Spending Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1">
                {getInsightIcon(insight.type)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <p className="text-xs mt-1 opacity-90">{insight.description}</p>
                  {insight.category && (
                    <Badge 
                      variant="outline" 
                      className="mt-2 text-xs"
                    >
                      {insight.category}
                    </Badge>
                  )}
                </div>
              </div>
              {insight.value && (
                <div className="text-sm font-bold whitespace-nowrap">
                  {insight.value}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};