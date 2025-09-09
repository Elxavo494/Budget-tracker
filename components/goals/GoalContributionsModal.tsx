'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCurrency } from '@/hooks/use-currency';
import { format, differenceInDays } from 'date-fns';
import { SavingsGoal, GoalContribution, GoalMilestone } from '@/types';
import { Calendar, Target, TrendingUp, DollarSign, BarChart3, Trophy, CheckCircle, Star } from 'lucide-react';

interface GoalContributionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal;
  contributions: GoalContribution[];
  milestones: GoalMilestone[];
  progressPercentage: number;
  remainingAmount: number;
}

export const GoalContributionsModal: React.FC<GoalContributionsModalProps> = ({
  isOpen,
  onClose,
  goal,
  contributions,
  milestones,
  progressPercentage,
  remainingAmount
}) => {
  const { formatCurrency } = useCurrency();

  // Sort contributions by date (newest first)
  const sortedContributions = [...contributions].sort(
    (a, b) => new Date(b.contributionDate).getTime() - new Date(a.contributionDate).getTime()
  );

  // Sort milestones by percentage
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
  );

  const getAnalytics = () => {
    const totalContributions = contributions.reduce((sum, contribution) => sum + contribution.amount, 0);
    const averageContribution = contributions.length > 0 ? totalContributions / contributions.length : 0;
    
    // Find largest and smallest contributions
    const amounts = contributions.map(c => c.amount);
    const largestContribution = amounts.length > 0 ? Math.max(...amounts) : 0;
    const smallestContribution = amounts.length > 0 ? Math.min(...amounts) : 0;
    
    // Calculate frequency
    const firstContribution = contributions.length > 0 ? new Date(Math.min(...contributions.map(c => new Date(c.contributionDate).getTime()))) : new Date();
    const lastContribution = contributions.length > 0 ? new Date(Math.max(...contributions.map(c => new Date(c.contributionDate).getTime()))) : new Date();
    const periodDays = Math.max(1, differenceInDays(lastContribution, firstContribution) + 1);
    const frequencyPerDay = contributions.length / periodDays;
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentContributions = contributions.filter(c => new Date(c.contributionDate) >= thirtyDaysAgo);
    const recentTotal = recentContributions.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      totalContributions,
      averageContribution,
      largestContribution,
      smallestContribution,
      frequencyPerDay,
      periodDays,
      recentContributions: recentContributions.length,
      recentTotal,
      milestonesAchieved: milestones.length
    };
  };

  const analytics = getAnalytics();

  const getMilestoneIcon = (percentage: number) => {
    if (percentage >= 100) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (percentage >= 75) return <Star className="h-4 w-4 text-purple-500" />;
    if (percentage >= 50) return <Target className="h-4 w-4 text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getMilestoneColor = (percentage: number) => {
    if (percentage >= 100) return 'text-yellow-600';
    if (percentage >= 75) return 'text-purple-600';
    if (percentage >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: goal.color }}
            />
            <DialogTitle className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200">
              {goal.name} Progress
            </DialogTitle>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {contributions.length} contributions
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
            </Badge>
            <Badge 
              variant={goal.isCompleted ? "secondary" : "outline"} 
              className={`text-xs ${goal.isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}`}
            >
              {progressPercentage.toFixed(1)}% complete
            </Badge>
          </div>
          {goal.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {goal.description}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Goal Progress Section */}
          <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {goal.isCompleted ? (
                  <Trophy className="h-4 w-4 text-yellow-600" />
                ) : (
                  <Target className="h-4 w-4 text-blue-600" />
                )}
                <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">
                  {goal.isCompleted ? 'Goal Completed!' : 'Goal Progress'}
                </h3>
              </div>
              <Badge 
                variant={goal.isCompleted ? "secondary" : "outline"}
                className="text-xs font-medium"
              >
                {progressPercentage.toFixed(1)}% complete
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <div className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Target Amount</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                  {formatCurrency(goal.targetAmount)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">Current Amount</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400 text-base">
                  {formatCurrency(goal.currentAmount)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-slate-600 dark:text-slate-400 text-xs font-medium mb-1">
                  {goal.isCompleted ? 'Exceeded by' : 'Remaining'}
                </div>
                <div className={`font-semibold text-base ${goal.isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {formatCurrency(Math.abs(remainingAmount))}
                </div>
              </div>
            </div>

            {goal.targetDate && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <span>Target Date: {format(new Date(goal.targetDate), 'MMMM d, yyyy')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Milestones */}
          {sortedMilestones.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">Milestones Achieved</h3>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {sortedMilestones.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {sortedMilestones.map((milestone) => (
                  <div 
                    key={milestone.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl border bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800/50"
                  >
                    <div className="flex items-center gap-3">
                      {getMilestoneIcon(milestone.milestonePercentage * 100)}
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                          {(milestone.milestonePercentage * 100).toFixed(0)}% Milestone
                        </h4>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          Achieved on {format(new Date(milestone.achievedAt), 'MMMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold text-sm ${getMilestoneColor(milestone.milestonePercentage * 100)}`}>
                        {formatCurrency(milestone.amountAtAchievement)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Reached
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separator if both milestones and contributions exist */}
          {sortedMilestones.length > 0 && sortedContributions.length > 0 && (
            <Separator />
          )}

          {/* Contributions */}
          {sortedContributions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">Contributions</h3>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {sortedContributions.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {sortedContributions.map((contribution) => (
                  <div 
                    key={contribution.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl border bg-slate-50/30 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                          Contribution
                        </h4>
                        <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-md">
                          {format(new Date(contribution.contributionDate), 'MMM d')}
                        </Badge>
                      </div>
                      {contribution.description && (
                        <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {contribution.description}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {format(new Date(contribution.contributionDate), 'EEEE, MMMM d, yyyy')}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                        +{formatCurrency(contribution.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {sortedContributions.length === 0 && sortedMilestones.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Target className="h-16 w-16 mx-auto mb-4 opacity-40" />
              <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-300 mb-2">No contributions yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Start making contributions to track your progress towards {goal.name}.
              </p>
            </div>
          )}

          {/* Analytics Summary */}
          {sortedContributions.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="font-semibold text-base text-slate-800 dark:text-slate-200">Goal Analytics</h3>
                </div>

                {/* Summary Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Contributions */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-900 dark:text-green-100">Total Added</span>
                    </div>
                    <div className="font-semibold text-lg text-green-900 dark:text-green-100">
                      {formatCurrency(analytics.totalContributions)}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Progress</span>
                    </div>
                    <div className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                      {progressPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      of {formatCurrency(goal.targetAmount)}
                    </div>
                  </div>

                  {/* Average Contribution */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-3 w-3 text-purple-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg Contribution</span>
                    </div>
                    <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                      {formatCurrency(analytics.averageContribution)}
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Milestones</span>
                    </div>
                    <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                      {analytics.milestonesAchieved}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      achieved
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                {analytics.recentContributions > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Recent Activity (Last 30 days)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-900 dark:text-blue-100">
                          {formatCurrency(analytics.recentTotal)}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          {analytics.recentContributions} contributions
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Goal Insights */}
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-3">Goal Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Range: {formatCurrency(analytics.smallestContribution)} - {formatCurrency(analytics.largestContribution)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Tracking period: {analytics.periodDays} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${goal.isCompleted ? 'bg-yellow-500' : 'bg-purple-500'}`}></div>
                      <span>
                        {goal.isCompleted ? 'Goal completed!' : `${formatCurrency(remainingAmount)} to reach target`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>
                        {analytics.frequencyPerDay < 0.1 ? 'Infrequent' : 
                         analytics.frequencyPerDay < 0.5 ? 'Regular' : 'Frequent'} contributions
                      </span>
                    </div>
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
