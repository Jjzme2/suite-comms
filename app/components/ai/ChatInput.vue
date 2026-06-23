<script setup lang="ts">
const props = defineProps<{
  modelId: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
  'update:modelId': [id: string]
}>()

const text = ref('')

function submit() {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return
  emit('send', trimmed)
  text.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <div class="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
    <div class="flex items-center gap-2 mb-2">
      <AiModelPicker :model-id="modelId" @update:model-id="emit('update:modelId', $event)" />
    </div>
    <div class="flex items-end gap-2">
      <UTextarea
        v-model="text"
        placeholder="Ask anything…"
        :rows="1"
        autoresize
        :disabled="disabled"
        class="flex-1"
        @keydown="onKeydown"
      />
      <UButton
        icon="i-lucide-send"
        color="violet"
        :disabled="!text.trim() || disabled"
        :loading="disabled"
        @click="submit"
      />
    </div>
    <p class="text-xs text-zinc-400 mt-1.5 text-center">
      AI can make mistakes. Verify important information.
    </p>
  </div>
</template>
