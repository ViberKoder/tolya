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
        'ton-blue': '#0098EA',
        'ton-dark': '#232328',
        'ton-gray': '#F4F4F5',
      },
      fontFamily: {
        'mulish': ['Mulish', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
