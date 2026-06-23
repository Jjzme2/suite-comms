<script setup lang="ts">
import type { ChannelMessage } from '~/types'
import dayjs from 'dayjs'

const props = defineProps<{
  message: ChannelMessage
  currentUid: string
}>()

const emit = defineEmits<{ react: [messageId: string, emoji: string] }>()

const QUICK_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '🔥', '🎉', '👀']

const time = computed(() => dayjs(props.message.createdAt?.toDate()).format('h:mm A'))
const isAI = computed(() => props.message.role === 'ai')
const modelLabel = computed(() => isAI.value && props.message.modelId ? formatModelId(props.message.modelId) : '')

const reactionEntries = computed(() =>
  Object.entries(props.message.reactions ?? {}).filter(([, uids]) => uids.length > 0)
)

const showPicker = ref(false)

function hasReacted(emoji: string) {
  return (props.message.reactions?.[emoji] ?? []).includes(props.currentUid)
}
</script>

<template>
  <div class="group flex gap-3 px-4 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 relative">
    <!-- Avatar / AI icon -->
    <div class="shrink-0 mt-0.5">
      <div
        v-if="isAI"
        class="size-8 rounded-full flex items-center justify-center bg-violet-100 dark:bg-violet-900/40"
      >
        <UIcon name="i-lucide-sparkles" class="size-4 text-violet-500" />
      </div>
      <div
        v-else-if="message.senderPhoto"
        class="size-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700"
      >
        <img :src="message.senderPhoto" :alt="message.senderName" class="size-full object-cover" />
      </div>
      <div
        v-else
        class="size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-300"
      >
        {{ message.senderName.charAt(0).toUpperCase() }}
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <!-- Header row -->
      <div class="flex items-baseline gap-2 mb-0.5">
        <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {{ isAI ? modelLabel || 'AI' : message.senderName }}
        </span>
        <UBadge
          v-if="isAI"
          label="AI"
          color="violet"
          variant="soft"
          size="xs"
          class="py-0"
        />
        <span class="text-xs text-zinc-400">{{ time }}</span>
      </div>

      <!-- Message text (placeholder while AI is generating) -->
      <div
        v-if="!message.text"
        class="flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500 py-0.5"
      >
        <span class="flex gap-0.5">
          <span class="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style="animation-delay: 0ms" />
          <span class="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style="animation-delay: 150ms" />
          <span class="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style="animation-delay: 300ms" />
        </span>
        Thinking…
      </div>
      <p
        v-else
        class="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words"
        :class="isAI ? 'text-violet-900 dark:text-violet-100' : ''"
      >
        {{ message.text }}
      </p>

      <!-- Reactions -->
      <div v-if="reactionEntries.length" class="flex flex-wrap gap-1 mt-1.5">
        <button
          v-for="[emoji, uids] in reactionEntries"
          :key="emoji"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors"
          :class="hasReacted(emoji)
            ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
            : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'"
          @click="emit('react', message.id, emoji)"
        >
          <span>{{ emoji }}</span>
          <span>{{ uids.length }}</span>
        </button>
      </div>
    </div>

    <!-- Quick-react button (visible on hover) -->
    <div class="absolute right-4 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
</template>
