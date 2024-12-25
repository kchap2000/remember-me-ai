import { theme } from './theme';

export const components = {
  // Button variants
  button: {
    base: `
      inline-flex items-center justify-center
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      transform hover:-translate-y-0.5
      active:translate-y-0
    `,
    variants: {
      primary: `
        bg-accent-primary hover:bg-accent-secondary
        text-white font-medium
        shadow-md hover:shadow-lg hover:shadow-accent-primary/20
      `,
      secondary: `
        bg-bg-tertiary hover:bg-bg-secondary
        text-text-primary font-medium
        border border-border-subtle
        hover:border-border-default
      `
    },
    sizes: {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl'
    }
  },

  // Input variants
  input: {
    base: `
      w-full
      bg-bg-tertiary
      border border-border-default
      focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
      outline-none
      transition-all duration-200
    `,
    variants: {
      default: 'text-text-primary placeholder-text-tertiary',
      error: 'border-accent-error text-accent-error'
    },
    sizes: {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-4 py-3 text-lg rounded-lg'
    }
  },

  // Card variants
  card: {
    base: `
      bg-background-secondary/60 
      backdrop-blur-md
      border border-white/10
      transition-all duration-200
      shadow-lg hover:shadow-xl 
      transform hover:-translate-y-1
    `,
    variants: {
      default: 'rounded-2xl hover:border-border-default',
      elevated: 'rounded-3xl hover:border-border-default hover:bg-background-tertiary/70',
      surface: 'rounded-2xl hover:bg-surfaceLight/60'
    },
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    },
    states: {
      active: 'border-accent-primary/20',
      hover: 'hover:border-border-default hover:shadow-xl hover:shadow-accent-primary/10',
      disabled: 'opacity-50 cursor-not-allowed'
    }
  }
} as const;