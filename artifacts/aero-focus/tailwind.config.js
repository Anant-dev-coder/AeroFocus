/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#080B08',
        foreground: '#F0F5E9',
        card: '#121711',
        primary: '#C9FF55',
        accent: '#FF6B78',
        muted: '#182018',
        line: '#293329',
        'brain-healthy': '#C9FF55',
        'brain-tired': '#E8D96B',
        'brain-rotted': '#A8B081',
      },
    },
  },
  plugins: [],
};
