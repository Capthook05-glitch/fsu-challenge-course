/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        fsu: {
          navy:    '#0a0f1a',
          bg2:     '#0f1729',
          bg3:     '#162035',
          border:  '#1e2d45',
          border2: '#2a3f5f',
          garnet:  '#782F40',
          garnet2: '#a03d52',
          gold:    '#CEB069',
          gold2:   '#e8c97a',
          muted:   '#7a90b0',
          faint:   '#3a4f6a',
        }
      },
      fontFamily: {
        syne: ['Syne', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
};
