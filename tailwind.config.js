/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        // Neutral dark base with opacity variants
        'surface': {
          50: 'rgba(248, 250, 252, 0.02)',
          100: 'rgba(241, 245, 249, 0.03)',
          200: 'rgba(226, 232, 240, 0.05)',
          300: 'rgba(203, 213, 225, 0.08)',
          400: 'rgba(148, 163, 184, 0.10)',
          500: 'rgba(100, 116, 139, 0.12)',
          600: 'rgba(71, 85, 105, 0.15)',
          700: 'rgba(51, 65, 85, 0.20)',
          800: 'rgba(30, 41, 59, 0.25)',
          900: 'rgba(15, 23, 42, 0.30)',
        },
        // Blue accent with glow variants
        'accent': {
          50: 'rgba(239, 246, 255, 0.05)',
          100: 'rgba(219, 234, 254, 0.08)',
          200: 'rgba(191, 219, 254, 0.12)',
          300: 'rgba(147, 197, 253, 0.15)',
          400: 'rgba(96, 165, 250, 0.20)',
          500: 'rgba(59, 130, 246, 0.25)',
          600: 'rgba(37, 99, 235, 0.30)',
          700: 'rgba(29, 78, 216, 0.35)',
          800: 'rgba(30, 64, 175, 0.40)',
          900: 'rgba(30, 58, 138, 0.45)',
        },
        // Glassmorphic surface colors
        'glass': {
          'light': 'rgba(255, 255, 255, 0.04)',
          'medium': 'rgba(255, 255, 255, 0.06)',
          'strong': 'rgba(255, 255, 255, 0.10)',
          // Use a slate-tinted, lower-contrast border to avoid bright white lines
          // Significantly softer default border used across components
          'border': 'rgba(148, 163, 184, 0.10)',
        }
      },
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.20)',
        'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.50)',
        'elevation-1': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-blue-sm': '0 0 10px rgba(59, 130, 246, 0.2)',
      },
      letterSpacing: {
        'tight': '-0.025em',
        'tighter': '-0.05em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
        },
      },
    },
  },
  plugins: [],
} 