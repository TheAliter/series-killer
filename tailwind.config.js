/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#f6f1e8',
        'paper-dark': '#ebe4d6',
        ink: '#2c2824',
        'ink-muted': '#6b6459',
        'editorial-accent': '#8b7355',
        bookmark: '#c4a574',
        'card-cream': '#fffef9',
        primary: {
          50: '#f8f7fa',
          100: '#f0eef3',
          200: '#e1dde8',
          300: '#c8c0d1',
          400: '#b8a9c9',
          500: '#a895b8',
          600: '#967fa6',
          700: '#7f6a8f',
          800: '#6a5a77',
          900: '#5a4d64',
        },
        secondary: {
          50: '#fdfbf7',
          100: '#faf6ed',
          200: '#f4ead4',
          300: '#ecd8b0',
          400: '#e2c285',
          500: '#d4a574',
          600: '#c68f5a',
          700: '#b0754a',
          800: '#8f5f3f',
          900: '#754f36',
        },
        accent: {
          50: '#f4f8f2',
          100: '#e8f1e4',
          200: '#d1e3c9',
          300: '#a8d5ba',
          400: '#7bc18a',
          500: '#5aa86b',
          600: '#478a55',
          700: '#3b6e46',
          800: '#32573a',
          900: '#2a4730',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      boxShadow: {
        editorial: '0 4px 24px rgba(44, 40, 36, 0.06)',
        'editorial-btn': '0 2px 12px rgba(44, 40, 36, 0.12)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
