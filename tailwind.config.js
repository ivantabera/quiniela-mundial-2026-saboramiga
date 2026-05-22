/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Terracota — acciones primarias, identidad
        brand: {
          50:  '#fef7f4',
          100: '#fde9e0',
          200: '#f9cfbc',
          300: '#f2ae92',
          400: '#e8906c',
          500: '#D38264',
          600: '#b86448',
          700: '#974e38',
          800: '#7c3d2c',
          900: '#663225',
        },
        // Azul — fondos digitales, estructura
        pitch: {
          50:  '#f0f3fd',
          100: '#dde5fa',
          200: '#c0cdf5',
          300: '#96aced',
          400: '#7a90d8',
          500: '#5e74c4',
          600: '#4557ad',
          700: '#2e3f90',
          800: '#1e2e7a',
          900: '#142268',
          950: '#0c1545',
        },
        // Verde — acentos y líneas divisorias
        verde: {
          400: '#8a9c52',
          500: '#6B7A3E',
          600: '#596833',
          700: '#475428',
        },
        // Crema — texto suave, fondos neutros
        crema: {
          100: '#fdf8f0',
          200: '#F5EDD8',
          300: '#e8dcc0',
          400: '#d4c49e',
          500: '#b8a47e',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
      },
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
        'fade-in':       'fadeIn 0.5s ease-in-out',
        'slide-up':      'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                                    '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' },     '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
