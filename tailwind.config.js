/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        // Cherry Edu Brand
        cherry: {
          50: "#fff1f1",
          100: "#ffe0e0",
          200: "#ffc6c6",
          300: "#ff9d9d",
          400: "#ff6464",
          500: "#ff3333",
          600: "#f20000",
          700: "#cc0000",
          800: "#a80000",
          900: "#8a0000",
          950: "#500000",
        },
        // Neutral slate for UI
        slate: {
          925: "#0d1117",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
