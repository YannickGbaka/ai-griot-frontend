/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        griot: {
          50: "#fdf8f3",
          100: "#faeee1",
          200: "#f4dbc2",
          300: "#ebc198",
          400: "#e0a06c",
          500: "#d6834a",
          600: "#c86d3f",
          700: "#a75635",
          800: "#864530",
          900: "#6d3829",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
