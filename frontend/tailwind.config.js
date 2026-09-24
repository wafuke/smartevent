/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      colors: {
        strathmore: {
          navy: '#002B49',
          gold: '#EAA11B',
          blue: '#005596',
        }
      }
    },
  },
  plugins: [],
}
