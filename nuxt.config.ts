export default defineNuxtConfig({
  ssr: false,
  srcDir: "src/",
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
