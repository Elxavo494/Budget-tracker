'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FloatingSelectProps {
  label: string;
  value: string;
  onValueChange: (value: any) => void;
  placeholder?: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
  children,
  error,
  className,
  disabled = false
}) => {
  const hasValue = Boolean(value && value.length > 0);

  return (
    <div className="relative">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'w-full h-14 px-4 pt-6 pb-2 text-base bg-background border rounded-lg transition-all duration-200',
            'border-input hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className
          )}
        >
          <SelectValue placeholder=" " />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      <label
        className={cn(
          'absolute left-4 text-muted-foreground transition-all duration-200 pointer-events-none',
          hasValue
            ? 'top-2 text-xs text-primary'
            : 'top-4 text-base text-muted-foreground',
          error && hasValue && 'text-destructive'
        )}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};
