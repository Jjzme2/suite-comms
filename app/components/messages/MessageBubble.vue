<script setup lang="ts">
import type { Message } from '~/types'
import dayjs from 'dayjs'

const props = defineProps<{
  message: Message
  isMine: boolean
  currentUid: string
}>()

const emit = defineEmits<{ react: [messageId: string, emoji: string] }>()

const QUICK_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '🔥', '🎉', '👀']

const time = computed(() => dayjs(props.message.createdAt?.toDate()).format('h:mm A'))

const reactionEntries = computed(() =>
  Object.entries(props.message.reactions ?? {}).filter(([, uids]) => uids.length > 0)
)

const showPicker = ref(false)

function hasReacted(emoji: string) {
  return (props.message.reactions?.[emoji] ?? []).includes(props.currentUid)
}
</script>

<template>
  <div class="group flex gap-2" :class="isMine ? 'justify-end' : 'justify-start'">
    <div class="max-w-[75%]">
      <!-- Bubble -->
      <div class="relative">
        <div
          class="px-3.5 py-2 rounded-2xl text-sm leading-relaxed"
          :class="isMine
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'"
        >
          {{ message.text }}
        </div>
        <!-- Quick-react on hover -->
        <div
          class="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity"
          :class="isMine ? '-left-10' : '-right-10'"
        >
          <UPopover v-model:open="showPicker">
            <UButton icon="i-lucide-smile-plus" variant="ghost" color="neutral" size="xs" />
            <template #content>
              <div class="flex gap-1 p-2">
                <button
                  v-for="emoji in QUICK_EMOJIS"
                  :key="emoji"
                  class="text-lg hover:scale-125 transition-transform px-0.5"
                  @click="emit('react', message.id, emoji); showPicker = false"
                >
                  {{ emoji }}
                </button>
              </div>
            </template>
          </UPopover>
        </div>
      </div>

      <!-- Timestamp -->
      <p class="text-xs text-zinc-400 mt-1" :class="isMine ? 'text-right' : 'text-left'">
        {{ time }}
        <span v-if="message.edited" class="ml-1 italic">(edited)</span>
      </p>

      <!-- Reactions -->
      <div v-if="reactionEntries.length" class="flex flex-wrap gap-1 mt-1" :class="isMine ? 'justify-end' : 'justify-start'">
        <button
          v-for="[emoji, uids] in reactionEntries"
          :key="emoji"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
          :class="hasReacted(emoji)
            ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'"
          @click="emit('react', message.id, emoji)"
        >
          <span>{{ emoji }}</span>
          <span>{{ uids.length }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
