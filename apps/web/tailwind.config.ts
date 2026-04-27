import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      colors: {
        quas: '#4cc9ff',
        wex: '#b066ff',
        exort: '#ff7a1a',
      },
      animation: {
        'orb-float': 'orb-float 6s ease-in-out infinite',
        'orb-pulse': 'orb-pulse 3.2s ease-in-out infinite',
        'chaos-drift-a': 'chaos-drift-a 18s ease-in-out infinite',
        'chaos-drift-b': 'chaos-drift-b 22s ease-in-out infinite',
        'ember-rise': 'ember-rise linear infinite',
        'fade-up': 'fade-up 1.2s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        'orb-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'orb-pulse': {
          '0%, 100%': { filter: 'blur(1px) brightness(1)', opacity: '0.95' },
          '50%': { filter: 'blur(1.8px) brightness(1.3)', opacity: '1' },
        },
        'chaos-drift-a': {
          '0%, 100%': { transform: 'translate(-10%, -5%) scale(1)' },
          '50%': { transform: 'translate(8%, 6%) scale(1.15)' },
        },
        'chaos-drift-b': {
          '0%, 100%': { transform: 'translate(8%, 4%) scale(1.1)' },
          '50%': { transform: 'translate(-6%, -8%) scale(0.95)' },
        },
        'ember-rise': {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: '0.9' },
          '90%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-110vh) translateX(20px)', opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
