import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C'
        }
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.10)'
      },
      animation: {
        marquee: 'marquee 24s linear infinite'
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    }
  },
  plugins: []
};

export default config;
