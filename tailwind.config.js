/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          300: '#ffb184',
          400: '#ff9257',
          500: '#ff7a2e',
          600: '#e8631a',
          700: '#c04e12',
          800: '#9a3e0e',
          900: '#7a320b',
        },
        navy: {
          DEFAULT: '#0d1120',
        },
      },
    },
  },
  plugins: [],
};
