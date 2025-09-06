'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
};

const sanitizeValue = (value?: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, style, ...props }, ref) => {
    const safeValue = sanitizeValue(value);

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${safeValue}%`,
            // Default to the app's primary purple→yellow gradient; allow override via --progress-gradient
            background: `var(--progress-gradient, linear-gradient(135deg, #8b5cf6 0%, #ec4899 25%, #f97316 75%, #eab308 100%))`,
          } as React.CSSProperties}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress as default };
