'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CategoryBudgetProgress, GoalProgress, BudgetAlert } from '@/types';
import { generateBudgetAlerts, checkGoalMilestones } from '@/lib/budget-calculations';
import { useCurrency } from '@/hooks/use-currency';
import { 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  TrendingUp, 
  X, 
  Bell, 
  BellOff,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface AlertsSystemProps {
  budgetProgress: CategoryBudgetProgress[];
  goalsProgress: GoalProgress[];
  budgetAlerts: BudgetAlert[];
  onUpdateAlertSettings?: (alertType: string, isEnabled: boolean) => Promise<void>;
  onDismissAlert?: (alertId: string) => void;
}

interface AlertItem {
  id: string;
  type: 'budget_threshold' | 'budget_exceeded' | 'goal_milestone' | 'goal_completed' | 'savings_rate';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  categoryName?: string;
  categoryColor?: string;
  goalName?: string;
  goalColor?: string;
  actionable: boolean;
  timestamp: Date;
}

export const AlertsSystem: React.FC<AlertsSystemProps> = ({
  budgetProgress,
  goalsProgress,
  budgetAlerts,
  onUpdateAlertSettings,
  onDismissAlert
}) => {
  const { formatCurrency } = useCurrency();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  // Generate alerts based on current data
  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    // Budget alerts
    const budgetAlertItems = generateBudgetAlerts(budgetProgress);
    budgetAlertItems.forEach((alert, index) => {
      const alertId = `budget-${alert.type}-${alert.categoryName}-${Date.now()}-${index}`;
      if (!dismissedAlerts.has(alertId)) {
        newAlerts.push({
          id: alertId,
          type: alert.type,
          title: alert.type === 'budget_exceeded' ? 'Budget Exceeded!' : 'Budget Alert',
          message: alert.message,
          severity: alert.severity === 'danger' ? 'danger' : 'warning',
          categoryName: alert.categoryName,
          categoryColor: alert.categoryColor,
          actionable: true,
          timestamp: new Date()
        });
      }
    });

    // Goal milestone alerts
    goalsProgress.forEach(goalProgress => {
      const goal = goalProgress.goal;
      const newMilestones = checkGoalMilestones(goal, goalProgress.milestones);
      
      newMilestones.forEach(milestone => {
        const alertId = `goal-milestone-${goal.id}-${milestone}`;
        if (!dismissedAlerts.has(alertId)) {
          const isCompleted = milestone >= 1.0;
          newAlerts.push({
            id: alertId,
            type: isCompleted ? 'goal_completed' : 'goal_milestone',
            title: isCompleted ? 'Goal Completed! 🎉' : 'Milestone Reached! 🎯',
            message: isCompleted 
              ? `Congratulations! You've completed your "${goal.name}" goal!`
              : `You've reached ${(milestone * 100).toFixed(0)}% of your "${goal.name}" goal!`,
            severity: 'success',
            goalName: goal.name,
            goalColor: goal.color,
            actionable: false,
            timestamp: new Date()
          });
        }
      });
    });

    // Savings rate alerts
    const totalBudget = budgetProgress.reduce((sum, b) => sum + b.budgetLimit, 0);
    const totalSpent = budgetProgress.reduce((sum, b) => sum + b.currentSpent, 0);
    if (totalBudget > 0) {
      const spendingRate = (totalSpent / totalBudget) * 100;
      if (spendingRate > 90) {
        const alertId = `savings-rate-high-${Date.now()}`;
        if (!dismissedAlerts.has(alertId)) {
          newAlerts.push({
            id: alertId,
            type: 'savings_rate',
            title: 'High Spending Alert',
            message: `You've used ${spendingRate.toFixed(1)}% of your total budget this month`,
            severity: 'warning',
            actionable: true,
            timestamp: new Date()
          });
        }
      }
    }

    // Sort by severity and timestamp
    newAlerts.sort((a, b) => {
      const severityOrder = { danger: 4, warning: 3, success: 2, info: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setAlerts(newAlerts);
  }, [budgetProgress, goalsProgress, dismissedAlerts]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...Array.from(prev), alertId]));
    if (onDismissAlert) {
      onDismissAlert(alertId);
    }
  };

  const getAlertIcon = (type: AlertItem['type'], severity: AlertItem['severity']) => {
    switch (type) {
      case 'goal_completed':
      case 'goal_milestone':
        return <Target className="h-4 w-4" />;
      case 'budget_exceeded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'budget_threshold':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return severity === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'danger': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    }
  };

  const getAlertTextColor = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'danger': return 'text-red-800 dark:text-red-200';
      case 'warning': return 'text-yellow-800 dark:text-yellow-200';
      case 'success': return 'text-green-800 dark:text-green-200';
      case 'info': return 'text-blue-800 dark:text-blue-200';
    }
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
            All Good!
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No alerts at the moment. Keep up the great work!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
            {visibleAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {visibleAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAlerts.map((alert) => (
          <Alert key={alert.id} className={cn("relative", getAlertColor(alert.severity))}>
            <div className="flex items-start gap-3">
              <div className={cn("flex-shrink-0 mt-0.5", getAlertTextColor(alert.severity))}>
                {getAlertIcon(alert.type, alert.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className={cn("font-semibold text-sm", getAlertTextColor(alert.severity))}>
                      {alert.title}
                    </h4>
                    <AlertDescription className={cn("text-sm mt-1", getAlertTextColor(alert.severity))}>
                      {alert.message}
                    </AlertDescription>
                    {(alert.categoryName || alert.goalName) && (
                      <div className="flex items-center gap-2 mt-2">
                        {alert.categoryColor && (
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: alert.categoryColor }}
                          />
                        )}
                        {alert.goalColor && (
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: alert.goalColor }}
                          />
                        )}
                        <span className={cn("text-xs font-medium", getAlertTextColor(alert.severity))}>
                          {alert.categoryName || alert.goalName}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissAlert(alert.id)}
                    className={cn("h-6 w-6 p-0 hover:bg-transparent", getAlertTextColor(alert.severity))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Alert>
        ))}

        {/* Alert Settings */}
        {showSettings && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Notification Settings
            </h4>
            <div className="space-y-2">
              {budgetAlerts.map((alertSetting) => (
                <div key={alertSetting.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {alertSetting.alertType === 'budget_threshold' && 'Budget threshold alerts'}
                    {alertSetting.alertType === 'budget_exceeded' && 'Budget exceeded alerts'}
                    {alertSetting.alertType === 'goal_milestone' && 'Goal milestone alerts'}
                    {alertSetting.alertType === 'goal_completed' && 'Goal completion alerts'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateAlertSettings?.(alertSetting.alertType, !alertSetting.isEnabled)}
                    className="h-6 w-6 p-0"
                  >
                    {alertSetting.isEnabled ? (
                      <Bell className="h-3 w-3 text-green-600" />
                    ) : (
                      <BellOff className="h-3 w-3 text-slate-400" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Compact notification component for toast-style alerts
export const NotificationToast: React.FC<{
  alert: AlertItem;
  onDismiss: () => void;
}> = ({ alert, onDismiss }) => {
  useEffect(() => {
    // Auto-dismiss success alerts after 5 seconds
    if (alert.severity === 'success') {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.severity, onDismiss]);

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg shadow-lg border",
      getAlertColor(alert.severity)
    )}>
      <div className={cn("flex-shrink-0", getAlertTextColor(alert.severity))}>
        {getAlertIcon(alert.type, alert.severity)}
      </div>
      <div className="flex-1">
        <h4 className={cn("font-semibold text-sm", getAlertTextColor(alert.severity))}>
          {alert.title}
        </h4>
        <p className={cn("text-sm mt-1", getAlertTextColor(alert.severity))}>
          {alert.message}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className={cn("h-6 w-6 p-0 hover:bg-transparent", getAlertTextColor(alert.severity))}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

// Helper function to trigger toast notifications
export const showAlertToast = (alert: AlertItem) => {
  const toastId = toast.custom(
    (t) => (
      <NotificationToast
        alert={alert}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: alert.severity === 'success' ? 5000 : Infinity,
      position: 'top-right'
    }
  );
  return toastId;
};

// Helper functions (moved here to avoid circular imports)
function getAlertColor(severity: AlertItem['severity']) {
  switch (severity) {
    case 'danger': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
    case 'success': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
    case 'info': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
  }
}

function getAlertTextColor(severity: AlertItem['severity']) {
  switch (severity) {
    case 'danger': return 'text-red-800 dark:text-red-200';
    case 'warning': return 'text-yellow-800 dark:text-yellow-200';
    case 'success': return 'text-green-800 dark:text-green-200';
    case 'info': return 'text-blue-800 dark:text-blue-200';
  }
}

function getAlertIcon(type: AlertItem['type'], severity: AlertItem['severity']) {
  switch (type) {
    case 'goal_completed':
    case 'goal_milestone':
      return <Target className="h-4 w-4" />;
    case 'budget_exceeded':
      return <AlertTriangle className="h-4 w-4" />;
    case 'budget_threshold':
      return <TrendingUp className="h-4 w-4" />;
    default:
      return severity === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  }
}
