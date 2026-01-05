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
        // Warm backgrounds
        bg: 'var(--color-bg)',
        card: {
          DEFAULT: 'var(--color-card)',
          '02': 'var(--color-card-02)',
          '03': 'var(--color-card-03)',
          '04': 'var(--color-card-04)',
        },
        // Orange accent
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
        },
        // Text
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        // Borders - subtle
        border: {
          '01': 'var(--color-border-01)',
          '02': 'var(--color-border-02)',
          '03': 'var(--color-border-03)',
        },
        // Syntax
        ansi: {
          green: 'var(--color-ansi-green)',
          red: 'var(--color-ansi-red)',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        md: ['1.375rem', { lineHeight: '1.3' }],
        lg: ['1.625rem', { lineHeight: '1.25', letterSpacing: '-0.0125em' }],
        xl: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '2xl': ['3.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
      },
      spacing: {
        'g0.5': 'var(--spacing-g0-5)',
        'g0.75': 'var(--spacing-g0-75)',
        g1: 'var(--spacing-g1)',
        'g1.5': 'var(--spacing-g1-5)',
        'g1.75': 'var(--spacing-g1-75)',
        g2: 'var(--spacing-g2)',
        'g2.5': 'var(--spacing-g2-5)',
        g3: 'var(--spacing-g3)',
        'v0.5': 'var(--spacing-v0-5)',
        v1: 'var(--spacing-v1)',
        'v1.5': 'var(--spacing-v1-5)',
        v2: 'var(--spacing-v2)',
        'v2.5': 'var(--spacing-v2-5)',
        v3: 'var(--spacing-v3)',
        v4: 'var(--spacing-v4)',
        v5: 'var(--spacing-v5)',
        v6: 'var(--spacing-v6)',
      },
      maxWidth: {
        container: 'var(--max-width)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        full: 'var(--radius-full)',
      },
      transitionDuration: {
        DEFAULT: 'var(--duration)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease)',
      },
    },
  },
  plugins: [],
};

export default config;
