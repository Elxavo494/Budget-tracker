'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

// Logo dimensions
const LOGO_SIZES = {
  normal: { width: 60, height: 30 },
  scrolled: { width: 40, height: 20 }
} as const;

export const Header: React.FC = () => {
  const { user, signOut, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  // Only render header for authenticated users
  if (!user) {
    return null;
  }

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50 transition-smooth
      ${isScrolled 
        ? 'glass-card shadow-sm' 
        : 'gradient-background border-b border-border'
      }
    `}>
      <div className={`max-w-[1680px] mx-auto mobile-padding transition-smooth ${isScrolled ? 'py-3' : 'py-4'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-1 min-w-0">
            <Link 
              href="/" 
              className="inline-block hover:opacity-80 transition-opacity duration-200 ease-in-out"
            >
              <Image
                src="/images/logo.png"
                alt="Finance Tracker Logo"
                width={LOGO_SIZES.normal.width}
                height={LOGO_SIZES.normal.height}
                className="object-contain transition-all duration-300 ease-in-out"
                style={{
                  width: isScrolled ? `${LOGO_SIZES.scrolled.width}px` : `${LOGO_SIZES.normal.width}px`,
                  height: isScrolled ? `${LOGO_SIZES.scrolled.height}px` : `${LOGO_SIZES.normal.height}px`
                }}
                priority
              />
            </Link>
            <div className="flex flex-col leading-tight min-w-0">
              <span className={`${isScrolled ? 'text-xs' : 'text-sm'} font-semibold text-slate-900 dark:text-slate-100 truncate uppercase`}>
               <b>Finance Tracker</b>
              </span>
              <span className={`${isScrolled ? 'text-xs' : 'text-xs'} text-slate-600 dark:text-slate-400 truncate`}>
                Track your expenses
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 py-1 h-auto focus-modern"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} alt="Profile picture" />
                    <AvatarFallback className="text-xs bg-slate-200 dark:bg-slate-700">
                      {user ? getInitials(profile?.full_name, user.email ?? null) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[120px] hidden sm:block">
                    {profile?.full_name || user.email}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Account Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme} className="flex items-center gap-2 cursor-pointer">
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
