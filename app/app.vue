<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({
  titleTemplate: '%s — ILYTAT Comms',
  title: 'ILYTAT Comms',
  description: 'Messaging, AI chat, and project forums for the ILYTAT Suite',
  ogTitle: 'ILYTAT Comms',
  ogDescription: 'Messaging, AI chat, and project forums for the ILYTAT Suite',
  ogType: 'website',
  twitterCard: 'summary'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UToaster />
  </UApp>
</template>
