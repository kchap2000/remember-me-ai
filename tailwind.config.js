/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Scrollbar styles
      scrollbar: {
        thin: 'thin',
        thumb: 'thumb',
        track: 'track',
      },
     // Screen sizes
     screens: {
       'xs': '360px',
       'sm': '640px',
       'md': '768px',
       'lg': '1024px',
       'xl': '1280px',
       '2xl': '1536px'
     },
      // Colors
      colors: {
        background: {
          primary: '#1A1A1E',
          secondary: '#232328',
          tertiary: '#2A2A32',
          surfaceLight: '#34343E',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#E6E6EB',
          tertiary: '#B0B0BA',
        },
        accent: {
          primary: '#4B23E8',
          secondary: '#6D4AE6',
          success: '#38D399',
          warning: '#F6B83C',
          error: '#F04444',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          default: 'rgba(255, 255, 255, 0.12)',
          focus: 'rgba(255, 255, 255, 0.24)',
        },
      },

      // Gradients
      backgroundImage: {
        'gradient-page':
          'linear-gradient(135deg, #8B8177 0%, #AFA699 50%, #C9C2B7 100%)',
        'gradient-surface':
          'linear-gradient(180deg, #232328 0%, #2A2A32 100%)',
        'gradient-accent':
          'linear-gradient(180deg, #4B23E8 0%, #6D4AE6 100%)',
      },

      // Box Shadows
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.2)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.25)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.35)',
       'mobile': '0 -2px 10px rgba(0, 0, 0, 0.1)',
        'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 24px rgba(75, 35, 232, 0.15)',
        'glow-strong': '0 0 32px rgba(75, 35, 232, 0.25)'
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'fade-in-up': 'fadeInUp 300ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeInUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      },
      textShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.4)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.6)',
        'lg': '0 4px 8px rgba(0, 0, 0, 0.8)'
      }
    },
  },
  plugins: [
    // Add scrollbar plugin
    require('tailwindcss-scrollbar'),
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-sm': {
          'text-shadow': '0 1px 2px rgba(0, 0, 0, 0.4)'
        },
        '.text-shadow-md': {
          'text-shadow': '0 2px 4px rgba(0, 0, 0, 0.6)'
        },
        '.text-shadow-lg': {
          'text-shadow': '0 4px 8px rgba(0, 0, 0, 0.8)'
        }
      };
      addUtilities(newUtilities);
    }
  ],
};