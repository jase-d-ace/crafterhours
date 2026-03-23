import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'craft-blue': {
          50: '#f0fcff',
          100: '#e0f8ff',
          200: '#ccf6ff',
          300: '#a3ecff',
          400: '#6bddff',
          500: '#33c9ff',
          600: '#0eaee6',
          700: '#0889b8',
          800: '#066a8f',
          900: '#044d68',
          950: '#022f42',
        },
        'craft-gray': {
          50: '#f5f5f8',
          100: '#ebebf0',
          200: '#d4d4dc',
          300: '#b0b0bc',
          400: '#8a8a98',
          500: '#6b6b7a',
          600: '#545463',
          700: '#41414d',
          800: '#2c2c35',
          900: '#1c1c23',
          950: '#111116',
        },
        'craft-pink': {
          50: '#fff0fb',
          100: '#ffe0f7',
          200: '#ffc2ef',
          300: '#ff94e3',
          400: '#ff58de',
          500: '#e63cc5',
          600: '#c224a3',
          700: '#9c1b82',
          800: '#7a1666',
          900: '#5c1150',
          950: '#3a0a32',
        },
      },
    },
  },
  plugins: [],
}
export default config
