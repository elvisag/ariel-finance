/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--color-bg)",
          surface: "var(--color-bg-surface)",
          elevated: "var(--color-bg-elevated)",
          hover: "var(--color-bg-hover)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        primary: {
          50: "#f0f0ff",
          100: "#e0e0ff",
          200: "#d0d0ff",
          300: "#c0c0f8",
          400: "#a0a0d8",
          500: "#8080b8",
          600: "#6868a0",
          700: "#505088",
          800: "#383870",
          900: "#202058",
        },
        border: {
          DEFAULT: "var(--color-border)",
          light: "var(--color-border-light)",
        },
        finance: {
          income: "#10b981",
          expense: "#ef4444",
          savings: "#3b82f6",
          investment: "#8b5cf6",
        },
      },
    },
  },

  plugins: [],
};
