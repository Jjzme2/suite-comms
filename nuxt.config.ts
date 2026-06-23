export default defineNuxtConfig({
  runtimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    public: {
      hubUrl: process.env.NUXT_PUBLIC_HUB_URL || 'http://localhost:3000'
    }
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    'nuxt-vuefire'
  ],

  vuefire: {
    auth: {
      enabled: true,
      sessionCookie: false
    },
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    }
  },

  ui: {
    theme: {
      colors: ['violet', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'purple', 'fuchsia', 'pink', 'rose']
    }
  },

  nitro: {
    preset: 'vercel'
  },

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  ssr: false,

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
