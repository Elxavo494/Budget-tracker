'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import { RecurringExpense, RecurrenceType } from '@/types';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { format } from 'date-fns';

interface RecurringExpenseFormProps {
  expense?: RecurringExpense;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const RecurringExpenseForm: React.FC<RecurringExpenseFormProps> = ({ 
  expense, 
  onClose,
  children 
}) => {
  const { data, addRecurringExpense, updateRecurringExpense } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: expense?.name || '',
    amount: expense?.amount?.toString() || '',
    recurrence: expense?.recurrence || 'monthly' as RecurrenceType,
    categoryId: expense?.categoryId || '',
    startDate: expense?.startDate || format(new Date(), 'yyyy-MM-dd'),
    endDate: expense?.endDate || '',
    isMaaltijdcheques: expense?.isMaaltijdcheques || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.categoryId || !formData.startDate) {
      return;
    }

    try {
      const expenseData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        recurrence: formData.recurrence,
        categoryId: formData.categoryId,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        isMaaltijdcheques: formData.isMaaltijdcheques,
      };

      if (expense) {
        await updateRecurringExpense({ ...expense, ...expenseData });
      } else {
        await addRecurringExpense(expenseData);
      }

      setOpen(false);
      setFormData({
        name: '',
        amount: '',
        recurrence: 'monthly',
        categoryId: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        isMaaltijdcheques: false,
      });
      onClose?.();
    } catch (error) {
      console.error('Error saving recurring expense:', error);
    }
  };

  const trigger = children || (
    <Button className="flex items-center gap-2">
      {expense ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {expense ? 'Edit' : 'Add Recurring Expense'}
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
            {expense ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., House Loan"
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
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select 
              value={formData.categoryId} 
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {data.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="maaltijdcheques"
              checked={formData.isMaaltijdcheques}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, isMaaltijdcheques: !!checked })
              }
            />
            <Label htmlFor="maaltijdcheques">Paid with Maaltijdcheques</Label>
          </div>

          <div>
            <Label>Recurrence</Label>
            <Select 
              value={formData.recurrence} 
              onValueChange={(value: RecurrenceType) => 
                setFormData({ ...formData, recurrence: value })
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
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date (Optional)</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {expense ? 'Update' : 'Add'} Expense
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