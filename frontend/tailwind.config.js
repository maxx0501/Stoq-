/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- ADICIONADO PARA DARK MODE
  theme: {
    extend: {
      colors: {
        stoqBlue: '#2563eb',
        stoqBlack: '#0f172a',
      }
    },
  },
  plugins: [],
}