/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        void:         '#080808',
        surface:      '#111111',
        surface2:     '#1a1a1a',
        gold:         '#c9a84c',
        'gold-light': '#e0bc6e',
        'gold-dark':  '#a8873a',
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-gold':   'linear-gradient(135deg, #c9a84c, #e0bc6e)',
        'gradient-dark':   'linear-gradient(180deg, #080808, #111111)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      animation: {
        float:        'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-up':   'slideUp 0.6s ease-out forwards',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-18px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201,168,76,0.2)' },
          '50%':      { boxShadow: '0 0 45px rgba(201,168,76,0.5)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      boxShadow: {
        gold:     '0 0 30px rgba(201,168,76,0.3)',
        'gold-lg':'0 0 60px rgba(201,168,76,0.4)',
        glass:    '0 8px 32px rgba(0,0,0,0.4)',
        card:     '0 4px 24px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
