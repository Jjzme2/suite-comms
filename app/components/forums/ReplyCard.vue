<script setup lang="ts">
import type { ForumReply } from '~/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

const props = defineProps<{
  reply: ForumReply
  canDelete?: boolean
}>()

const emit = defineEmits<{ delete: [] }>()

const time = computed(() => dayjs(props.reply.createdAt?.toDate()).fromNow())
</script>

<template>
  <div class="flex gap-3">
    <div class="size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
      <UIcon name="i-lucide-user" class="size-4 text-zinc-500" />
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ reply.authorName }}</span>
        <span class="text-xs text-zinc-400">{{ time }}</span>
        <UButton
          v-if="canDelete"
          icon="i-lucide-trash-2"
          variant="ghost"
          color="neutral"
          size="xs"
          class="ml-auto opacity-0 group-hover:opacity-100"
          @click="emit('delete')"
        />
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="text-sm text-zinc-700 dark:text-zinc-300 tiptap-editor prose-sm" v-html="reply.content" />
    </div>
  </div>
</template>
