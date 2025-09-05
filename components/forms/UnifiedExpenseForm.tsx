'use client';

import { useRef, useState } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FloatingInput } from '@/components/ui/floating-input';
import { FloatingSelect } from '@/components/ui/floating-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconSelector } from '@/components/ui/icon-selector';
import { Plus, Edit, Camera, Trash2 } from 'lucide-react';
import { RecurringExpense, OneTimeExpense, RecurrenceType } from '@/types';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { format } from 'date-fns';
import { extractReceiptFieldsFromImage } from '@/lib/receipt-ocr';
import { suggestCategory } from '@/lib/smart-categorization';
import { inferPresetIconId } from '@/lib/merchant-inference';
import toast from 'react-hot-toast';

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
  const { data, addRecurringExpense, updateRecurringExpense, addOneTimeExpense, updateOneTimeExpense, deleteRecurringExpense, deleteOneTimeExpense } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(recurringExpense ? 'recurring' : oneTimeExpense ? 'one-time' : 'one-time');

  // Sync form data when switching tabs
  const handleTabChange = (newTab: string) => {
    const currentTab = activeTab;
    
    // Only sync if we're not editing existing items
    if (!recurringExpense && !oneTimeExpense) {
      if (currentTab === 'one-time' && newTab === 'recurring') {
        // Moving from one-time to recurring - sync common fields
        setRecurringFormData(prev => ({
          ...prev,
          name: oneTimeFormData.name || prev.name,
          amount: oneTimeFormData.amount || prev.amount,
          categoryId: oneTimeFormData.categoryId || prev.categoryId,
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
          categoryId: recurringFormData.categoryId || prev.categoryId,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  
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

  const handleScanReceiptClick = () => {
    fileInputRef.current?.click();
  };

  const handleReceiptSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsScanning(true);
      const result = await extractReceiptFieldsFromImage(file);
      // Name/merchant
      const merchant = result.merchant?.trim();
      if (activeTab === 'one-time') {
        setOneTimeFormData(prev => ({
          ...prev,
          name: merchant && (!prev.name || prev.name.length < 2) ? merchant : prev.name,
          amount: typeof result.total === 'number' ? String(result.total.toFixed(2)) : prev.amount,
          date: result.date || prev.date,
        }));
        // Category inference
        const suggested = suggestCategory(merchant || oneTimeFormData.name, data.categories);
        if (suggested) {
          setOneTimeFormData(prev => ({ ...prev, categoryId: suggested.id }));
        }
        // Icon inference
        const iconId = inferPresetIconId(merchant || oneTimeFormData.name);
        if (iconId) {
          setOneTimeIconData(prev => ({ ...prev, iconType: 'preset', presetIconId: iconId }));
        }
      } else {
        setRecurringFormData(prev => ({
          ...prev,
          name: merchant && (!prev.name || prev.name.length < 2) ? merchant : prev.name,
          amount: typeof result.total === 'number' ? String(result.total.toFixed(2)) : prev.amount,
          startDate: result.date || prev.startDate,
        }));
        const suggested = suggestCategory(merchant || recurringFormData.name, data.categories);
        if (suggested) {
          setRecurringFormData(prev => ({ ...prev, categoryId: suggested.id }));
        }
        const iconId = inferPresetIconId(merchant || recurringFormData.name);
        if (iconId) {
          setRecurringIconData(prev => ({ ...prev, iconType: 'preset', presetIconId: iconId }));
        }
      }
    } catch (err) {
      console.error('Receipt OCR failed', err);
      alert('Could not read the receipt. You can still fill the form manually.');
    } finally {
      setIsScanning(false);
      // reset value so selecting the same file again triggers change
      if (e.target) e.target.value = '';
    }
  };

  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recurringFormData.name || !recurringFormData.amount || !recurringFormData.categoryId || !recurringFormData.startDate) {
      
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
      
      return;
    }

    try {
      const data = {
        name: oneTimeFormData.name,
        amount: parseFloat(oneTimeFormData.amount),
        categoryId: oneTimeFormData.categoryId,
        date: oneTimeFormData.date,
      };

      

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

  const handleDeleteRecurringExpense = async () => {
    if (!recurringExpense) return;
    
    try {
      await deleteRecurringExpense(recurringExpense.id);
      toast.success('Recurring expense deleted');
      handleClose();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleDeleteOneTimeExpense = async () => {
    if (!oneTimeExpense) return;
    
    try {
      await deleteOneTimeExpense(oneTimeExpense.id);
      toast.success('One-time expense deleted');
      handleClose();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
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
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-xl sm:text-2xl">
            {(recurringExpense || oneTimeExpense) ? 'Edit Expense' : 'Add Expense'}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            Snap a receipt to auto-fill details. You can adjust anything before saving.
          </DialogDescription>
        </DialogHeader>
        
        {!(recurringExpense || oneTimeExpense) ? (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 sm:h-10">
              <TabsTrigger value="one-time" className="text-base sm:text-sm font-medium">One-time</TabsTrigger>
              <TabsTrigger value="recurring" className="text-base sm:text-sm font-medium">Recurring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="one-time" className="mt-3">
              <form onSubmit={handleOneTimeSubmit} className="space-y-5 sm:space-y-6">

              <div className="w-full">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleScanReceiptClick} 
                    disabled={isScanning}
                    className="w-full h-12 text-base font-medium"
                  >
                    <Camera className="h-5 w-5 mr-3" /> 
                    {isScanning ? 'Scanning…' : 'Scan receipt'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleReceiptSelected}
                    className="hidden"
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                  <FloatingInput
                    id="onetime-name"
                    label="Name"
                    value={oneTimeFormData.name}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, name: e.target.value })}
                    required
                  />
                  <FloatingInput
                    id="onetime-amount"
                    label="Amount (€)"
                    type="number"
                    step="0.01"
                    value={oneTimeFormData.amount}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, amount: e.target.value })}
                    required
                  />
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <FloatingSelect
                        label="Category"
                        value={oneTimeFormData.categoryId}
                        onValueChange={(value) => setOneTimeFormData({ ...oneTimeFormData, categoryId: value })}
                      >
                        {data.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </FloatingSelect>
                    </div>
                    <CategoryForm>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="h-10 w-10 p-0 flex-shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CategoryForm>
                  </div>
                  <FloatingInput
                    id="onetime-date"
                    label="Date"
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

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full sm:flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold"
                  >
                    Add One-time Expense
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="recurring" className="mt-6">
              <form onSubmit={handleRecurringSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                  <FloatingInput
                    id="recurring-name"
                    label="Name"
                    value={recurringFormData.name}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })}
                    required
                  />
                  <FloatingInput
                    id="recurring-amount"
                    label="Amount (€)"
                    type="number"
                    step="0.01"
                    value={recurringFormData.amount}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                    required
                  />
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <FloatingSelect
                        label="Category"
                        value={recurringFormData.categoryId}
                        onValueChange={(value) => setRecurringFormData({ ...recurringFormData, categoryId: value })}
                      >
                        {data.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </FloatingSelect>
                    </div>
                    <CategoryForm>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm" 
                        className="h-10 w-10 p-0 flex-shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </CategoryForm>
                  </div>
                  <FloatingSelect
                    label="Recurrence"
                    value={recurringFormData.recurrence}
                    onValueChange={(value: string) => 
                      setRecurringFormData({ ...recurringFormData, recurrence: value as RecurrenceType })
                    }
                  >
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </FloatingSelect>
                  <FloatingInput
                    id="recurring-startDate"
                    label="Start Date"
                    type="date"
                    value={recurringFormData.startDate}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                    required
                  />
                  <FloatingInput
                    id="recurring-endDate"
                    label="End Date (Optional)"
                    type="date"
                    value={recurringFormData.endDate}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, endDate: e.target.value })}
                  />
                </div>

                <div className="w-full">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleScanReceiptClick} 
                    disabled={isScanning}
                    className="w-full h-12 text-base font-medium"
                  >
                    <Camera className="h-5 w-5 mr-3" /> 
                    {isScanning ? 'Scanning…' : 'Scan receipt'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleReceiptSelected}
                    className="hidden"
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

                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="w-full sm:flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold"
                  >
                    Add Recurring Expense
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        ) : recurringExpense ? (
          <form onSubmit={handleRecurringSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-5">
              <FloatingInput
                id="edit-recurring-name"
                label="Name"
                value={recurringFormData.name}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, name: e.target.value })}
                required
              />
              
              <FloatingInput
                id="edit-recurring-amount"
                label="Amount (€)"
                type="number"
                step="0.01"
                value={recurringFormData.amount}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                required
              />

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <FloatingSelect
                    label="Category"
                    value={recurringFormData.categoryId}
                    onValueChange={(value) => setRecurringFormData({ ...recurringFormData, categoryId: value })}
                  >
                    {data.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </FloatingSelect>
                </div>
                <CategoryForm>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    className="h-10 w-10 p-0 flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CategoryForm>
              </div>

              <FloatingSelect
                label="Recurrence"
                value={recurringFormData.recurrence}
                onValueChange={(value: RecurrenceType) => 
                  setRecurringFormData({ ...recurringFormData, recurrence: value })
                }
              >
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </FloatingSelect>

              <FloatingInput
                id="edit-recurring-startDate"
                label="Start Date"
                type="date"
                value={recurringFormData.startDate}
                onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                required
              />

              <FloatingInput
                id="edit-recurring-endDate"
                label="End Date (Optional)"
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

            <div className="flex flex-col gap-3 pt-2">
              {/* Primary action button */}
              <Button 
                type="submit" 
                className="w-full h-12 sm:h-10 text-base sm:text-sm font-semibold"
              >
                Update Expense
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
                {recurringExpense && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={handleDeleteRecurringExpense}
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
          <form onSubmit={handleOneTimeSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-5">
              <FloatingInput
                id="edit-onetime-name"
                label="Name"
                value={oneTimeFormData.name}
                onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, name: e.target.value })}
                required
              />
              
              <FloatingInput
                id="edit-onetime-amount"
                label="Amount (€)"
                type="number"
                step="0.01"
                value={oneTimeFormData.amount}
                onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, amount: e.target.value })}
                required
              />

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <FloatingSelect
                    label="Category"
                    value={oneTimeFormData.categoryId}
                    onValueChange={(value) => setOneTimeFormData({ ...oneTimeFormData, categoryId: value })}
                  >
                    {data.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </FloatingSelect>
                </div>
                <CategoryForm>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm" 
                    className="h-10 w-10 p-0 flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CategoryForm>
              </div>

              <FloatingInput
                id="edit-onetime-date"
                label="Date"
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

            <div className="flex flex-col gap-3 pt-2">
              {/* Primary action button */}
              <Button 
                type="submit" 
                className="w-full h-12 sm:h-10 text-base sm:text-sm font-semibold"
              >
                Update Expense
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
                {oneTimeExpense && (
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={handleDeleteOneTimeExpense}
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