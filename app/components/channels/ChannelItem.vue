<script setup lang="ts">
import type { Channel } from '~/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const props = defineProps<{
  channel: Channel
  active?: boolean
}>()

const lastTime = computed(() => {
  if (!props.channel.lastMessage?.createdAt) return ''
  return dayjs(props.channel.lastMessage.createdAt.toDate()).fromNow()
})
</script>

<template>
  <div
    class="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors cursor-pointer"
    :class="active
      ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'"
  >
    <span class="text-base leading-none shrink-0 select-none">#</span>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate">{{ channel.name }}</p>
      <p v-if="channel.lastMessage" class="text-xs truncate opacity-60">
        {{ channel.lastMessage.senderName }}: {{ channel.lastMessage.text }}
      </p>
    </div>
    <span v-if="lastTime" class="text-xs opacity-50 shrink-0">{{ lastTime }}</span>
    <UIcon
      v-if="channel.aiModel"
      name="i-lucide-sparkles"
      class="size-3 shrink-0 text-violet-400 opacity-70"
    />
  </div>
</template>
