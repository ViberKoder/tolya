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
        // TON brand colors
        'ton-blue': '#0088CC',
        'ton-blue-dark': '#0077B5',
        'ton-blue-light': '#1DA1F2',
        // Light theme colors
        'cook-bg': '#FFFFFF',
        'cook-bg-secondary': '#F8F9FA',
        'cook-border': '#E5E7EB',
        'cook-text': '#1F2937',
        'cook-text-secondary': '#6B7280',
        // Orange accent
        'cook-orange': '#F97316',
        'cook-orange-dark': '#EA580C',
        'cook-orange-light': '#FB923C',
        // Legacy dark theme (keeping for components that need it)
        'ton-black': '#0F0F0F',
        'ton-gray': '#1A1A1A',
        'ton-gray-light': '#2A2A2A',
        'ton-white': '#FFFFFF',
        'ton-accent': '#00D4FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-ton': 'linear-gradient(135deg, #0088CC 0%, #00D4FF 100%)',
        'gradient-cook': 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
        'gradient-cook-soft': 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%)',
      },
      boxShadow: {
        'ton': '0 4px 60px rgba(0, 136, 204, 0.3)',
        'ton-hover': '0 8px 80px rgba(0, 136, 204, 0.4)',
        'cook': '0 4px 60px rgba(249, 115, 22, 0.2)',
        'cook-hover': '0 8px 80px rgba(249, 115, 22, 0.3)',
        'card': '0 2px 20px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 40px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
    },
  },
  plugins: [],
};
