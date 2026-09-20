/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cmc: {
          blue: '#3861FB',
          dark: '#0B1426',
          card: '#111D38',
          border: '#223560',
          accent: '#16C784',
          danger: '#EA3943',
          warning: '#F3B42F',
        },
      },
    },
  },
  plugins: [],
};
