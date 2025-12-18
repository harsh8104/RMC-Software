/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tomato: "#FF6347",
        primary: {
          50: "#fff5f5",
          100: "#ffe3e3",
          200: "#ffc9c9",
          300: "#ffa8a8",
          400: "#ff8787",
          500: "#ff6347", // Tomato - Main brand color
          600: "#fa5030",
          700: "#e8341b",
          800: "#c92914",
          900: "#a61e0d",
        },
      },
    },
  },
  plugins: [],
};
