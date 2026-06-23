<script setup lang="ts">
import { signInWithCustomToken } from 'firebase/auth'

definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Signing in…', robots: 'noindex' })

const route = useRoute()
const auth = useFirebaseAuth()!
const error = ref('')

onMounted(async () => {
  const token = route.query.token as string | undefined
  const redirect = (route.query.redirect as string | undefined) || '/'

  if (!token) {
    error.value = 'Missing authentication token.'
    return
  }

  try {
    await signInWithCustomToken(auth, token)
    // signInWithCustomToken resolves before Firebase fires onAuthStateChanged,
    // so VueFire's user ref can still be null when the auth middleware runs on
    // the next route. Wait for the ref to reflect the signed-in user first.
    const user = useCurrentUser()
    if (!user.value) {
      await new Promise<void>((resolve) => {
        const stop = watch(user, (val) => { if (val) { stop(); resolve() } }, { immediate: true })
      })
    }
    await navigateTo(redirect.startsWith('/') ? redirect : '/')
  } catch (e: any) {
    console.error('SSO callback failed', e)
    error.value = 'Sign-in failed. Please try again.'
  }
})
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <div v-if="error" class="text-center space-y-3">
      <UIcon name="i-lucide-alert-circle" class="size-8 text-red-500 mx-auto" />
      <p class="text-sm text-red-500">{{ error }}</p>
      <UButton label="Back to Hub" :to="useRuntimeConfig().public.hubUrl" external variant="ghost" size="sm" />
    </div>
    <div v-else class="flex flex-col items-center gap-3">
      <UIcon name="i-lucide-loader-circle" class="size-8 text-violet-500 animate-spin" />
      <p class="text-sm text-muted">Signing you in…</p>
    </div>
  </div>
</template>
