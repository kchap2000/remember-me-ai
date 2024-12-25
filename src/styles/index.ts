export * from './colors';
export * from './theme';
export * from './components';

// Utility for combining Tailwind classes conditionally
export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}