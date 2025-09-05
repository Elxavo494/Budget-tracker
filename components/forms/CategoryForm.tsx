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
  // Reds
  '#ef4444', '#b91c1c', '#991b1b', 
  // Oranges
  '#f97316', '#ea580c', '#c2410c',
  // Yellows
  '#f59e0b', '#eab308', '#ca8a04', '#a16207',
  // Greens
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#059669', '#047857', '#065f46', '#16a34a',
  // Blues
  '#06b6d4', '#0ea5e9', '#3b82f6', '#2563eb',
  '#1d4ed8', '#1e40af', '#1e3a8a', '#0284c7',
  // Purples
  '#8b5cf6', '#a855f7', '#9333ea', '#7c3aed',
  '#6d28d9', '#5b21b6', '#581c87', '#6366f1',
  // Pinks
  '#d946ef', '#ec4899', '#be185d', '#9d174d',
  '#831843', '#db2777', '#c026d3', '#a21caf',
  // Grays
  '#6b7280', '#4b5563', '#374151', '#1f2937',
  '#111827', '#9ca3af', '#d1d5db', '#e5e7eb',
  // Additional vibrant colors
  '#f43f5e', '#06d6a0', '#118ab2', '#073b4c',
  '#ffd166', '#ef476f', '#06ffa5', '#1b9aaa'
];

export const CategoryForm: React.FC<CategoryFormProps> = ({ 
  category, 
  onClose,
  children 
}) => {
  const { data, addCategory, updateCategory } = useSupabaseFinance();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || categoryColors[0],
  });

  // Get colors that are already used by other categories
  const usedColors = data.categories
    .filter(cat => category ? cat.id !== category.id : true) // Exclude current category when editing
    .map(cat => cat.color);

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
            <div className="grid grid-cols-10 gap-2 mt-2">
              {categoryColors.map((color) => {
                const isUsed = usedColors.includes(color);
                const isSelected = formData.color === color;
                
                return (
                  <button
                    key={color}
                    type="button"
                    disabled={isUsed}
                    className={`w-7 h-7 rounded-full transition-all relative ${
                      isSelected 
                        ? 'border-2 border-white scale-110' 
                        : isUsed 
                          ? 'opacity-20 cursor-not-allowed grayscale' 
                          : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => !isUsed && setFormData({ ...formData, color })}
                    title={isUsed ? 'Color already in use' : ''}
                  >
                    {isUsed && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-0.5 bg-gray-100 transform rotate-45"></div>
                      </div>
                    )}
                  </button>
                );
              })}
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