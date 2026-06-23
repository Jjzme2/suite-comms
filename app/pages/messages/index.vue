<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { conversations } = useConversations()
const showNewModal = ref(false)
</script>

<template>
  <div class="flex h-full">
    <!-- Sidebar -->
    <div class="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
      <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Messages</h2>
        <UButton icon="i-lucide-edit" variant="ghost" color="neutral" size="xs" @click="showNewModal = true" />
      </div>
      <div class="flex-1 overflow-y-auto scrollbar-thin p-2">
        <div v-if="conversations && conversations.length" class="space-y-0.5">
          <NuxtLink
            v-for="conv in conversations"
            :key="conv.id"
            :to="`/messages/${conv.id}`"
          >
            <MessagesConversationItem :conversation="conv" />
          </NuxtLink>
        </div>
        <div v-else class="flex flex-col items-center justify-center h-40 text-center">
          <UIcon name="i-lucide-message-circle" class="size-8 text-zinc-300 dark:text-zinc-600 mb-2" />
          <p class="text-sm text-zinc-400">No conversations yet</p>
          <UButton variant="ghost" size="xs" class="mt-2" @click="showNewModal = true">
            Start one
          </UButton>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-lucide-message-circle-more" class="size-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
        <p class="text-sm text-zinc-500">Select a conversation or start a new one</p>
        <UButton color="violet" variant="soft" class="mt-3" @click="showNewModal = true">
          New Message
        </UButton>
      </div>
    </div>

    <MessagesNewConversationModal v-model:open="showNewModal" />
  </div>
</template>
