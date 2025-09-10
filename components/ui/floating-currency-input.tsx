'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface FloatingCurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label: string;
  error?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  allowNegative?: boolean;
  maxDecimals?: number;
}

const FloatingCurrencyInput = forwardRef<HTMLInputElement, FloatingCurrencyInputProps>(
  ({ 
    className, 
    label, 
    error, 
    value, 
    onChange, 
    allowNegative = false, 
    maxDecimals = 2,
    onFocus,
    onBlur,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    
    const hasValue = Boolean(value && value.toString().length > 0);
    const isFloating = isFocused || hasValue;

    // Format number for display (with thousands separators)
    const formatForDisplay = (numStr: string): string => {
      if (!numStr || numStr === '') return '';
      
      // Parse the number
      const num = parseFloat(numStr);
      if (isNaN(num)) return numStr;
      
      // Format with thousands separators and up to maxDecimals
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      }).format(num);
    };

    // Clean input and convert to standard format
    const cleanInput = (input: string): string => {
      if (!input) return '';
      
      // Remove all characters except digits, commas, periods, and minus sign
      let cleaned = input.replace(/[^\d,.,-]/g, '');
      
      // Handle negative sign
      if (!allowNegative) {
        cleaned = cleaned.replace(/-/g, '');
      } else {
        // Only allow negative sign at the beginning
        const negative = cleaned.startsWith('-');
        cleaned = cleaned.replace(/-/g, '');
        if (negative) cleaned = '-' + cleaned;
      }
      
      // Replace comma with period for decimal separator (European style)
      // But first, we need to distinguish between thousands separator and decimal separator
      
      // If there are multiple commas or periods, treat the last one as decimal separator
      const lastCommaIndex = cleaned.lastIndexOf(',');
      const lastPeriodIndex = cleaned.lastIndexOf('.');
      
      let result = cleaned;
      
      // If both comma and period exist, the one that comes last is the decimal separator
      if (lastCommaIndex > -1 && lastPeriodIndex > -1) {
        if (lastCommaIndex > lastPeriodIndex) {
          // Comma is decimal separator, remove all periods and convert comma to period
          result = cleaned.replace(/\./g, '').replace(/,/g, '.');
        } else {
          // Period is decimal separator, remove all commas
          result = cleaned.replace(/,/g, '');
        }
      } else if (lastCommaIndex > -1) {
        // Only comma exists - treat as decimal separator if it has 1-3 digits after it
        const afterComma = cleaned.substring(lastCommaIndex + 1);
        if (afterComma.length <= 3 && !/[,.]/.test(afterComma)) {
          // Likely decimal separator
          result = cleaned.replace(/,/g, '.');
        } else {
          // Likely thousands separator, remove it
          result = cleaned.replace(/,/g, '');
        }
      }
      // If only periods exist, they're already correct
      
      // Ensure only one decimal point
      const parts = result.split('.');
      if (parts.length > 2) {
        result = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit decimal places
      if (parts.length === 2 && parts[1].length > maxDecimals) {
        result = parts[0] + '.' + parts[1].substring(0, maxDecimals);
      }
      
      return result;
    };

    // Update display value when external value changes
    useEffect(() => {
      if (value !== undefined) {
        const stringValue = value.toString();
        if (isFocused) {
          // When focused, show the raw editable value
          setDisplayValue(stringValue);
        } else {
          // When not focused, show formatted value
          setDisplayValue(formatForDisplay(stringValue));
        }
      } else {
        setDisplayValue('');
      }
    }, [value, isFocused, maxDecimals]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const cleanedValue = cleanInput(rawValue);
      
      setDisplayValue(rawValue); // Show what user typed
      onChange?.(cleanedValue); // Pass cleaned value to parent
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // When focusing, show the raw numeric value without formatting
      if (value !== undefined && value !== '') {
        setDisplayValue(value.toString());
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // When blurring, format the display value
      if (value !== undefined && value !== '') {
        setDisplayValue(formatForDisplay(value.toString()));
      }
      onBlur?.(e);
    };

    return (
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'peer w-full h-14 px-4 pt-6 pb-2 text-base bg-background border rounded-lg transition-all duration-200',
            'border-input hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'placeholder-transparent',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className
          )}
          placeholder=" "
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

FloatingCurrencyInput.displayName = 'FloatingCurrencyInput';

export { FloatingCurrencyInput };
