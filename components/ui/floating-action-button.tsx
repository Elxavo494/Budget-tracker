'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface FloatingActionButtonProps {
  children: React.ReactNode;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      <div className={cn(
        "flex flex-col-reverse items-end gap-2.5 sm:gap-3 transition-all duration-300 ease-out",
        isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95 pointer-events-none",
        className
      )}>
        {children}
      </div>
      <Button
        variant="ghost"
        size="lg"
        className={cn(
          "w-12 h-12 sm:w-14 sm:h-14 rounded-full border-0",
          "bg-black/5 dark:bg-white/5 backdrop-blur-sm",
          "shadow-none",
          "hover:bg-black/10 dark:hover:bg-white/10",
          "hover:scale-102 active:scale-98",
          "transition-all duration-200 ease-out",
          "group"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="relative">
          {isOpen ? (
            <X className="h-4 w-4 text-slate-600/70 dark:text-slate-400/70 transition-all duration-200" />
          ) : (
            <Plus className="h-4 w-4 text-slate-600/70 dark:text-slate-400/70 transition-all duration-200 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
          )}
        </div>
      </Button>
    </div>
  );
};

export const FloatingActionItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className }) => {
  return (
    <div
      className={cn(
        "relative group cursor-pointer",
        "bg-black/5 dark:bg-white/5 backdrop-blur-sm",
        "border-0",
        "rounded-full shadow-none",
        "hover:bg-black/10 dark:hover:bg-white/10",
        "hover:scale-102 active:scale-98",
        "transition-all duration-200 ease-out",
        "min-w-[40px] min-h-[40px] sm:min-w-[48px] sm:min-h-[48px]",
        "flex items-center justify-center",
        className
      )}
      onClick={onClick}
    >
      <div className="transition-all duration-200 group-hover:scale-105 opacity-70 group-hover:opacity-100">
        {children}
      </div>
    </div>
  );
};