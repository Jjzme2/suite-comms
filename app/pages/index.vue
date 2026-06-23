<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const user = useCurrentUser()
const { conversations } = useConversations()
const { chats } = useAIChats()
const { threads } = useForumThreads()
const { channels } = useChannels()

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

const displayName = computed(() =>
  user.value?.displayName || user.value?.email?.split('@')[0] || 'there'
)

const totalUnread = computed(() =>
  (conversations.value ?? []).reduce((sum, c) => {
    const uid = user.value?.uid ?? ''
    return sum + (c.unreadCount?.[uid] ?? 0)
  }, 0)
)
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {{ greeting }}, {{ displayName }}
      </h1>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
        {{ new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }}
      </p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <UCard class="text-center py-4">
        <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ conversations?.length ?? 0 }}</p>
        <p class="text-xs text-zinc-500 mt-0.5">Conversations</p>
      </UCard>
      <UCard class="text-center py-4">
        <p class="text-2xl font-bold" :class="totalUnread > 0 ? 'text-rose-500' : 'text-zinc-400'">{{ totalUnread }}</p>
        <p class="text-xs text-zinc-500 mt-0.5">Unread</p>
      </UCard>
      <UCard class="text-center py-4">
        <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ channels?.length ?? 0 }}</p>
        <p class="text-xs text-zinc-500 mt-0.5">Channels</p>
      </UCard>
      <UCard class="text-center py-4">
        <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ chats?.length ?? 0 }}</p>
        <p class="text-xs text-zinc-500 mt-0.5">AI Chats</p>
      </UCard>
    </div>

    <div class="grid sm:grid-cols-2 gap-6">
      <!-- Recent messages -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Recent Messages</h2>
          <NuxtLink to="/messages" class="text-xs text-violet-600 dark:text-violet-400 hover:underline">View all</NuxtLink>
        </div>
        <div v-if="conversations && conversations.length" class="space-y-1">
          <NuxtLink
            v-for="conv in conversations.slice(0, 5)"
            :key="conv.id"
            :to="`/messages/${conv.id}`"
          >
            <MessagesConversationItem :conversation="conv" />
          </NuxtLink>
        </div>
        <p v-else class="text-sm text-zinc-400 text-center py-6">No conversations yet</p>
      </div>

      <!-- Recent channels -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Recent Channels</h2>
          <NuxtLink to="/channels" class="text-xs text-violet-600 dark:text-violet-400 hover:underline">View all</NuxtLink>
        </div>
        <div v-if="channels && channels.length" class="space-y-1">
          <NuxtLink
            v-for="ch in channels.slice(0, 5)"
            :key="ch.id"
            :to="`/channels/${ch.id}`"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span class="text-base text-zinc-400 leading-none">#</span>
            <span class="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1">{{ ch.name }}</span>
            <UIcon v-if="ch.aiModel" name="i-lucide-sparkles" class="size-3 text-violet-400 shrink-0" />
          </NuxtLink>
        </div>
        <NuxtLink
          to="/channels"
          class="flex items-center justify-center gap-2 py-4 text-sm text-zinc-400 hover:text-violet-500 transition-colors"
        >
          <UIcon name="i-lucide-plus" class="size-4" />
          Create a channel
        </NuxtLink>
      </div>
    </div>

    <!-- Recent AI chats -->
    <div class="mt-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Recent AI Chats</h2>
        <NuxtLink to="/ai" class="text-xs text-violet-600 dark:text-violet-400 hover:underline">View all</NuxtLink>
      </div>
      <div v-if="chats && chats.length" class="grid sm:grid-cols-2 gap-1">
        <NuxtLink
          v-for="chat in chats.slice(0, 6)"
          :key="chat.id"
          :to="`/ai/${chat.id}`"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <UIcon name="i-lucide-bot" class="size-4 text-violet-400 shrink-0" />
          <span class="text-sm text-zinc-700 dark:text-zinc-300 truncate">{{ chat.title }}</span>
        </NuxtLink>
      </div>
      <NuxtLink
        to="/ai"
        class="flex items-center justify-center gap-2 py-4 text-sm text-zinc-400 hover:text-violet-500 transition-colors"
      >
        <UIcon name="i-lucide-plus" class="size-4" />
        Start a new AI chat
      </NuxtLink>
    </div>

    <!-- Recent forum activity -->
    <div class="mt-6">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Recent Discussions</h2>
        <NuxtLink to="/forums" class="text-xs text-violet-600 dark:text-violet-400 hover:underline">View all</NuxtLink>
      </div>
      <div v-if="threads && threads.length" class="space-y-2">
        <NuxtLink
          v-for="thread in threads.slice(0, 3)"
          :key="thread.id"
          :to="`/forums/${thread.projectId}/${thread.id}`"
          class="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <UIcon name="i-lucide-messages-square" class="size-4 text-zinc-400 shrink-0 mt-0.5" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ thread.title }}</p>
            <p class="text-xs text-zinc-400 mt-0.5">{{ thread.replyCount }} replies</p>
          </div>
        </NuxtLink>
      </div>
      <p v-else class="text-sm text-zinc-400 text-center py-4">No discussions yet</p>
    </div>
  </div>
</template>
