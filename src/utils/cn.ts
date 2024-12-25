/**
 * Combines class names conditionally
 * @param classes Array of class names, booleans, or undefined values
 * @returns Combined class names string
 */
export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}