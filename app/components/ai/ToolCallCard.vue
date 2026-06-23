<script setup lang="ts">
import type { AIToolCall } from '~/types'

const props = defineProps<{
  toolCall: AIToolCall
}>()

const expanded = ref(false)

const TOOL_META: Record<string, { label: string; icon: string }> = {
  list_pm_projects: { label: 'Listed PM projects', icon: 'i-lucide-list' },
  create_project: { label: 'Created project', icon: 'i-lucide-folder-plus' },
  create_task: { label: 'Created task', icon: 'i-lucide-circle-plus' },
  create_forum_thread: { label: 'Created forum thread', icon: 'i-lucide-message-square-plus' },
  list_comms_channels: { label: 'Listed channels', icon: 'i-lucide-hash' },
  create_channel: { label: 'Created channel', icon: 'i-lucide-plus-circle' }
}

const meta = computed(() => TOOL_META[props.toolCall.name] ?? { label: props.toolCall.name, icon: 'i-lucide-wrench' })

const hasResult = computed(() => props.toolCall.result !== undefined)
const succeeded = computed(() => hasResult.value && !props.toolCall.isError)
</script>

<template>
  <div
    class="rounded-lg border text-xs overflow-hidden transition-colors"
    :class="toolCall.isError
      ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20'
      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40'"
  >
    <!-- Header row -->
    <button
      class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      @click="expanded = !expanded"
    >
      <UIcon :name="meta.icon" class="size-3.5 shrink-0 text-violet-500" />
      <span class="flex-1 font-medium font-sans text-zinc-700 dark:text-zinc-300">{{ meta.label }}</span>
      <UIcon
        v-if="hasResult"
        :name="succeeded ? 'i-lucide-check-circle' : 'i-lucide-alert-circle'"
        class="size-3.5 shrink-0"
        :class="succeeded ? 'text-emerald-500' : 'text-rose-500'"
      />
      <div v-else class="size-3.5 shrink-0 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
      <UIcon
        :name="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="size-3 shrink-0 text-zinc-400"
      />
    </button>

    <!-- Expanded detail -->
    <div v-if="expanded" class="border-t border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-200 dark:divide-zinc-700">
      <div class="px-3 py-2">
        <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Input</p>
        <pre class="font-mono text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap break-all leading-relaxed">{{ JSON.stringify(toolCall.input, null, 2) }}</pre>
      </div>
      <div v-if="toolCall.result" class="px-3 py-2">
        <p class="text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5">Result</p>
        <p
          class="font-mono whitespace-pre-wrap leading-relaxed"
          :class="toolCall.isError ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-600 dark:text-zinc-300'"
        >{{ toolCall.result }}</p>
      </div>
    </div>
  </div>
</template>
