import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/components/**/*.{vue,js,ts}",
    "./src/composables/**/*.{js,ts}",
    "./src/layouts/**/*.vue",
    "./src/pages/**/*.vue",
    "./src/plugins/**/*.{js,ts}",
    "./src/app.vue"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14181d",
        mist: "#f5f3ee",
        flare: "#ff5f3a",
        tide: "#1f6feb",
        moss: "#2f855a"
      },
      boxShadow: {
        pane: "0 18px 40px rgba(20, 24, 29, 0.16)",
        soft: "0 10px 20px rgba(20, 24, 29, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "'Avenir Next'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'Fira Code'", "monospace"]
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        rise: "rise 480ms ease-out both"
      }
    }
  },
  plugins: []
} satisfies Config;
