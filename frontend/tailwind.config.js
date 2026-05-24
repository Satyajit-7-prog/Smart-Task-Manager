/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#070a13',     // Deep slate canvas
          card: 'rgba(17, 24, 39, 0.7)', // Glassmorphism card default
          teal: '#06b6d4',     // Primary accent: Neon Teal
          purple: '#a855f7',   // Secondary accent: Neon Purple
          blue: '#3b82f6',
          green: '#10b981',
          orange: '#f59e0b',
          pink: '#ec4899',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
