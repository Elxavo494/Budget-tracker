'use client';

import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface FloatingInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, label, error, type = 'text', value, onChange, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(value && value.toString().length > 0);
    const isFloating = isFocused || hasValue;

    return (
      <div className="relative">
        <input
          type={type}
          ref={ref}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            'peer w-full h-14 px-4 pt-6 pb-2 text-base bg-background border rounded-lg transition-all duration-200',
            'border-input hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'placeholder-transparent',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className
          )}
          placeholder=" "
          {...props}
        />
        <label
          className={cn(
            'absolute left-4 text-muted-foreground transition-all duration-200 pointer-events-none',
            'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-muted-foreground',
            isFloating
              ? 'top-2 text-xs text-primary'
              : 'top-4 text-base text-muted-foreground',
            error && isFloating && 'text-destructive',
            'peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary'
          )}
        >
          {label}
        </label>
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
