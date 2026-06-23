<script setup lang="ts">
const authStore = useAuthStore()
const colorMode = useColorMode()

const toggleDark = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <header class="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
    <div class="flex items-center gap-2 min-w-0">
      <slot name="title" />
    </div>

    <div class="flex items-center gap-2">
      <UButton
        :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="toggleDark"
      />

      <UDropdownMenu
        v-if="authStore.currentUser"
        :items="[[{ label: 'Sign out', icon: 'i-lucide-log-out', onSelect: () => authStore.logout() }]]"
      >
        <UAvatar
          :src="authStore.currentUser.photoURL || undefined"
          :alt="authStore.currentUser.displayName || authStore.currentUser.email || ''"
          size="sm"
          class="cursor-pointer"
        />
      </UDropdownMenu>
    </div>
  </header>
</template>
