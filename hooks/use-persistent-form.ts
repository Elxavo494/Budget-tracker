'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePersistentFormOptions<T> {
  key: string;
  initialData: T;
  clearOnSubmit?: boolean;
}

/**
 * Hook to persist form data in localStorage and automatically restore it
 * when the component mounts. Useful for preventing data loss when modals
 * are closed due to app switching or other interruptions.
 */
export function usePersistentForm<T extends Record<string, any>>({
  key,
  initialData,
  clearOnSubmit = true
}: UsePersistentFormOptions<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Merge with initial data to handle any new fields that might have been added
        setFormData({ ...initialData, ...parsedData });
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [key, initialData]);

  // Save to localStorage whenever formData changes (but only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      // Only save if there's meaningful data (not just empty fields)
      const hasData = Object.values(formData).some(value => {
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'boolean') return value !== false;
        return value != null && value !== '';
      });

      if (hasData) {
        localStorage.setItem(key, JSON.stringify(formData));
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to save form data to localStorage:', error);
    }
  }, [formData, key, isLoaded]);

  // Helper to update form data
  const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormData(prev => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  }, []);

  // Helper to clear form data
  const clearFormData = useCallback(() => {
    setFormData(initialData);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear persisted form data:', error);
    }
  }, [key, initialData]);

  // Helper to reset to initial data without clearing persistence
  const resetFormData = useCallback(() => {
    setFormData(initialData);
  }, [initialData]);

  return {
    formData,
    updateFormData,
    clearFormData,
    resetFormData,
    isLoaded,
    setFormData
  };
}
