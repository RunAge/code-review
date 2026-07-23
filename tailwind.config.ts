import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/components/**/*.{vue,js,ts}",
    "./src/composables/**/*.{js,ts}",
    "./src/layouts/**/*.vue",
    "./src/pages/**/*.vue",
    "./src/plugins/**/*.{js,ts}",
    "./src/app.vue",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#cdd6f4",
        mist: "#1e1e2e",
        flare: "#cba6f7",
        tide: "#89b4fa",
        moss: "#a6e3a1",
      },
      boxShadow: {
        pane: "0 18px 40px rgba(17, 17, 27, 0.55)",
        soft: "0 10px 20px rgba(17, 17, 27, 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "'Avenir Next'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'Fira Code'", "monospace"],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 480ms ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;
