'use client';

import { useState } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconSelector } from '@/components/ui/icon-selector';
import { Plus, Edit } from 'lucide-react';
import { RecurringExpense, OneTimeExpense, RecurrenceType } from '@/types';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { format } from 'date-fns';

interface UnifiedExpenseFormProps {
  recurringExpense?: RecurringExpense;
  oneTimeExpense?: OneTimeExpense;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const UnifiedExpenseForm: React.FC<UnifiedExpenseFormProps> = ({ 
  recurringExpense, 
  oneTimeExpense,
  onClose,
  children 
}) => {
  const { data, addRecurringExpense, updateRecurringExpense, addOneTimeExpense, updateOneTimeExpense } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(recurringExpense ? 'recurring' : oneTimeExpense ? 'one-time' : 'one-time');
  
  const [recurringFormData, setRecurringFormData] = useState({
    name: recurringExpense?.name || '',
    amount: recurringExpense?.amount?.toString() || '',
    recurrence: recurringExpense?.recurrence || 'monthly' as RecurrenceType,
    categoryId: recurringExpense?.categoryId || '',
    startDate: recurringExpense?.startDate || format(new Date(), 'yyyy-MM-dd'),
    endDate: recurringExpense?.endDate || '',
  });

  const [oneTimeFormData, setOneTimeFormData] = useState({
    name: oneTimeExpense?.name || '',
    amount: oneTimeExpense?.amount?.toString() || '',
    categoryId: oneTimeExpense?.categoryId || '',
    date: oneTimeExpense?.date || format(new Date(), 'yyyy-MM-dd'),
  });

  // Icon state management
  const [recurringIconData, setRecurringIconData] = useState({
    iconUrl: recurringExpense?.iconUrl || '',
    iconType: recurringExpense?.iconType || 'custom' as 'custom' | 'preset',
    presetIconId: recurringExpense?.presetIconId || ''
  });
  const [recurringIconFile, setRecurringIconFile] = useState<File | undefined>();
  
  const [oneTimeIconData, setOneTimeIconData] = useState({
    iconUrl: oneTimeExpense?.iconUrl || '',
    iconType: oneTimeExpense?.iconType || 'custom' as 'custom' | 'preset',
    presetIconId: oneTimeExpense?.presetIconId || ''
  });
  const [oneTimeIconFile, setOneTimeIconFile] = useState<File | undefined>();

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recurringFormData.name || !recurringFormData.amount || !recurringFormData.categoryId || !recurringFormData.startDate) {
      console.log('Form validation failed:', recurringFormData);
      return;
    }

    try {
      const data = {
        name: recurringFormData.name,
        amount: parseFloat(recurringFormData.amount),
        recurrence: recurringFormData.recurrence,
        categoryId: recurringFormData.categoryId,
        startDate: recurringFormData.startDate,
        endDate: recurringFormData.endDate || undefined,
      };

      console.log('Submitting recurring expense:', data);

      if (recurringExpense) {
        await updateRecurringExpense({ 
          ...recurringExpense, 
          ...data, 
          ...recurringIconData 
        }, recurringIconFile);
      } else {
        await addRecurringExpense({
          ...data,
          ...recurringIconData
        }, recurringIconFile);
      }

      handleClose();
    } catch (error) {
      console.error('Error saving recurring expense:', error);
      alert('Error saving expense: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleOneTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oneTimeFormData.name || !oneTimeFormData.amount || !oneTimeFormData.categoryId || !oneTimeFormData.date) {
      console.log('Form validation failed:', oneTimeFormData);
      return;
    }

    try {
      const data = {
        name: oneTimeFormData.name,
        amount: parseFloat(oneTimeFormData.amount),
        categoryId: oneTimeFormData.categoryId,
        date: oneTimeFormData.date,
      };

      console.log('Submitting one-time expense:', data);

      if (oneTimeExpense) {
        await updateOneTimeExpense({ 
          ...oneTimeExpense, 
          ...data, 
          ...oneTimeIconData 
        }, oneTimeIconFile);
      } else {
        await addOneTimeExpense({
          ...data,
          ...oneTimeIconData
        }, oneTimeIconFile);
      }

      handleClose();
    } catch (error) {
      console.error('Error saving one-time expense:', error);
      alert('Error saving expense: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRecurringFormData({
      name: '',
      amount: '',
      recurrence: 'monthly',
      categoryId: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
    });
    setOneTimeFormData({
      name: '',
      amount: '',
      categoryId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    onClose?.();
  };

  const trigger = children || (
    <Button className="flex items-center gap-2">
      {(recurringExpense || oneTimeExpense) ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {(recurringExpense || oneTimeExpense) ? 'Edit Expense' : 'Add Expense'}
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
            {(recurringExpense || oneTimeExpense) ? 'Edit Expense' : 'Add Expense'}
          </DialogTitle>
        </DialogHeader>
        
        {!(recurringExpense || oneTimeExpense) ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one-time">One-time</TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="one-time">
              <form onSubmit={handleOneTimeSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="onetime-name">Name</Label>
                  <Input
                    id="onetime-name"
                    value={oneTimeFormData.name}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, name: e.target.value })}
                    placeholder="e.g., Padel session"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="onetime-amount">Amount (€)</Label>
                  <Input
                    id="onetime-amount"
                    type="number"
                    step="0.01"
                    value={oneTimeFormData.amount}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select 
                    value={oneTimeFormData.categoryId} 
                    onValueChange={(value) => setOneTimeFormData({ ...oneTimeFormData, categoryId: value })}
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

                <div>
                  <Label htmlFor="onetime-date">Date</Label>
                  <Input
                    id="onetime-date"
                    type="date"
                    value={oneTimeFormData.date}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, date: e.target.value })}
                    required
                  />
                </div>

                <IconSelector
                  iconUrl={oneTimeIconData.iconUrl}
                  iconType={oneTimeIconData.iconType}
                  presetIconId={oneTimeIconData.presetIconId}
                  onIconChange={(iconData) => setOneTimeIconData(prev => ({ ...prev, ...iconData }))}
                  onFileSelect={setOneTimeIconFile}
                  label="Expense Icon (optional)"
                />

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Add One-time Expense
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
            </TabsContent>
            
            <TabsContent value="recurring">
              <form onSubmit={handleRecurringSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="recurring-name">Name</Label>
                  <Input
                    id="recurring-name"
                    value={recurringFormData.name}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })}
                    placeholder="e.g., House Loan"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="recurring-amount">Amount (€)</Label>
                  <Input
                    id="recurring-amount"
                    type="number"
                    step="0.01"
                    value={recurringFormData.amount}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label>Category</Label>
                  <Select 
                    value={recurringFormData.categoryId} 
                    onValueChange={(value) => setRecurringFormData({ ...recurringFormData, categoryId: value })}
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

                <div>
                  <Label>Recurrence</Label>
                  <Select 
                    value={recurringFormData.recurrence} 
                    onValueChange={(value: RecurrenceType) => 
                      setRecurringFormData({ ...recurringFormData, recurrence: value })
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
                  <Label htmlFor="recurring-startDate">Start Date</Label>
                  <Input
                    id="recurring-startDate"
                    type="date"
                    value={recurringFormData.startDate}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recurring-endDate">End Date (Optional)</Label>
                  <Input
                    id="recurring-endDate"
                    type="date"
                    value={recurringFormData.endDate}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, endDate: e.target.value })}
                  />
                </div>

                <IconSelector
                  iconUrl={recurringIconData.iconUrl}
                  iconType={recurringIconData.iconType}
                  presetIconId={recurringIconData.presetIconId}
                  onIconChange={(iconData) => setRecurringIconData(prev => ({ ...prev, ...iconData }))}
                  onFileSelect={setRecurringIconFile}
                  label="Expense Icon (optional)"
                />

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Add Recurring Expense
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
            </TabsContent>
          </Tabs>
        ) : recurringExpense ? (
          <form onSubmit={handleRecurringSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-recurring-name">Name</Label>
              <Input
                id="edit-recurring-name"
                value={recurringFormData.name}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })}
                placeholder="e.g., House Loan"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-recurring-amount">Amount (€)</Label>
              <Input
                id="edit-recurring-amount"
                type="number"
                step="0.01"
                value={recurringFormData.amount}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select 
                value={recurringFormData.categoryId} 
                onValueChange={(value) => setRecurringFormData({ ...recurringFormData, categoryId: value })}
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

            <div>
              <Label>Recurrence</Label>
              <Select 
                value={recurringFormData.recurrence} 
                onValueChange={(value: RecurrenceType) => 
                  setRecurringFormData({ ...recurringFormData, recurrence: value })
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
              <Label htmlFor="edit-recurring-startDate">Start Date</Label>
              <Input
                id="edit-recurring-startDate"
                type="date"
                value={recurringFormData.startDate}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-recurring-endDate">End Date (Optional)</Label>
              <Input
                id="edit-recurring-endDate"
                type="date"
                value={recurringFormData.endDate}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, endDate: e.target.value })}
              />
            </div>

            <IconSelector
              iconUrl={recurringIconData.iconUrl}
              iconType={recurringIconData.iconType}
              presetIconId={recurringIconData.presetIconId}
              onIconChange={(iconData) => setRecurringIconData(prev => ({ ...prev, ...iconData }))}
              onFileSelect={setRecurringIconFile}
              label="Expense Icon (optional)"
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Update Expense
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
        ) : (
          <form onSubmit={handleOneTimeSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-onetime-name">Name</Label>
              <Input
                id="edit-onetime-name"
                value={oneTimeFormData.name}
                onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, name: e.target.value })}
                placeholder="e.g., Padel session"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-onetime-amount">Amount (€)</Label>
              <Input
                id="edit-onetime-amount"
                type="number"
                step="0.01"
                value={oneTimeFormData.amount}
                onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select 
                value={oneTimeFormData.categoryId} 
                onValueChange={(value) => setOneTimeFormData({ ...oneTimeFormData, categoryId: value })}
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

            <div>
              <Label htmlFor="edit-onetime-date">Date</Label>
              <Input
                id="edit-onetime-date"
                type="date"
                value={oneTimeFormData.date}
                onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, date: e.target.value })}
                required
              />
            </div>

            <IconSelector
              iconUrl={oneTimeIconData.iconUrl}
              iconType={oneTimeIconData.iconType}
              presetIconId={oneTimeIconData.presetIconId}
              onIconChange={(iconData) => setOneTimeIconData(prev => ({ ...prev, ...iconData }))}
              onFileSelect={setOneTimeIconFile}
              label="Expense Icon (optional)"
            />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Update Expense
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
        )}
      </DialogContent>
    </Dialog>
  );
};