'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Settings } from 'lucide-react';
import { Category } from '@/types';
import { useSupabaseFinance } from '@/contexts/SupabaseFinanceContext';

interface CategoryFormProps {
  category?: Category;
  onClose?: () => void;
  children?: React.ReactNode;
}

const categoryColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', 
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', 
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', 
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

export const CategoryForm: React.FC<CategoryFormProps> = ({ 
  category, 
  onClose,
  children 
}) => {
  const { addCategory, updateCategory } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || categoryColors[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      return;
    }

    try {
      if (category) {
        await updateCategory({ ...category, ...formData });
      } else {
        await addCategory(formData);
      }

      setOpen(false);
      setFormData({
        name: '',
        color: categoryColors[0],
      });
      onClose?.();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const trigger = children || (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      {category ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {category ? 'Edit' : 'Add Category'}
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
            {category ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Entertainment"
              required
            />
          </div>
          
          <div>
            <Label>Color</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {categoryColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {category ? 'Update' : 'Add'} Category
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