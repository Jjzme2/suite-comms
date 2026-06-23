<script setup lang="ts">
import type { Conversation } from '~/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const props = defineProps<{
  conversation: Conversation
  active?: boolean
}>()

const authStore = useAuthStore()

const otherUid = computed(() => {
  const uid = authStore.currentUser?.uid
  return props.conversation.participantIds.find(id => id !== uid) ?? ''
})

const otherName = computed(() => props.conversation.participantNames[otherUid.value] || 'Unknown')
const otherPhoto = computed(() => props.conversation.participantPhotos[otherUid.value] || '')
const unread = computed(() => {
  const uid = authStore.currentUser?.uid ?? ''
  return props.conversation.unreadCount?.[uid] ?? 0
})
const lastText = computed(() => props.conversation.lastMessage?.text || 'No messages yet')
const lastTime = computed(() => {
  const ts = props.conversation.lastMessage?.createdAt
  return ts ? dayjs(ts.toDate()).fromNow() : ''
})
</script>

<template>
  <div
    class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
    :class="active
      ? 'bg-violet-50 dark:bg-violet-950/40'
      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'"
  >
    <UAvatar :src="otherPhoto" :alt="otherName" size="sm" />
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-1">
        <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ otherName }}</span>
        <span class="text-xs text-zinc-400 flex-shrink-0">{{ lastTime }}</span>
      </div>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{{ lastText }}</p>
    </div>
    <UBadge v-if="unread > 0" :label="String(unread)" color="violet" variant="solid" size="xs" />
  </div>
</template>
