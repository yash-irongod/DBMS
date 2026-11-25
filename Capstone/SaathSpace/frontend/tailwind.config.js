/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0F7F4',
          100: '#D8EDE3',
          200: '#B2DAC7',
          300: '#8AC7AB',
          400: '#52B788',
          500: '#40916C',
          600: '#2D6A4F',
          700: '#21523D',
          800: '#1B4332',
          900: '#0E241B',
        },
        cream: {
          50: '#FDFBF7',
          100: '#F7F4EC',
          200: '#EFEAE0',
          300: '#E2DBD0',
        },
        charcoal: {
          900: '#121614',
          800: '#212624',
          700: '#343B38',
          600: '#5A6360',
          500: '#828C88',
          400: '#AAB2AF',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'premium': '0 4px 20px -2px rgba(27, 67, 50, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 30px -4px rgba(27, 67, 50, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
