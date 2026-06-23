<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'AI Chat' })

const { chats, createChat, deleteChat } = useAIChats()
const { models, fetchModels, modelIcon, modelIconColor } = useAIModels()
const router = useRouter()
const toast = useToast()
const creating = ref(false)
const selectedModelId = ref('claude-sonnet-4-6')

onMounted(fetchModels)

async function startChat() {
  creating.value = true
  try {
    const id = await createChat(selectedModelId.value)
    router.push(`/ai/${id}`)
  } catch {
    toast.add({ title: 'Failed to create chat', color: 'error' })
  } finally {
    creating.value = false
  }
}

async function handleDelete(chatId: string) {
  await deleteChat(chatId)
  toast.add({ title: 'Chat deleted', color: 'neutral' })
}

const modelForChat = (modelId: string) => models.value.find(m => m.id === modelId)
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">AI Chat</h1>
        <p class="text-sm text-zinc-500 mt-0.5">Chat with cloud, local, or hybrid AI models</p>
      </div>
      <div class="flex items-center gap-2">
        <AiModelPicker v-model:model-id="selectedModelId" />
        <UButton color="violet" :loading="creating" icon="i-lucide-plus" @click="startChat">
          New Chat
        </UButton>
      </div>
    </div>

    <!-- Model legend -->
    <div class="flex items-center gap-4 mb-6 p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-xs text-zinc-500">
      <span class="flex items-center gap-1.5">
        <UIcon name="i-lucide-server" class="size-3.5 text-blue-500" />
        Cloud — hosted by provider
      </span>
      <span class="flex items-center gap-1.5">
        <UIcon name="i-lucide-key" class="size-3.5 text-emerald-500" />
        Local — runs entirely offline
      </span>
      <span class="flex items-center gap-1.5">
        <UIcon name="i-lucide-cloud" class="size-3.5 text-amber-500" />
        Local-Cloud — local server, cloud backend
      </span>
    </div>

    <!-- Local models panel -->
    <AiLocalModelsPanel class="mb-6" />

    <!-- Chat list -->
    <div v-if="chats && chats.length" class="space-y-2">
      <div
        v-for="chat in chats"
        :key="chat.id"
        class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-violet-300 dark:hover:border-violet-700 transition-colors group"
      >
        <div class="size-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
          <UIcon
            :name="modelIcon(modelForChat(chat.modelId)?.hosting ?? 'cloud')"
            class="size-4"
            :class="modelIconColor(modelForChat(chat.modelId)?.hosting ?? 'cloud')"
          />
        </div>
        <div class="flex-1 min-w-0">
          <NuxtLink :to="`/ai/${chat.id}`" class="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
            {{ chat.title }}
          </NuxtLink>
          <div class="flex items-center gap-2 mt-0.5">
            <AiModelBadge :hosting="modelForChat(chat.modelId)?.hosting ?? 'cloud'" />
            <span class="text-xs text-zinc-400">{{ modelForChat(chat.modelId)?.name ?? chat.modelId }}</span>
          </div>
        </div>
        <UButton
          icon="i-lucide-trash-2"
          variant="ghost"
          color="neutral"
          size="xs"
          class="opacity-0 group-hover:opacity-100 transition-opacity"
          @click="handleDelete(chat.id)"
        />
      </div>
    </div>

    <div v-else class="text-center py-16">
      <div class="size-16 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-bot" class="size-8 text-violet-500" />
      </div>
      <h3 class="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1">No AI chats yet</h3>
      <p class="text-sm text-zinc-400 mb-4">Select a model and start chatting</p>
      <UButton color="violet" :loading="creating" @click="startChat">Start your first chat</UButton>
    </div>
  </div>
</template>
