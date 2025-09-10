'use client';

import { useState } from 'react';
import { usePersistentForm } from '@/hooks/use-persistent-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import { OneTimeIncome } from '@/types';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { format } from 'date-fns';

interface OneTimeIncomeFormProps {
  income?: OneTimeIncome;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const OneTimeIncomeForm: React.FC<OneTimeIncomeFormProps> = ({ 
  income, 
  onClose,
  children 
}) => {
  const { addOneTimeIncome, updateOneTimeIncome } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  // Use persistent form state
  const persistentForm = usePersistentForm({
    key: 'onetime-income-form',
    initialData: {
      name: income?.name || '',
      amount: income?.amount?.toString() || '',
      date: income?.date || format(new Date(), 'yyyy-MM-dd'),
    }
  });
  const { formData, updateFormData: setFormData, clearFormData } = persistentForm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.date) {
      return;
    }

    try {
      const data = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        date: formData.date,
      };

      if (income) {
        await updateOneTimeIncome({ ...income, ...data });
      } else {
        await addOneTimeIncome(data);
      }

      setOpen(false);
      // Clear form data only when adding new entries (not editing)
      if (!income) {
        clearFormData();
      }
      onClose?.();
    } catch (error) {
      console.error('Error saving one-time income:', error);
    }
  };

  const trigger = children || (
    <Button variant="outline" className="flex items-center gap-2">
      {income ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {income ? 'Edit' : 'Add One-time Income'}
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
            {income ? 'Edit One-time Income' : 'Add One-time Income'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value }))
              placeholder="e.g., Bonus"
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
              onChange={(e) => setFormData({ amount: e.target.value }))
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ date: e.target.value })}
              required
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