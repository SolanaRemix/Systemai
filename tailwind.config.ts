import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './systemai/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        accent: '#22d3ee',
        success: '#22c55e',
        danger: '#ef4444'
      }
    }
  },
  plugins: []
} satisfies Config;
