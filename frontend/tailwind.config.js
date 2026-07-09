/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#f97316', // Vibrant Orange
        'up-police-blue': '#002855', // Navy Blue
        'up-police-red': '#E31837', // Police Red
        'dashboard-dark': '#0f172a', // Slate 900
        'dashboard-card': '#1e293b', // Slate 800
      }
    },
  },
  plugins: [],
}
