/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sp: {
          bg: 'var(--sp-bg)',
          surface: 'var(--sp-surface)',
          elevated: 'var(--sp-elevated)',
          border: 'var(--sp-border)',
          text: 'var(--sp-text)',
          muted: 'var(--sp-muted)',
          accent: 'var(--sp-accent)',
          'accent-fg': 'var(--sp-accent-fg)',
          terracotta: 'var(--sp-terracotta)',
          'terracotta-fg': 'var(--sp-terracotta-fg)',
          sand: 'var(--sp-sand)',
          olive: 'var(--sp-olive)',
          danger: 'var(--sp-danger)',
          success: 'var(--sp-success)',
          warning: 'var(--sp-warning)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
    },
  },
  plugins: [],
};
