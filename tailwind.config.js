/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213D",
        paper: "#F4F6F5",
        grid: "#D7DEDB",
        amber: "#E3A21A",
        teal: "#1E6E63",
        coral: "#C1483C",
        muted: "#6B7686",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
