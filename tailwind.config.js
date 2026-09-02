/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#fff2ed',
          100: '#ffe0d4',
          200: '#ffbda5',
          300: '#ff906c',
          400: '#ff6335',
          500: '#f04400',
          600: '#d83200',
          700: '#b62800',
          800: '#92240b',
          900: '#78210f',
          950: '#430b03',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
