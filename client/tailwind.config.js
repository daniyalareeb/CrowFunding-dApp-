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
        // Dark backgrounds
        'deep':     '#050514',
        'base':     '#0a0a1e',
        'surface':  '#0f0f2a',
        // Neon accents
        'neon-violet':  '#8b5cf6',
        'neon-indigo':  '#6366f1',
        'neon-emerald': '#10b981',
        'neon-cyan':    '#06b6d4',
        'neon-amber':   '#f59e0b',
        // Text
        'text-primary':   '#f1f5f9',
        'text-secondary': '#94a3b8',
        'text-muted':     '#475569',
        // Backward-compat aliases used throughout existing JSX
        'primary-green':  '#10b981',
        'accent-purple':  '#8b5cf6',
        'warning-amber':  '#f59e0b',
        // Legacy light-theme tokens (kept so nothing breaks at compile)
        'light-bg':    '#050514',
        'glass-bg':    '#0a0a1e',
        'glass-border': '#1e1e3f',
      },
      boxShadow: {
        'glow-violet':  '0 0 40px rgba(139, 92, 246, 0.35)',
        'glow-emerald': '0 0 40px rgba(16,  185, 129, 0.35)',
        'glow-sm':      '0 0 20px rgba(139, 92, 246, 0.20)',
        'glass':        '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-hover':  '0 20px 60px rgba(0,0,0,0.55), 0 0 40px rgba(139,92,246,0.18)',
        'card-hover':   '0 25px 50px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.15)',
      },
      backgroundImage: {
        'gradient-violet':  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        'gradient-hero':    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #10b981 100%)',
        'gradient-card':    'linear-gradient(to top, rgba(5,5,20,0.9) 0%, transparent 60%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%':      { opacity: '1'   },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'fade-up':    'fade-up 0.45s ease-out forwards',
      },
      screens: {
        xs: '320px',
        sm: '425px',
        md: '768px',
        lg: '1024px',
        xl: '1440px',
      },
    },
  },
  plugins: [],
}
