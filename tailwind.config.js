/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fsu: {
          white:   '#FAFAF8',
          surface: '#FFFFFF',
          soft:    '#F5F2EE',
          border:  '#E8E2D9',
          border2: '#D4CBB8',
          garnet:  '#782F40',
          garnet2: '#9a3d52',
          garnet3: '#5c2230',
          gold:    '#CEB069',
          gold2:   '#A07830',
          text:    '#1C1917',
          muted:   '#78716C',
          faint:   '#A8A29E',
        },
      },
      fontFamily: {
        syne: ['Syne', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
