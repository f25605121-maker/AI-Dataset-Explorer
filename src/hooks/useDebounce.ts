'use client';

import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Delays updating the debounced value until after the specified delay has elapsed
 * since the last time the value was changed.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
