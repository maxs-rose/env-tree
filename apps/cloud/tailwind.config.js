/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{js,ts,jsx,tsx}', './src/components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        swing: {
          '0%,100%': { transform: 'rotate(15deg)' },
          '50%': { transform: 'rotate(-15deg)' },
        },
        smallSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(90deg)' },
        },
      },
      animation: {
        swing: 'swing 1s infinite',
        spinDuration: 'smallSpin 0.1s linear',
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('propagate-hover', '&:hover > *');
    },
  ],
};
