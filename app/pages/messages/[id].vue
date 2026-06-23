<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const conversationId = computed(() => route.params.id as string)

const { conversations } = useConversations()
const { conversation, messages, sendMessage, markRead, toggleReaction } = useConversation(conversationId)
const { typingUsers, startTyping, stopTyping } = useTyping(conversationId)
const authStore = useAuthStore()

const messagesEl = ref<HTMLElement>()
const showNewModal = ref(false)

const otherUid = computed(() => {
  const uid = authStore.currentUser?.uid
  return conversation.value?.participantIds.find(id => id !== uid) ?? ''
})
const otherName = computed(() => conversation.value?.participantNames[otherUid.value] || 'Conversation')
useSeoMeta({ title: computed(() => otherName.value) })

async function handleSend(text: string) {
  stopTyping()
  await sendMessage(text)
  await nextTick()
  messagesEl.value?.scrollTo({ top: messagesEl.value.scrollHeight, behavior: 'smooth' })
}

function handleTyping() {
  startTyping()
}

onMounted(() => markRead())
watch(messages, () => {
  markRead()
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
})
</script>

<template>
  <div class="flex h-full">
    <!-- Conversations sidebar -->
    <div class="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
      <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Messages</h2>
        <UButton icon="i-lucide-edit" variant="ghost" color="neutral" size="xs" @click="showNewModal = true" />
      </div>
      <div class="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        <NuxtLink
          v-for="conv in conversations"
          :key="conv.id"
          :to="`/messages/${conv.id}`"
        >
          <MessagesConversationItem :conversation="conv" :active="conv.id === conversationId" />
        </NuxtLink>
      </div>
    </div>

    <!-- Chat area -->
    <div class="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950">
      <!-- Header -->
      <div class="h-14 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user" class="size-5 text-zinc-400" />
          <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ otherName }}</span>
        </div>
      </div>

      <!-- Messages -->
      <div ref="messagesEl" class="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        <div v-if="!messages || !messages.length" class="flex items-center justify-center h-full">
          <p class="text-sm text-zinc-400">Send the first message</p>
        </div>
        <MessagesMessageBubble
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          :is-mine="msg.senderId === authStore.currentUser?.uid"
          :current-uid="authStore.currentUser?.uid ?? ''"
          @react="(msgId, emoji) => toggleReaction(msgId, emoji)"
        />
      </div>

      <!-- Typing indicator -->
      <SharedTypingIndicator :users="typingUsers" />

      <MessagesMessageInput @send="handleSend" @typing="handleTyping" />
    </div>

    <!-- New conversation modal (carried over from index) -->
    <MessagesNewConversationModal v-model:open="showNewModal" />
  </div>
</template>
