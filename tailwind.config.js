/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#792f40",
        "accent-gold": "#CEB069",
        "background-light": "#f8f6f6",
        "background-dark": "#0a0f1a",
        // Keep some existing colors for backward compatibility during refactoring if needed,
        // but prefer the ones above.
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
        "display": ["Manrope", "sans-serif"],
        "sans": ["Manrope", "sans-serif"],
      },
      borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px"},
    },
  },
  plugins: [],
};
