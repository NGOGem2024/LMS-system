/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4dabf5',
          main: '#1976d2',
          dark: '#1565c0',
          contrastText: '#ffffff',
        },
        secondary: {
          light: '#f5f5f5',
          main: '#9e9e9e',
          dark: '#616161',
          contrastText: '#ffffff',
        },
        error: {
          light: '#e57373',
          main: '#f44336',
          dark: '#d32f2f',
          contrastText: '#ffffff',
        },
        warning: {
          light: '#ffb74d',
          main: '#ff9800',
          dark: '#f57c00',
          contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        success: {
          light: '#81c784',
          main: '#4caf50',
          dark: '#388e3c',
          contrastText: 'rgba(0, 0, 0, 0.87)',
        },
        background: {
          paper: '#ffffff',
          default: '#f5f5f5',
          dark: '#121212',
        },
        text: {
          primary: 'rgba(0, 0, 0, 0.87)',
          secondary: 'rgba(0, 0, 0, 0.6)',
          disabled: 'rgba(0, 0, 0, 0.38)',
          primaryDark: 'rgba(255, 255, 255, 0.87)',
          secondaryDark: 'rgba(255, 255, 255, 0.6)',
        },
      },
      spacing: {
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        DEFAULT: '8px',
        'md': '12px',
        'lg': '16px',
        'full': '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
} 