/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0D0E11',
          surface: '#16181E',
          card: '#1F222A',
          border: '#2A2E39',
          gold: '#C5A880',
          'gold-light': '#E2CEB5',
          emerald: '#10B981',
          danger: '#EF4444',
          muted: '#9CA3AF',
        }
      }
    },
  },
  plugins: [],
}
