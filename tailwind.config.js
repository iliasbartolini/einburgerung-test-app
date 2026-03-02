/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#1D3557',
        secondary: '#457B9D',
        accent: '#E63946',
        light: '#F1FAEE',
        dark: '#1D3557',
      },
    },
  },
  plugins: [],
};
