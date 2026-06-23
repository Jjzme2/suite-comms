<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const channelId = computed(() => route.params.id as string)

const { channels } = useChannels()
const { channel, messages, aiThinking, sendMessage, sendAIMessage, toggleReaction } = useChannel(channelId)
const { typingUsers, startTyping, stopTyping } = useTyping(channelId)
const authStore = useAuthStore()
const showCreate = ref(false)

const messagesEl = ref<HTMLElement>()

const hasAI = computed(() => !!channel.value?.aiModel)

async function handleSend(text: string) {
  stopTyping()
  await sendMessage(text)
  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
}

async function handleAskAI(text: string) {
  stopTyping()
  await sendAIMessage(text)
  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
}

function handleTyping() {
  startTyping()
}

watch(messages, () => {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
})
</script>

<template>
  <div class="flex h-full">
    <!-- Channel list sidebar -->
    <div class="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
      <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Channels</h2>
        <UButton icon="i-lucide-plus" variant="ghost" color="neutral" size="xs" @click="showCreate = true" />
      </div>
      <div class="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        <NuxtLink v-for="ch in channels" :key="ch.id" :to="`/channels/${ch.id}`">
          <ChannelsChannelItem :channel="ch" :active="ch.id === channelId" />
        </NuxtLink>
      </div>
    </div>

    <!-- Channel view -->
    <div class="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950">
      <!-- Header -->
      <div class="h-14 flex items-center gap-3 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <span class="text-lg text-zinc-400 font-medium leading-none">#</span>
          <span class="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{{ channel?.name }}</span>
        </div>
        <div v-if="channel?.aiModel" class="flex items-center gap-1.5 shrink-0">
          <UIcon name="i-lucide-sparkles" class="size-4 text-violet-400" />
          <span class="text-xs text-zinc-400">{{ formatModelId(channel.aiModel) }}</span>
        </div>
        <div v-if="channel?.description" class="hidden md:block text-xs text-zinc-400 truncate max-w-[220px]">
          {{ channel.description }}
        </div>
      </div>

      <!-- Messages -->
      <div ref="messagesEl" class="flex-1 overflow-y-auto scrollbar-thin py-4">
        <div v-if="!messages || !messages.length" class="flex flex-col items-center justify-center h-full text-center px-4">
          <UIcon name="i-lucide-hash" class="size-10 text-zinc-300 dark:text-zinc-700 mb-2" />
          <p class="text-sm font-medium text-zinc-500">This is the beginning of #{{ channel?.name }}</p>
          <p v-if="hasAI" class="text-xs text-zinc-400 mt-1 flex items-center gap-1">
            <UIcon name="i-lucide-sparkles" class="size-3 text-violet-400" />
            AI-assisted with {{ formatModelId(channel!.aiModel) }} — click the sparkle button to ask AI
          </p>
        </div>
        <template v-else>
          <ChannelsChannelMessage
            v-for="msg in messages"
            :key="msg.id"
            :message="msg"
            :current-uid="authStore.currentUser?.uid ?? ''"
            @react="(msgId, emoji) => toggleReaction(msgId, emoji)"
          />
        </template>
      </div>

      <!-- Typing indicator -->
      <SharedTypingIndicator :users="typingUsers" />

      <!-- Input -->
      <ChannelsChannelInput
        :has-a-i="hasAI"
        :ai-thinking="aiThinking"
        @send="handleSend"
        @ask-ai="handleAskAI"
        @typing="handleTyping"
      />
    </div>

    <ChannelsCreateChannelModal v-model:open="showCreate" />
  </div>
</template>
