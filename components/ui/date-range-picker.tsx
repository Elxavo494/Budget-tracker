'use client';

import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

interface DateRangePickerProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  presets?: DateRange[];
  className?: string;
}

const defaultPresets: DateRange[] = [
  {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
    label: 'This Month'
  },
  {
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1)),
    label: 'Last Month'
  },
  {
    from: startOfMonth(subMonths(new Date(), 2)),
    to: endOfMonth(new Date()),
    label: 'Last 3 Months'
  },
  {
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
    label: 'Last 6 Months'
  },
  {
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
    label: 'This Year'
  }
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedRange,
  onRangeChange,
  presets = defaultPresets,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customRange, setCustomRange] = useState<{from?: Date; to?: Date}>({});

  const handlePresetSelect = (preset: DateRange) => {
    onRangeChange(preset);
    setIsOpen(false);
  };

  const handleCustomRangeSelect = (range: {from?: Date; to?: Date}) => {
    setCustomRange(range);
    if (range.from && range.to) {
      onRangeChange({
        from: range.from,
        to: range.to,
        label: `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
      });
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 font-normal text-left",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>{selectedRange.label}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="p-0">
          {/* Presets only */}
          <div className="p-2">
            {presets.map((preset, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start text-sm h-9 px-3 mb-1",
                  selectedRange.label === preset.label && "bg-accent text-accent-foreground"
                )}
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
