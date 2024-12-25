// Animation keyframes and durations
export const keyframes = {
  fadeInOut: {
    from: { opacity: 0 },
    '50%': { opacity: 1 },
    to: { opacity: 0 }
  },
  slideUp: {
    from: { transform: 'translateY(4px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 }
  }
} as const;

export const durations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  verySlow: '500ms'
} as const;

export const easings = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
} as const;