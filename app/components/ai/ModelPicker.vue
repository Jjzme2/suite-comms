<script setup lang="ts">
import type { AIModel } from '~/types'

const props = defineProps<{ modelId: string }>()
const emit = defineEmits<{ 'update:modelId': [id: string] }>()

const { models, loading, fetchModels, modelIcon, modelIconColor, isAvailable, getUnavailableReason } = useAIModels()

onMounted(fetchModels)

const selected = computed(() =>
  models.value.find(m => m.id === props.modelId) ?? models.value.find(m => isAvailable(m))
)

function select(model: AIModel) {
  emit('update:modelId', model.id)
}

const groupedModels = computed(() => {
  const groups: Record<string, AIModel[]> = { cloud: [], local: [], 'local-cloud': [] }
  for (const m of models.value) {
    groups[m.hosting]?.push(m)
  }
  return groups
})

const groupLabel: Record<string, string> = {
  cloud: 'Cloud',
  local: 'Local',
  'local-cloud': 'Local-Cloud'
}
</script>

<template>
  <UDropdownMenu>
    <UButton variant="outline" color="neutral" size="sm" class="gap-2 max-w-48">
      <UIcon
        v-if="selected"
        :name="modelIcon(selected.hosting)"
        class="size-3.5 shrink-0"
        :class="isAvailable(selected) ? modelIconColor(selected.hosting) : 'text-zinc-400'"
      />
      <span class="text-sm truncate" :class="selected && !isAvailable(selected) ? 'text-zinc-400' : ''">
        {{ selected?.name ?? 'Select model' }}
      </span>
      <UIcon name="i-lucide-chevrons-up-down" class="size-3 opacity-50 shrink-0" />
    </UButton>

    <template #content>
      <div class="py-1 min-w-64 max-h-96 overflow-y-auto scrollbar-thin">
        <UProgress v-if="loading" size="xs" class="mx-2 mb-1" />

        <template v-for="(group, type) in groupedModels" :key="type">
          <div v-if="group.length" class="px-2 pt-2 pb-1">
            <p class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <UIcon :name="modelIcon(type as any)" class="size-3" :class="modelIconColor(type as any)" />
              {{ groupLabel[type] }}
            </p>
          </div>

          <div
            v-for="model in group"
            :key="model.id"
            class="flex items-center gap-2 px-3 py-2 rounded mx-1 cursor-pointer transition-colors"
            :class="[
              model.id === modelId
                ? 'bg-violet-50 dark:bg-violet-950/40'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
              !isAvailable(model) ? 'opacity-50' : ''
            ]"
            @click="select(model)"
          >
            <UIcon
              :name="modelIcon(model.hosting)"
              class="size-3.5 shrink-0"
              :class="isAvailable(model) ? modelIconColor(model.hosting) : 'text-zinc-400'"
            />
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium truncate"
                :class="isAvailable(model)
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-400 dark:text-zinc-500'"
              >
                {{ model.name }}
              </p>
              <p v-if="!isAvailable(model) && getUnavailableReason(model)" class="text-xs text-rose-400 truncate">
                {{ getUnavailableReason(model) }}
              </p>
              <p v-else-if="model.description" class="text-xs text-zinc-500 truncate">
                {{ model.description }}
              </p>
            </div>
            <div class="shrink-0 flex items-center gap-1">
              <UIcon v-if="!isAvailable(model)" name="i-lucide-lock" class="size-3 text-zinc-400" />
              <UIcon v-else-if="model.id === modelId" name="i-lucide-check" class="size-3.5 text-violet-500" />
            </div>
          </div>
        </template>

        <div v-if="!loading && !models.length" class="px-3 py-4 text-center text-xs text-zinc-400">
          No models found
        </div>
      </div>
    </template>
  </UDropdownMenu>
</template>
