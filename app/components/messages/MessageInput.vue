<script setup lang="ts">
const emit = defineEmits<{
  send: [text: string]
  typing: []
}>()

const text = ref('')

function submit() {
  const trimmed = text.value.trim()
  if (!trimmed) return
  emit('send', trimmed)
  text.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function onInput() {
  emit('typing')
}
</script>

<template>
  <div class="flex items-end gap-2 p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
    <UTextarea
      v-model="text"
      placeholder="Type a message…"
      :rows="1"
      autoresize
      class="flex-1"
      @keydown="onKeydown"
      @input="onInput"
    />
    <UButton
      icon="i-lucide-send"
      color="violet"
      :disabled="!text.trim()"
      @click="submit"
    />
  </div>
</template>
