<script setup lang="ts">
import type { ModelHosting } from '~/types'

const props = defineProps<{
  hosting: ModelHosting
  provider?: string
  size?: 'xs' | 'sm'
}>()

const { modelIcon, modelIconColor, modelIconLabel } = useAIModels()
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="{
      'ring-blue-200 bg-blue-50 dark:ring-blue-800 dark:bg-blue-950/40': hosting === 'cloud',
      'ring-emerald-200 bg-emerald-50 dark:ring-emerald-800 dark:bg-emerald-950/40': hosting === 'local',
      'ring-amber-200 bg-amber-50 dark:ring-amber-800 dark:bg-amber-950/40': hosting === 'local-cloud'
    }"
  >
    <UIcon
      :name="modelIcon(hosting)"
      class="size-3"
      :class="modelIconColor(hosting)"
    />
    <span
      :class="{
        'text-blue-700 dark:text-blue-300': hosting === 'cloud',
        'text-emerald-700 dark:text-emerald-300': hosting === 'local',
        'text-amber-700 dark:text-amber-300': hosting === 'local-cloud'
      }"
    >
      {{ modelIconLabel(hosting) }}
    </span>
  </span>
</template>
