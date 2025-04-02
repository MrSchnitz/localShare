// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  devServer: {
    port: 80,
  },
  css: ["primeicons/primeicons.css"],
  typescript: {
    typeCheck: true,
  },
  modules: [
    "@nuxtjs/tailwindcss",
    "nuxt-file-storage",
    "@primevue/nuxt-module",
  ],
  fileStorage: {
    // TODO: Change to the correct path
    mount: "...",
  },
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },
});
