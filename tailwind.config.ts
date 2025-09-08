import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
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
