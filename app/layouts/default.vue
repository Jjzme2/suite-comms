<script setup lang="ts">
defineOptions({ name: 'DefaultLayout' })
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
    <AppSideNav />
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <AppTopBar />
      <main class="flex-1 overflow-y-auto scrollbar-thin">
        <slot />
      </main>
    </div>
  </div>
</template>
