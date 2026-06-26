<script setup lang="ts">
defineOptions({ name: 'DefaultLayout' })
const sidebar = useSidebar()
const route = useRoute()
watch(() => route.path, () => sidebar.close())
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
    <Transition name="sidebar-backdrop">
      <div
        v-if="sidebar.isOpen.value"
        class="fixed inset-0 z-30 bg-black/50 lg:hidden"
        @click="sidebar.close()"
      />
    </Transition>
    <AppSideNav />
    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <AppTopBar />
      <main class="flex-1 overflow-y-auto scrollbar-thin">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar-backdrop-enter-active,
.sidebar-backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.sidebar-backdrop-enter-from,
.sidebar-backdrop-leave-to {
  opacity: 0;
}
</style>
