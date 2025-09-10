'use client';

import { useState } from 'react';
import { usePersistentForm } from '@/hooks/use-persistent-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import { RecurringIncome, RecurrenceType } from '@/types';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { format } from 'date-fns';

interface RecurringIncomeFormProps {
  income?: RecurringIncome;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const RecurringIncomeForm: React.FC<RecurringIncomeFormProps> = ({ 
  income, 
  onClose,
  children 
}) => {
  const { addRecurringIncome, updateRecurringIncome } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  // Use persistent form state
  const persistentForm = usePersistentForm({
    key: 'recurring-income-form',
    initialData: {
      name: income?.name || '',
      amount: income?.amount?.toString() || '',
      recurrence: income?.recurrence || 'monthly' as RecurrenceType,
      startDate: income?.startDate || format(new Date(), 'yyyy-MM-dd'),
      endDate: income?.endDate || '',
    }
  });
  const { formData, updateFormData: setFormData, clearFormData } = persistentForm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.startDate) {
      return;
    }

    try {
      const data = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        recurrence: formData.recurrence,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      };

      if (income) {
        await updateRecurringIncome({ ...income, ...data });
      } else {
        await addRecurringIncome(data);
      }

      setOpen(false);
      // Clear form data only when adding new entries (not editing)
      if (!income) {
        clearFormData();
      }
      onClose?.();
    } catch (error) {
      console.error('Error saving recurring income:', error);
    }
  };

  const trigger = children || (
    <Button className="flex items-center gap-2">
      {income ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {income ? 'Edit' : 'Add Recurring Income'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {income ? 'Edit Recurring Income' : 'Add Recurring Income'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
              placeholder="e.g., Salary"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label>Recurrence</Label>
            <Select 
              value={formData.recurrence} 
              onValueChange={(value: RecurrenceType) => 
                setFormData({ recurrence: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ startDate: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ endDate: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {income ? 'Update' : 'Add'} Income
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};