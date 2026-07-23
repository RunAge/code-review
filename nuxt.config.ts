import { defineNuxtConfig } from "nuxt/config";

const appBaseUrl = process.env.NUXT_APP_BASE_URL ?? (process.env.NODE_ENV === "production" ? "/code-review/" : "/");

export default defineNuxtConfig({
  ssr: false,
  srcDir: "src/",
  app: {
    baseURL: appBaseUrl
  },
  runtimeConfig: {
    public: {
      githubClientId: process.env.NUXT_PUBLIC_GITHUB_CLIENT_ID ?? "",
      githubRedirectUri:
        process.env.NUXT_PUBLIC_GITHUB_REDIRECT_URI ?? "http://localhost:3000/auth/callback"
    }
  },
  nitro: {
    preset: "github-pages"
  },
  modules: ["@pinia/nuxt"],
  typescript: {
    strict: true,
    typeCheck: true
  }
});
