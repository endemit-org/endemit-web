import containerQueries from "@tailwindcss/container-queries";
import tailwindScrollbar from "tailwind-scrollbar";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "gray-1100": "#0a0a0a",

        /* Colors for Issun-Boshi album release */
        "issun-boshi-yellow": "#fdad42",
        "issun-boshi-red": "#ff0000",
        "issun-boshi-orange": "#fe7f00",
        "issun-boshi-purple": "#352953",
        "issun-boshi-blue": "#396395",
      },
      animation: {
        "slow-spin": "spin 2s linear infinite",
        "slowest-spin": "spin 15s linear infinite",
        scan: "scan 2s ease-in-out infinite",
        "goal-glow-blue": "goal-glow-blue 2.8s ease-in-out infinite",
        "goal-glow-green": "goal-glow-green 2.8s ease-in-out infinite",
      },
      keyframes: {
        "goal-glow-blue": {
          "0%, 100%": { boxShadow: "0 0 2px 0 rgba(59, 130, 246, 0.35)" },
          "50%": { boxShadow: "0 0 10px 2px rgba(59, 130, 246, 0.65)" },
        },
        "goal-glow-green": {
          "0%, 100%": { boxShadow: "0 0 2px 0 rgba(34, 197, 94, 0.35)" },
          "50%": { boxShadow: "0 0 10px 2px rgba(34, 197, 94, 0.65)" },
        },
        scan: {
          "0%, 100%": { top: "0%", opacity: "0" },
          "50%": { top: "100%", opacity: "1" },
        },
      },
      screens: {
        "8xl": "1600px",
      },
      maxWidth: {
        "8xl": "1600px",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [
    containerQueries,
    function ({ addComponents }) {
      addComponents({
        ".link": {
          "@apply text-blue-500 underline hover:text-blue-600  transition-colors":
            {},
        },
      });
    },
    tailwindScrollbar({ nocompatible: true }),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
};
