import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class strings, resolving conflicts in favour of the LAST one:
 * cn('p-2', 'p-4') -> 'p-4'. That is what lets a caller's `className` override
 * a component's defaults.
 *
 * Use this in EVERY component that accepts a `className` prop. Plain template
 * concatenation (`p-2 ${className}`) leaves BOTH classes in the string, so which
 * one wins depends on CSS source order rather than on the caller.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
