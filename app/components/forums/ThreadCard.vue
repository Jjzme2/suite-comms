<script setup lang="ts">
import type { ForumThread } from '~/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const props = defineProps<{
  thread: ForumThread
  projectId: string
}>()

const emit = defineEmits<{ pin: []; delete: [] }>()

const time = computed(() => dayjs(props.thread.updatedAt?.toDate()).fromNow())
</script>

<template>
  <UCard class="hover:shadow-md transition-shadow">
    <div class="flex items-start gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <UIcon v-if="thread.pinned" name="i-lucide-pin" class="size-3.5 text-violet-500 flex-shrink-0" />
          <NuxtLink
            :to="`/forums/${projectId}/${thread.id}`"
            class="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors line-clamp-2"
          >
            {{ thread.title }}
          </NuxtLink>
        </div>
        <p class="text-xs text-zinc-500 line-clamp-2 mb-2">
          {{ thread.content.replace(/<[^>]+>/g, '').slice(0, 160) }}
        </p>
        <div class="flex items-center gap-3 text-xs text-zinc-400">
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-user" class="size-3" />
            {{ thread.authorName }}
          </span>
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-message-square" class="size-3" />
            {{ thread.replyCount }} {{ thread.replyCount === 1 ? 'reply' : 'replies' }}
          </span>
          <span>{{ time }}</span>
        </div>
      </div>

      <UDropdownMenu
        :items="[[
          { label: thread.pinned ? 'Unpin' : 'Pin', icon: 'i-lucide-pin', onSelect: () => emit('pin') },
          { label: 'Delete', icon: 'i-lucide-trash-2', onSelect: () => emit('delete') }
        ]]"
      >
        <UButton icon="i-lucide-more-horizontal" variant="ghost" color="neutral" size="xs" />
      </UDropdownMenu>
    </div>
  </UCard>
</template>
