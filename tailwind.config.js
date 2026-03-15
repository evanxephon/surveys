/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        soot: '#12100f',
        charcoal: '#1f1a17',
        parchment: '#c8b38a',
        ember: '#7b2d26',
        wine: '#4c1615',
        fog: '#d9d2c6',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
      },
      boxShadow: {
        glow: '0 30px 80px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        grain:
          'radial-gradient(circle at 20% 20%, rgba(200,179,138,0.08), transparent 0 24%), radial-gradient(circle at 80% 0%, rgba(123,45,38,0.14), transparent 0 28%), radial-gradient(circle at 10% 90%, rgba(255,255,255,0.04), transparent 0 16%), linear-gradient(135deg, rgba(18,16,15,0.98), rgba(31,26,23,0.95))',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -10px, 0)' },
        },
      },
      animation: {
        drift: 'drift 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
