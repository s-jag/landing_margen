import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--color-theme-bg)',
          fg: 'var(--color-theme-fg)',
          card: {
            DEFAULT: 'var(--color-theme-card)',
            hover: 'var(--color-theme-card-hover)',
            border: 'var(--color-theme-card-border)',
          },
          accent: {
            DEFAULT: 'var(--color-theme-accent)',
            hover: 'var(--color-theme-accent-hover)',
          },
          text: {
            DEFAULT: 'var(--color-theme-text)',
            secondary: 'var(--color-theme-text-secondary)',
            tertiary: 'var(--color-theme-text-tertiary)',
          },
          border: {
            DEFAULT: 'var(--color-theme-border)',
            subtle: 'var(--color-theme-border-subtle)',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display-lg': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.015em' }],
        'display-sm': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body-xs': ['0.75rem', { lineHeight: '1.5' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        container: '1280px',
        prose: '720px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'out-spring': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'typing-cursor': {
          '0%, 100%': { borderColor: 'var(--color-theme-accent)' },
          '50%': { borderColor: 'transparent' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-down': 'fade-down 0.3s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        blink: 'blink 1s step-end infinite',
        'typing-cursor': 'typing-cursor 1s step-end infinite',
      },
    },
  },
  plugins: [],
};

export default config;
