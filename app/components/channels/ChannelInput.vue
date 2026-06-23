<script setup lang="ts">
const props = defineProps<{ hasAI: boolean; aiThinking?: boolean }>()

const emit = defineEmits<{
  send: [text: string]
  askAi: [text: string]
  typing: []
}>()

const text = ref('')

function submit() {
  const t = text.value.trim()
  if (!t) return
  emit('send', t)
  text.value = ''
}

function askAI() {
  const t = text.value.trim()
  if (!t) return
  emit('askAi', t)
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
  <div class="flex flex-col border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
    <div class="flex items-end gap-2 p-3">
      <UTextarea
        v-model="text"
        placeholder="Message…"
        :rows="1"
        autoresize
        class="flex-1"
        @keydown="onKeydown"
        @input="onInput"
      />
      <UButton
        v-if="hasAI"
        icon="i-lucide-sparkles"
        color="violet"
        variant="soft"
        :disabled="!text.trim() || aiThinking"
        :loading="aiThinking"
        title="Ask AI"
        @click="askAI"
      />
      <UButton
        icon="i-lucide-send"
        color="violet"
        :disabled="!text.trim()"
        @click="submit"
      />
    </div>
  </div>
</template>
