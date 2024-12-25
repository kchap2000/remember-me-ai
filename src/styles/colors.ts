// Base Colors
export const colors = {
  // Background Colors
  background: {
    primary: '#1A1A1E',     // Deep charcoal
    secondary: '#232328',   // Rich gray
    tertiary: '#2A2A32',    // Interactive elements
    surfaceLight: '#34343E', // Active states
    gradient: {
      from: '#8B8177',      // Warm gray
      via: '#AFA699',       // Medium warm gray
      to: '#C9C2B7'         // Light warm gray
    }
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: '#E6E6EB',
    tertiary: '#B0B0BA',
  },

  // Accent Colors
  accent: {
    primary: '#4B23E8',     // Brighter purple
    secondary: '#6D4AE6',   // Hover state
    success: '#38D399',
    warning: '#F6B83C',
    error: '#F04444',
  },

  // Border Colors
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.12)',
    focus: 'rgba(255, 255, 255, 0.24)',
  },

  // Shadow Colors
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
    md: '0 4px 16px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(138, 129, 127, 0.2)',
  }
} as const;

// Gradient Definitions
export const gradients = {
  background: `linear-gradient(135deg, 
    ${colors.background.gradient.from} 0%,
    ${colors.background.gradient.via} 50%,
    ${colors.background.gradient.to} 100%
  )`,
  
  surfaceHover: `linear-gradient(180deg,
    ${colors.background.secondary} 0%,
    ${colors.background.tertiary} 100%
  )`,

  accentHover: `linear-gradient(180deg,
    ${colors.accent.primary} 0%,
    ${colors.accent.secondary} 100%
  )`
} as const;