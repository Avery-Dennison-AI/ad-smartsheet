import { clsx, type ClassValue } from 'clsx';
import { twMerge, extendTailwindMerge } from 'tailwind-merge';

/**
 * Extended merge config that registers custom font-size classes (text-md, text-2xs)
 * so overrides merge correctly instead of stacking.
 */
const customTwMerge = extendTailwindMerge({
  override: {
    classGroups: {
      'font-size': [
        { text: ['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xs'] },
      ],
    },
  },
});

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
  return customTwMerge(clsx(inputs));
}
