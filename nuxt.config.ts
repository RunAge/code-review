export default defineNuxtConfig({
  ssr: false,
  srcDir: "src/",
  nitro: {
    preset: "github-pages"
  },
  modules: ["@pinia/nuxt"],
  typescript: {
    strict: true,
    typeCheck: true
  }
});
