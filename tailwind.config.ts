import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
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
          400: '#6ddcff',
          500: '#38c8f7',
          600: '#1da8dc',
          700: '#1588b3',
          800: '#166d90',
          900: '#175a77',
          950: '#0a3a50',
        },
        'craft-gray': {
          50: '#f5f5f8',
          100: '#ebebf0',
          200: '#d4d4dc',
          300: '#b0b0be',
          400: '#86869a',
          500: '#68687e',
          600: '#535368',
          700: '#444455',
          800: '#3a3a48',
          900: '#25252f',
          950: '#18181f',
        },
        'craft-pink': {
          50: '#fff0fb',
          100: '#ffe0f8',
          200: '#ffc2f2',
          300: '#ff94e6',
          400: '#ff58de',
          500: '#f025c8',
          600: '#d106a8',
          700: '#ab0088',
          800: '#8c046f',
          900: '#74095d',
          950: '#4a0037',
        },
      },
    },
  },
  plugins: [],
}
export default config
