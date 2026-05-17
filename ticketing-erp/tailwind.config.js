/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#EFF6FF',
        },
        surface: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        text: {
          main: '#0F172A',
          sub: '#64748B',
          muted: '#94A3B8',
        },
        status: {
          open: { DEFAULT: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
          in_progress: { DEFAULT: '#F59E0B', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
          pending: { DEFAULT: '#8B5CF6', bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
          resolved: { DEFAULT: '#10B981', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
          closed: { DEFAULT: '#6B7280', bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' },
        },
        priority: {
          p1: { DEFAULT: '#EF4444', bg: '#FEF2F2', text: '#DC2626' },
          p2: { DEFAULT: '#F97316', bg: '#FFF7ED', text: '#EA580C' },
          p3: { DEFAULT: '#EAB308', bg: '#FEFCE8', text: '#CA8A04' },
          p4: { DEFAULT: '#22C55E', bg: '#F0FDF4', text: '#16A34A' },
        },
        category: {
          it: { DEFAULT: '#6366F1', bg: '#EEF2FF', text: '#4338CA' },
          mnt: { DEFAULT: '#14B8A6', bg: '#F0FDFA', text: '#0F766E' },
          hr: { DEFAULT: '#EC4899', bg: '#FDF2F8', text: '#BE185D' },
          prc: { DEFAULT: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
        },
        sidebar: {
          bg: '#1E293B',
          text: '#CBD5E1',
          active: '#2563EB',
          hover: '#334155',
        },
      },
      animation: {
        'slide-in-right': 'slideInRight 200ms ease',
        'fade-in': 'fadeIn 150ms ease',
        'scale-in': 'scaleIn 150ms ease',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
