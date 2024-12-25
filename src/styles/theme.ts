import { colors, gradients } from './colors';

export const theme = {
  colors,
  gradients,
  
  typography: {
    headings: {
      h1: 'text-4xl font-black tracking-tight',
      h2: 'text-2xl font-bold tracking-tight',
      h3: 'text-xl font-semibold',
      h4: 'text-lg font-medium'
    },
    body: {
      large: 'text-lg leading-relaxed',
      base: 'text-base leading-relaxed',
      small: 'text-sm leading-relaxed'
    }
  },

  surfaces: {
    primary: {
      background: 'bg-background-primary/95 backdrop-blur-sm',
      border: 'border-border-subtle',
      hover: 'hover:bg-background-secondary/95 hover:shadow-lg transition-all duration-200'
    },
    secondary: {
      background: 'bg-background-secondary/60 backdrop-blur-md',
      border: 'border-white/10',
      hover: 'hover:bg-background-tertiary/60 hover:shadow-xl transition-all duration-200'
    }
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '2.5rem',  // 40px
    '3xl': '3rem'     // 48px
  },

  typography: {
    fonts: {
      primary: 'Epilogue, sans-serif',
      secondary: '"Noto Sans", sans-serif'
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem' // 30px
    },
    lineHeights: {
      tight: '1.25',
      base: '1.5',
      relaxed: '1.75'
    }
  },

  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.15)',
    md: '0 4px 8px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    glow: '0 0 16px rgba(75, 139, 244, 0.2)'
  },

  transitions: {
    durations: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms'
    },
    timings: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  },

  borderRadius: {
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    full: '9999px'
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
} as const;