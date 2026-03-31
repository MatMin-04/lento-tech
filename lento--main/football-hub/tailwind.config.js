/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  safelist: [
    'bg-serie-a',
    'bg-premier',
    'bg-laliga',
    'bg-bundesliga',
    'bg-ligue1',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
        display: ['"Clash Display"', 'sans-serif'], // Just in case we import it
      },
      colors: {
        // Core Nexo
        'nexo-black': '#050508',
        'nexo-white': '#FFFFFF',
        'nexo-glow-magenta': '#d946ef',
        'nexo-glow-purple': '#9333ea',
        'nexo-glow-orange': '#f97316',
        'nexo-glow-green': '#10b981',
        
        // Legacy fallbacks if needed
        'serie-a': '#00AAFF', 
        'premier': '#6B21A8', 
        'laliga': '#FACC15',
        'bundesliga': '#E8001C',
        'ligue1': '#003189',
      },
      animation: {
        'live-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite alternate',
        'aurora-morph': 'morph 15s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        twinkle: {
          '0%': { opacity: 0.2 },
          '100%': { opacity: 0.8 },
        },
        morph: {
          '0%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
