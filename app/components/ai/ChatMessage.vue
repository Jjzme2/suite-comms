<script setup lang="ts">
import type { AIMessage } from '~/types'
import dayjs from 'dayjs'

const props = defineProps<{
  message: AIMessage
  streaming?: boolean
}>()

const time = computed(() => {
  if (!props.message.createdAt) return ''
  return dayjs(props.message.createdAt.toDate()).format('h:mm A')
})

const isUser = computed(() => props.message.role === 'user')
</script>

<template>
  <div class="flex gap-3" :class="isUser ? 'justify-end' : 'justify-start'">
    <!-- AI avatar -->
    <div v-if="!isUser" class="size-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
      <UIcon name="i-lucide-bot" class="size-4 text-violet-600 dark:text-violet-400" />
    </div>

    <div class="max-w-[80%] min-w-0">
      <div
        class="px-4 py-2.5 rounded-2xl text-sm chat-prose"
        :class="isUser
          ? 'bg-violet-600 text-white rounded-br-sm'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-html="message.content.replace(/\n/g, '<br>')" />
        <span v-if="streaming" class="inline-block w-2 h-4 bg-current opacity-70 animate-pulse ml-0.5" />
      </div>
      <p class="text-xs text-zinc-400 mt-1" :class="isUser ? 'text-right' : 'text-left'">
        {{ time }}
      </p>
    </div>

    <!-- User avatar placeholder -->
    <div v-if="isUser" class="size-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
      <UIcon name="i-lucide-user" class="size-4 text-zinc-500" />
    </div>
  </div>
</template>
