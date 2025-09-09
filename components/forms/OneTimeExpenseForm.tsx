'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import { OneTimeExpense } from '@/types';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { format } from 'date-fns';

interface OneTimeExpenseFormProps {
  expense?: OneTimeExpense;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const OneTimeExpenseForm: React.FC<OneTimeExpenseFormProps> = ({ 
  expense, 
  onClose,
  children 
}) => {
  const { data, addOneTimeExpense, updateOneTimeExpense } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: expense?.name || '',
    amount: expense?.amount?.toString() || '',
    categoryId: expense?.categoryId || '',
    date: expense?.date || format(new Date(), 'yyyy-MM-dd'),
    isMaaltijdcheques: expense?.isMaaltijdcheques || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.categoryId || !formData.date) {
      return;
    }

    try {
      const expenseData = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId,
        date: formData.date,
        isMaaltijdcheques: formData.isMaaltijdcheques,
      };

      if (expense) {
        await updateOneTimeExpense({ ...expense, ...expenseData });
      } else {
        await addOneTimeExpense(expenseData);
      }

      setOpen(false);
      setFormData({
        name: '',
        amount: '',
        categoryId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        isMaaltijdcheques: false,
      });
      onClose?.();
    } catch (error) {
      console.error('Error saving one-time expense:', error);
    }
  };

  const trigger = children || (
    <Button variant="outline" className="flex items-center gap-2">
      {expense ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {expense ? 'Edit' : 'Add One-time Expense'}
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
            {expense ? 'Edit One-time Expense' : 'Add One-time Expense'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Padel session"
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
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