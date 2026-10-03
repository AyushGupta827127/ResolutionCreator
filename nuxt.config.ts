import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: "2025-05-15",
  app: {
    head: {
      title: "Resolution Creator",
      htmlAttrs: { lang: "en" },
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&display=swap",
        },
      ],
    },
  },
  // Same split as the `template` project: `public` is exposed to the browser,
  // everything else is server-only. This app talks to the SAME Directus
  // instance and Firebase project as `template` — same users, same credits.
  runtimeConfig: {
    // --- server-only secrets ---
    SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    SMTP_PORT: process.env.SMTP_PORT || "465",
    SMTP_USER: process.env.SMTP_USER || "",
    SMTP_PASS: process.env.SMTP_PASS || "",
    SMTP_FROM: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "",
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "",
    DIRECTUS_API_TOKEN: process.env.DIRECTUS_API_TOKEN || "",
    FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || "",
    // "true" = refuse save/credits/e-mail requests that cannot be verified (needs FIREBASE_SERVICE_ACCOUNT)
    REQUIRE_VERIFIED_AUTH: process.env.REQUIRE_VERIFIED_AUTH || "",
    DB_API_URL: process.env.NUXT_DB_API_URL || "https://temp.finaceindia.com",
    // AI (Claude) — question-flow assistance, compliance narration, optional
    // wording refinement. Every AI feature has a deterministic non-AI
    // fallback, so the app is fully usable with this unset.
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    public: {
      DB_URL: process.env.NUXT_DB_URL || "https://db.finaceindia.com",
      TEMP_DB_URL: process.env.NUXT_TEMP_DB_URL || "https://temp.finaceindia.com",
      RAZORPAY_KEY_ID: process.env.NUXT_RAZORPAY_KEY_ID || "",
      RAZORPAY_ENABLED: (process.env.NUXT_RAZORPAY_ENABLED ?? "true") === "true",
      AI_ENABLED: (process.env.NUXT_AI_ENABLED ?? "true") === "true",
    },
  },
  // Fonts used by the server-side PDF renderer; bundled so they exist in production builds too.
  nitro: {
    serverAssets: [{ baseName: "fonts", dir: fileURLToPath(new URL("./server/assets/fonts", import.meta.url)) }],
  },
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxt/icon", "@pinia/nuxt"],
});
