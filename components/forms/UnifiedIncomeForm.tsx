'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconSelector } from '@/components/ui/icon-selector';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { RecurringIncome, OneTimeIncome, RecurrenceType } from '@/types';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface UnifiedIncomeFormProps {
  recurringIncome?: RecurringIncome;
  oneTimeIncome?: OneTimeIncome;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const UnifiedIncomeForm: React.FC<UnifiedIncomeFormProps> = ({ 
  recurringIncome, 
  oneTimeIncome,
  onClose,
  children 
}) => {
  const { addRecurringIncome, updateRecurringIncome, addOneTimeIncome, updateOneTimeIncome, deleteRecurringIncome, deleteOneTimeIncome } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(recurringIncome ? 'recurring' : oneTimeIncome ? 'one-time' : 'one-time');

  // Sync form data when switching tabs
  const handleTabChange = (newTab: string) => {
    const currentTab = activeTab;
    
    // Only sync if we're not editing existing items
    if (!recurringIncome && !oneTimeIncome) {
      if (currentTab === 'one-time' && newTab === 'recurring') {
        // Moving from one-time to recurring - sync common fields
        setRecurringFormData(prev => ({
          ...prev,
          name: oneTimeFormData.name || prev.name,
          amount: oneTimeFormData.amount || prev.amount,
        }));
        setRecurringIconData(prev => ({
          ...prev,
          iconUrl: oneTimeIconData.iconUrl || prev.iconUrl,
          iconType: oneTimeIconData.iconType || prev.iconType,
          presetIconId: oneTimeIconData.presetIconId || prev.presetIconId,
        }));
        if (oneTimeIconFile) {
          setRecurringIconFile(oneTimeIconFile);
        }
      } else if (currentTab === 'recurring' && newTab === 'one-time') {
        // Moving from recurring to one-time - sync common fields
        setOneTimeFormData(prev => ({
          ...prev,
          name: recurringFormData.name || prev.name,
          amount: recurringFormData.amount || prev.amount,
        }));
        setOneTimeIconData(prev => ({
          ...prev,
          iconUrl: recurringIconData.iconUrl || prev.iconUrl,
          iconType: recurringIconData.iconType || prev.iconType,
          presetIconId: recurringIconData.presetIconId || prev.presetIconId,
        }));
        if (recurringIconFile) {
          setOneTimeIconFile(recurringIconFile);
        }
      }
    }
    
    setActiveTab(newTab);
  };
  
  const [recurringFormData, setRecurringFormData] = useState({
    name: recurringIncome?.name || '',
    amount: recurringIncome?.amount?.toString() || '',
    recurrence: recurringIncome?.recurrence || 'monthly' as RecurrenceType,
    startDate: recurringIncome?.startDate || format(new Date(), 'yyyy-MM-dd'),
    endDate: recurringIncome?.endDate || '',
  });

  const [oneTimeFormData, setOneTimeFormData] = useState({
    name: oneTimeIncome?.name || '',
    amount: oneTimeIncome?.amount?.toString() || '',
    date: oneTimeIncome?.date || format(new Date(), 'yyyy-MM-dd'),
  });

  // Icon state management
  const [recurringIconData, setRecurringIconData] = useState({
    iconUrl: recurringIncome?.iconUrl || '',
    iconType: recurringIncome?.iconType || 'custom' as 'custom' | 'preset',
    presetIconId: recurringIncome?.presetIconId || ''
  });
  const [recurringIconFile, setRecurringIconFile] = useState<File | undefined>();
  
  const [oneTimeIconData, setOneTimeIconData] = useState({
    iconUrl: oneTimeIncome?.iconUrl || '',
    iconType: oneTimeIncome?.iconType || 'custom' as 'custom' | 'preset',
    presetIconId: oneTimeIncome?.presetIconId || ''
  });
  const [oneTimeIconFile, setOneTimeIconFile] = useState<File | undefined>();

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recurringFormData.name || !recurringFormData.amount || !recurringFormData.startDate) {
      
      return;
    }

    try {
      const data = {
        name: recurringFormData.name,
        amount: parseFloat(recurringFormData.amount),
        recurrence: recurringFormData.recurrence,
        startDate: recurringFormData.startDate,
        endDate: recurringFormData.endDate || undefined,
      };

      

      if (recurringIncome) {
        await updateRecurringIncome({ 
          ...recurringIncome, 
          ...data, 
          ...recurringIconData 
        }, recurringIconFile);
      } else {
        await addRecurringIncome({
          ...data,
          ...recurringIconData
        }, recurringIconFile);
      }

      handleClose();
    } catch (error) {
      console.error('Error saving recurring income:', error);
      alert('Error saving income: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleOneTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!oneTimeFormData.name || !oneTimeFormData.amount || !oneTimeFormData.date) {
      return;
    }

    try {
      const data = {
        name: oneTimeFormData.name,
        amount: parseFloat(oneTimeFormData.amount),
        date: oneTimeFormData.date,
      };

      if (oneTimeIncome) {
        await updateOneTimeIncome({ 
          ...oneTimeIncome, 
          ...data, 
          ...oneTimeIconData 
        }, oneTimeIconFile);
      } else {
        await addOneTimeIncome({
          ...data,
          ...oneTimeIconData
        }, oneTimeIconFile);
      }

      handleClose();
    } catch (error) {
      console.error('Error saving one-time income:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRecurringFormData({
      name: '',
      amount: '',
      recurrence: 'monthly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
    });
    setOneTimeFormData({
      name: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    onClose?.();
  };

  const handleDeleteRecurringIncome = async () => {
    if (!recurringIncome) return;
    
    try {
      await deleteRecurringIncome(recurringIncome.id);
      toast.success('Recurring income deleted');
      handleClose();
    } catch (error) {
      toast.error('Failed to delete income');
    }
  };

  const handleDeleteOneTimeIncome = async () => {
    if (!oneTimeIncome) return;
    
    try {
      await deleteOneTimeIncome(oneTimeIncome.id);
      toast.success('One-time income deleted');
      handleClose();
    } catch (error) {
      toast.error('Failed to delete income');
    }
  };

  const trigger = children || (
    <Button className="flex items-center gap-2">
      {(recurringIncome || oneTimeIncome) ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {(recurringIncome || oneTimeIncome) ? 'Edit Income' : 'Add Income'}
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
            {(recurringIncome || oneTimeIncome) ? 'Edit Income' : 'Add Income'}
          </DialogTitle>
        </DialogHeader>
        
        {!(recurringIncome || oneTimeIncome) ? (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                    placeholder="e.g., Bonus"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="onetime-amount">Amount (€)</Label>
                  <CurrencyInput
                    id="onetime-amount"
                    value={oneTimeFormData.amount}
                    onChange={(value) => setOneTimeFormData({ ...oneTimeFormData, amount: value })}
                    placeholder="0.00"
                    required
                  />
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
                  label="Income Icon (optional)"
                />

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Add One-time Income
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
                    placeholder="e.g., Salary"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="recurring-amount">Amount (€)</Label>
                  <CurrencyInput
                    id="recurring-amount"
                    value={recurringFormData.amount}
                    onChange={(value) => setRecurringFormData({ ...recurringFormData, amount: value })}
                    placeholder="0.00"
                    required
                  />
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
                  label="Income Icon (optional)"
                />

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Add Recurring Income
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
        ) : recurringIncome ? (
          <form onSubmit={handleRecurringSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-recurring-name">Name</Label>
              <Input
                id="edit-recurring-name"
                value={recurringFormData.name}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })}
                placeholder="e.g., Salary"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-recurring-amount">Amount (€)</Label>
              <CurrencyInput
                id="edit-recurring-amount"
                value={recurringFormData.amount}
                onChange={(value) => setRecurringFormData({ ...recurringFormData, amount: value })}
                placeholder="0.00"
                required
              />
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
              label="Income Icon (optional)"
            />

            <div className="flex flex-col gap-3">
              {/* Primary action button */}
              <Button type="submit" className="w-full h-12 sm:h-10 text-base sm:text-sm font-semibold">
                Update Income
              </Button>
              
              {/* Secondary actions row */}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="flex-1 h-12 sm:h-10 text-base sm:text-sm"
                >
                  Cancel
                </Button>
                {recurringIncome && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={handleDeleteRecurringIncome}
                    className="flex-1 h-12 sm:h-10 text-base sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
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
                placeholder="e.g., Bonus"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="edit-onetime-amount">Amount (€)</Label>
              <CurrencyInput
                id="edit-onetime-amount"
                value={oneTimeFormData.amount}
                onChange={(value) => setOneTimeFormData({ ...oneTimeFormData, amount: value })}
                placeholder="0.00"
                required
              />
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
              label="Income Icon (optional)"
            />

            <div className="flex flex-col gap-3">
              {/* Primary action button */}
              <Button type="submit" className="w-full h-12 sm:h-10 text-base sm:text-sm font-semibold">
                Update Income
              </Button>
              
              {/* Secondary actions row */}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="flex-1 h-12 sm:h-10 text-base sm:text-sm"
                >
                  Cancel
                </Button>
                {oneTimeIncome && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={handleDeleteOneTimeIncome}
                    className="flex-1 h-12 sm:h-10 text-base sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};