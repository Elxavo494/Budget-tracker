'use client';

import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string | number;
  onChange?: (value: string) => void;
  allowNegative?: boolean;
  maxDecimals?: number;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    className, 
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
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
