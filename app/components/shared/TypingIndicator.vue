<script setup lang="ts">
const props = defineProps<{ users: string[] }>()

const label = computed(() => {
  const names = props.users.slice(0, 2).join(', ')
  const extra = props.users.length > 2 ? ` and ${props.users.length - 2} others` : ''
  const verb = props.users.length === 1 ? 'is' : 'are'
  return `${names}${extra} ${verb} typing…`
})
</script>

<template>
  <Transition name="typing-fade">
    <div
      v-if="users.length"
      class="flex items-center gap-2 px-4 py-1.5 text-xs text-zinc-400 dark:text-zinc-500"
    >
      <span class="flex items-center gap-0.5">
        <span class="size-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay: 0ms" />
        <span class="size-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay: 150ms" />
        <span class="size-1.5 rounded-full bg-zinc-400 animate-bounce" style="animation-delay: 300ms" />
      </span>
      {{ label }}
    </div>
  </Transition>
</template>

<style scoped>
.typing-fade-enter-active,
.typing-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.typing-fade-enter-from,
.typing-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
