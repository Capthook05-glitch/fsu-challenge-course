/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fsu: {
          garnet: '#782F40',
          gold: '#CEB069',
          navy: '#0a0f1a'
        }
      }
    }
  },
  plugins: []
};
