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
import { useState, useEffect } from 'react';

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
      <div className={`max-w-[1680px] mx-auto mobile-padding transition-smooth ${isScrolled ? 'py-3' : 'py-6'}`}>
        <div className="flex justify-between items-center">
          <div className="text-left flex-1 min-w-0">
            <Link href="/">
              <h1 className={`
                font-bold text-foreground tracking-tight 
                hover:text-primary transition-smooth cursor-pointer
                ${isScrolled ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl'}
              `}>
                Finance Tracker
              </h1>
            </Link>
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
