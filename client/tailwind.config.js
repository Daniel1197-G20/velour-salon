/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F3E7D5",
        clay: "#8A5A3B",
        espresso: "#4A2C1B",
        blush: "#C98B72",
        rose: "#B5654A",
        stone: "#EFE0C9",
        ink: "#2E1B10",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        script: ["'Playfair Display'", "serif"],
        body: ["'Jost'", "sans-serif"],
      },
      borderRadius: {
        blob: "50% 50% 45% 55% / 55% 45% 55% 45%",
      },
    },
  },
  plugins: [],
}

