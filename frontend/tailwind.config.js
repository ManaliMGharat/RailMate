/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rail: {
          navy: '#1B254B',
          'navy-light': '#334155',
          blue: '#1A56DB',
          'blue-dark': '#1E40AF',
          'blue-light': '#EBF5FF',
          accent: '#2563EB',
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          // Service tile pastel backgrounds
          'tile-pink': '#FDF2F8',
          'tile-green': '#F0FDF4',
          'tile-blue': '#EFF6FF',
          'tile-yellow': '#FEF9C3',
          'tile-purple': '#F5F3FF',
          'tile-gray': '#F3F4F6',
          'tile-coral': '#FFF1F2',
          'tile-indigo': '#EEF2FF',
          'tile-navy': '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
        'floating': '0 10px 25px -5px rgba(26, 86, 219, 0.25)',
      }
    },
  },
  plugins: [],
}
