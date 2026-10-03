/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{vue,js}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./composables/**/*.js",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Poppins — same family `template` uses, so the two apps read as
        // siblings. Serif headings are the deliberate departure: this
        // product is meant to feel like a certificate/legal-document tool,
        // not another SaaS form.
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Source Serif 4", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // `template`'s actual recipe: indigo-950 (brand/headings), orange-500
        // (accent/CTA — Tailwind's default `orange` scale, used directly),
        // white surfaces, gray neutrals. `ink` carries that recipe as ONE
        // token so every component that already uses `ink-*` gets it for
        // free: ink-50..800 are true gray (borders, body text, subtle
        // backgrounds) and ink-900/950 step up into the same indigo
        // `template` uses for its brand mark and primary buttons.
        ink: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      boxShadow: {
        // Subtle, on purpose — a compliance tool should look calm, not flashy.
        card: "0 1px 2px rgba(30,27,75,0.03), 0 1px 8px -4px rgba(30,27,75,0.08)",
        "card-hover": "0 1px 3px rgba(30,27,75,0.05), 0 8px 20px -8px rgba(30,27,75,0.14)",
        paper: "0 1px 1px rgba(30,27,75,0.04), 0 2px 4px rgba(30,27,75,0.04), 0 8px 28px -12px rgba(30,27,75,0.14)",
      },
      backgroundImage: {
        shimmer: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: 0, transform: "translateY(6px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        // Kept brief (150-250ms range for interactions; this one's for
        // one-time entrance only, not a persistent decorative loop.
        "fade-up": "fadeUp 0.3s ease-out both",
        "fade-in": "fadeIn 0.2s ease both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
