<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const chatId = computed(() => route.params.id as string)

const { chats, renameChat } = useAIChats()
const { messages, streaming, streamingContent, error, sendMessage } = useAIChatSession(chatId)
const { models, fetchModels, modelIcon, modelIconColor } = useAIModels()

const messagesEl = ref<HTMLElement>()
const editingTitle = ref(false)
const titleInput = ref('')

const chat = computed(() => chats.value?.find(c => c.id === chatId.value))
useSeoMeta({ title: computed(() => chat.value?.title ?? 'AI Chat') })
const model = computed(() => models.value.find(m => m.id === selectedModelId.value))
const selectedModelId = ref(chat.value?.modelId ?? 'claude-sonnet-4-6')

watch(chat, c => {
  if (c && !selectedModelId.value) selectedModelId.value = c.modelId
})

onMounted(fetchModels)

const streamingMessage = computed(() => streaming.value
  ? { id: '__streaming__', role: 'assistant' as const, content: streamingContent.value || '…', createdAt: null as any }
  : null
)

const allMessages = computed(() => [
  ...(messages.value ?? []),
  ...(streamingMessage.value ? [streamingMessage.value] : [])
])

async function handleSend(text: string) {
  await sendMessage(text, selectedModelId.value)
  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
}

watch(allMessages, () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
})

async function saveTitle() {
  if (titleInput.value.trim() && chat.value) {
    await renameChat(chat.value.id, titleInput.value.trim())
  }
  editingTitle.value = false
}

function startEditTitle() {
  titleInput.value = chat.value?.title ?? ''
  editingTitle.value = true
}
</script>

<template>
  <div class="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
    <!-- Header -->
    <div class="h-14 flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
      <NuxtLink to="/ai" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
        <UIcon name="i-lucide-chevron-left" class="size-5" />
      </NuxtLink>

      <div v-if="editingTitle" class="flex-1 flex items-center gap-2">
        <UInput v-model="titleInput" size="sm" class="max-w-xs" @keydown.enter="saveTitle" @keydown.escape="editingTitle = false" />
        <UButton size="xs" color="violet" @click="saveTitle">Save</UButton>
        <UButton size="xs" variant="ghost" color="neutral" @click="editingTitle = false">Cancel</UButton>
      </div>
      <button v-else class="flex-1 text-left hover:text-violet-600 dark:hover:text-violet-400 transition-colors group flex items-center gap-1.5 min-w-0" @click="startEditTitle">
        <span class="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{{ chat?.title ?? 'AI Chat' }}</span>
        <UIcon name="i-lucide-pencil" class="size-3.5 opacity-0 group-hover:opacity-50 shrink-0 transition-opacity" />
      </button>

      <AiModelPicker v-model:model-id="selectedModelId" />
    </div>

    <!-- Messages -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4 max-w-3xl w-full mx-auto">
      <div v-if="!allMessages.length" class="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
        <div class="size-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
          <UIcon
            :name="model ? modelIcon(model.hosting) : 'i-lucide-bot'"
            class="size-8"
            :class="model ? modelIconColor(model.hosting) : 'text-violet-500'"
          />
        </div>
        <div>
          <p class="font-medium text-zinc-700 dark:text-zinc-300">{{ model?.name ?? 'AI' }}</p>
          <p class="text-sm text-zinc-400 mt-0.5">Ask me anything to get started</p>
        </div>
      </div>

      <AiChatMessage
        v-for="msg in allMessages"
        :key="msg.id"
        :message="msg"
        :streaming="msg.id === '__streaming__'"
      />

      <div v-if="error" class="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-700 dark:text-rose-300">
        <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0" />
        {{ error }}
      </div>
    </div>

    <!-- Input -->
    <div class="max-w-3xl w-full mx-auto">
      <AiChatInput
        v-model:model-id="selectedModelId"
        :disabled="streaming"
        @send="handleSend"
      />
    </div>
  </div>
</template>
