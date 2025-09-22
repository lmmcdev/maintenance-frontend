import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    fontSize: {
      'xs': ['0.875rem', { lineHeight: '1.25rem' }],    // 14px (was 12px)
      'sm': ['1rem', { lineHeight: '1.5rem' }],         // 16px (was 14px)
      'base': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px (was 16px)
      'lg': ['1.25rem', { lineHeight: '1.875rem' }],    // 20px (was 18px)
      'xl': ['1.375rem', { lineHeight: '2rem' }],       // 22px (was 20px)
      '2xl': ['1.5rem', { lineHeight: '2.25rem' }],     // 24px (was 24px)
      '3xl': ['1.875rem', { lineHeight: '2.5rem' }],    // 30px (was 30px)
      '4xl': ['2.25rem', { lineHeight: '3rem' }],       // 36px (was 36px)
      '5xl': ['3rem', { lineHeight: '3.5rem' }],        // 48px (was 48px)
      '6xl': ['3.75rem', { lineHeight: '4rem' }],       // 60px (was 60px)
      '7xl': ['4.5rem', { lineHeight: '4.5rem' }],      // 72px (was 72px)
      '8xl': ['6rem', { lineHeight: '6rem' }],          // 96px (was 96px)
      '9xl': ['8rem', { lineHeight: '8rem' }],          // 128px (was 128px)
    },
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Colores principales basados en tu paleta
        primary: {
          DEFAULT: '#00A1FF',
          50: '#DFF3FF',
          500: '#00A1FF',
          600: '#0081cc',
        },
        // Status colors según tu esquema
        status: {
          new: {
            bg: '#FFE2EA',
            text: '#FF6692',
          },
          emergency: {
            bg: '#FFF5DA', 
            text: '#FFB900',
          },
          progress: {
            bg: '#DFF3FF',
            text: '#00A1FF', 
          },
          pending: {
            bg: '#EAE8FA',
            text: '#8965E5',
          },
          done: {
            bg: '#DAF8F4',
            text: '#00B8A3',
          },
          duplicated: {
            bg: '#FFE3C4',
            text: '#FF8A00',
          },
        },
        // Priority colors
        priority: {
          high: '#f46a6a',
          medium: '#ffb900', 
          low: '#00b8a3',
        },
        // Colores individuales para uso directo
        pink: {
          50: '#FFE2EA',
          200: '#FFB3CC',
          500: '#FF6692',
        },
        yellow: {
          50: '#FFF5DA',
          200: '#FFEC99',
          500: '#FFB900',
        },
        blue: {
          50: '#DFF3FF', 
          200: '#B3E5FF',
          500: '#00A1FF',
        },
        purple: {
          50: '#EAE8FA',
          200: '#D1CDF5',
          500: '#8965E5',
        },
        teal: {
          50: '#DAF8F4',
          200: '#B3F0E8',
          500: '#00B8A3', 
        },
        orange: {
          50: '#FFE3C4',
          200: '#FFD199',
          500: '#FF8A00',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
