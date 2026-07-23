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
        ink: "#4c4f69",
        mist: "#eff1f5",
        flare: "#8839ef",
        tide: "#1e66f5",
        moss: "#40a02b"
      },
      boxShadow: {
        pane: "0 18px 40px rgba(76, 79, 105, 0.16)",
        soft: "0 10px 20px rgba(76, 79, 105, 0.08)"
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
