'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconSelector } from '@/components/ui/icon-selector';
import { SavingsGoal, GoalProgress, GoalContribution } from '@/types';
import { useCurrency } from '@/hooks/use-currency';
import { Plus, Edit, Trash2, Target, Calendar, TrendingUp, DollarSign, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface GoalsManagerProps {
  goals: SavingsGoal[];
  goalsProgress: GoalProgress[];
  onCreateGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateGoal: (goalId: string, updates: Partial<SavingsGoal>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onAddContribution: (goalId: string, amount: number, description?: string) => Promise<void>;
}

export const GoalsManager: React.FC<GoalsManagerProps> = ({
  goals,
  goalsProgress,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddContribution
}) => {
  const { formatCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [color, setColor] = useState('#3b82f6');
  const [iconUrl, setIconUrl] = useState<string>('');
  const [iconType, setIconType] = useState<'custom' | 'preset'>('preset');
  const [presetIconId, setPresetIconId] = useState<string>('');

  // Contribution form state
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDescription, setContributionDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount || parseFloat(targetAmount) <= 0) return;

    setLoading(true);
    try {
      const goalData = {
        name,
        description: description || undefined,
        targetAmount: parseFloat(targetAmount),
        currentAmount: editingGoal?.currentAmount || 0,
        targetDate: targetDate || undefined,
        priority,
        color,
        iconUrl: iconUrl || undefined,
        iconType: iconType || 'preset',
        presetIconId: presetIconId || undefined,
        isActive: editingGoal?.isActive ?? true,
        isCompleted: editingGoal?.isCompleted ?? false,
        completedAt: editingGoal?.completedAt
      };

      if (editingGoal) {
        await onUpdateGoal(editingGoal.id, goalData);
      } else {
        await onCreateGoal(goalData);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributionAmount || parseFloat(contributionAmount) <= 0) return;

    setLoading(true);
    try {
      await onAddContribution(
        selectedGoal.id,
        parseFloat(contributionAmount),
        contributionDescription || undefined
      );
      handleContributionClose();
    } catch (error) {
      console.error('Error adding contribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingGoal(null);
    setName('');
    setDescription('');
    setTargetAmount('');
    setTargetDate('');
    setPriority('medium');
    setColor('#3b82f6');
    setIconUrl('');
    setIconType('preset');
    setPresetIconId('');
  };

  const handleContributionClose = () => {
    setContributionOpen(false);
    setSelectedGoal(null);
    setContributionAmount('');
    setContributionDescription('');
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setDescription(goal.description || '');
    setTargetAmount(goal.targetAmount.toString());
    setTargetDate(goal.targetDate || '');
    setPriority(goal.priority);
    setColor(goal.color);
    setIconUrl(goal.iconUrl || '');
    setIconType(goal.iconType || 'preset');
    setPresetIconId(goal.presetIconId || '');
    setOpen(true);
  };

  const handleAddContribution = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContributionOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await onDeleteGoal(goalId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDaysRemaining = (targetDate?: string) => {
    if (!targetDate) return null;
    const days = differenceInDays(new Date(targetDate), new Date());
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Savings Goals</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Set and track your financial goals
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Goal' : 'Create Savings Goal'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about your goal..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount</Label>
                  <CurrencyInput
                    id="targetAmount"
                    value={targetAmount}
                    onChange={(value) => setTargetAmount(value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date (Optional)</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <IconSelector
                  iconUrl={iconUrl}
                  iconType={iconType}
                  presetIconId={presetIconId}
                  onIconChange={(iconData) => {
                    setIconUrl(iconData.iconUrl || '');
                    setIconType(iconData.iconType || 'preset');
                    setPresetIconId(iconData.presetIconId || '');
                  }}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : editingGoal ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goalsProgress.map((goalProgress) => {
          const goal = goalProgress.goal;
          const daysRemaining = getDaysRemaining(goal.targetDate);
          
          return (
            <Card key={goal.id} className="glass-card">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {goal.iconUrl && (
                      <img 
                        src={goal.iconUrl} 
                        alt={goal.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(goal)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(Math.max(goalProgress.progressPercentage || 0, 0), 100)} 
                    className="h-3"
                    style={{ 
                      '--progress-background': goal.color 
                    } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="font-medium" style={{ color: goal.color }}>
                      {goalProgress.progressPercentage.toFixed(1)}% complete
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatCurrency(goalProgress.remainingAmount)} to go
                    </span>
                  </div>
                </div>

                {/* Goal Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getPriorityColor(goal.priority)} variant="secondary">
                      {goal.priority} priority
                    </Badge>
                    {goal.isCompleted && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>

                  {goal.targetDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Target: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                        {daysRemaining !== null && (
                          <span className={cn(
                            "ml-2 font-medium",
                            daysRemaining < 30 ? "text-red-600 dark:text-red-400" :
                            daysRemaining < 90 ? "text-yellow-600 dark:text-yellow-400" :
                            "text-green-600 dark:text-green-400"
                          )}>
                            ({daysRemaining} days)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {goalProgress.monthlyTargetContribution && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <TrendingUp className="h-4 w-4" />
                      <span>
                        Suggested: {formatCurrency(goalProgress.monthlyTargetContribution)}/month
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {!goal.isCompleted && (
                  <Button 
                    onClick={() => handleAddContribution(goal)}
                    className="w-full"
                    style={{ backgroundColor: goal.color }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Add Contribution
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Add Goal Card */}
        <Card className="glass-card border border-2 border-slate-300 dark:border-slate-600">
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
              <Target className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Add Savings Goal
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Set a target and track your progress
            </p>
            <Button onClick={() => setOpen(true)} variant="outline">
              Create Goal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* No Goals State */}
      {goalsProgress.length === 0 && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-6 mb-6">
              <Target className="h-12 w-12 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No Savings Goals Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
              Create your first savings goal to start building towards your financial dreams.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contribution Dialog */}
      <Dialog open={contributionOpen} onOpenChange={setContributionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add Contribution to {selectedGoal?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContributionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contributionAmount">Amount</Label>
              <Input
                id="contributionAmount"
                type="number"
                step="0.01"
                min="0"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                placeholder="Enter contribution amount"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contributionDescription">Description (Optional)</Label>
              <Input
                id="contributionDescription"
                value={contributionDescription}
                onChange={(e) => setContributionDescription(e.target.value)}
                placeholder="e.g., Monthly savings, Bonus money"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleContributionClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Adding...' : 'Add Contribution'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
