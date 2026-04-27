/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1115',
        sidebar: '#0b0d12',
        surface: '#151821',
        elevated: '#1c1f2b',
        border: '#2a2f3a',
        primary: '#6366f1',
        'text-primary': '#e5e7eb',
        'text-secondary': '#9ca3af',
        running: '#22c55e',
        stopped: '#6b7280',
        error: '#ef4444',
        starting: '#f59e0b',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
