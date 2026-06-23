<script setup lang="ts">
const { models, loading, fetchModels, modelIcon, modelIconColor } = useAIModels()

const ollamaModels = computed(() => models.value.filter(m => m.provider === 'ollama'))
const lmStudioModels = computed(() => models.value.filter(m => m.provider === 'lmstudio'))

const hasAnyLocal = computed(() => ollamaModels.value.length > 0 || lmStudioModels.value.length > 0)

const OLLAMA_STEPS = [
  { text: 'Install Ollama', detail: 'Download from ollama.com or run: brew install ollama' },
  { text: 'Pull a model', detail: 'ollama pull llama3.2  (3B, great starting point)' },
  { text: 'Models appear here automatically when Ollama is running' }
]

const LMSTUDIO_STEPS = [
  { text: 'Install LM Studio', detail: 'Download from lmstudio.ai — available for Mac, Windows, Linux' },
  { text: 'Download a model', detail: 'Browse the built-in catalog and download any GGUF model' },
  { text: 'Start the local server', detail: 'Developer tab → Local Server → Start Server (default: port 1234)' },
  { text: 'Models appear here automatically once the server is running' }
]
</script>

<template>
  <div class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-key" class="size-4 text-emerald-500" />
        <span class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Local Models</span>
        <UBadge
          v-if="hasAnyLocal"
          :label="`${ollamaModels.length + lmStudioModels.length} running`"
          color="success"
          variant="soft"
          size="sm"
        />
        <UBadge
          v-else-if="!loading"
          label="None detected"
          color="neutral"
          variant="soft"
          size="sm"
        />
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        variant="ghost"
        color="neutral"
        size="xs"
        :loading="loading"
        @click="fetchModels"
      />
    </div>

    <div class="divide-y divide-zinc-200 dark:divide-zinc-800">
      <!-- ── Ollama ────────────────────────────────────────────────────────── -->
      <div class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <UIcon
            :name="modelIcon('local')"
            class="size-4 shrink-0"
            :class="ollamaModels.length ? 'text-emerald-500' : 'text-zinc-400'"
          />
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ollama</span>
          <UBadge
            v-if="ollamaModels.length"
            :label="`${ollamaModels.length} model${ollamaModels.length === 1 ? '' : 's'}`"
            color="success"
            variant="subtle"
            size="sm"
          />
          <span v-else class="text-xs text-zinc-400">Not running</span>
        </div>

        <!-- Running models -->
        <div v-if="ollamaModels.length" class="space-y-1 mb-2">
          <div
            v-for="m in ollamaModels"
            :key="m.id"
            class="flex items-center gap-2 text-xs px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg"
          >
            <div class="size-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span class="font-mono text-zinc-700 dark:text-zinc-300 truncate">{{ m.name }}</span>
          </div>
        </div>

        <!-- Setup guide -->
        <div v-if="!ollamaModels.length" class="space-y-2">
          <p class="text-xs text-zinc-500 mb-2">
            Ollama runs AI models 100% locally. No API key, no data leaves your machine.
          </p>
          <div
            v-for="(step, i) in OLLAMA_STEPS"
            :key="i"
            class="flex gap-2.5 text-xs text-zinc-600 dark:text-zinc-400"
          >
            <span class="size-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 font-medium text-zinc-500 text-[10px]">{{ i + 1 }}</span>
            <div>
              <p class="font-medium text-zinc-700 dark:text-zinc-300">{{ step.text }}</p>
              <p v-if="step.detail" class="font-mono text-zinc-500 mt-0.5">{{ step.detail }}</p>
            </div>
          </div>
          <div class="pt-1">
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline"
            >
              <UIcon name="i-lucide-external-link" class="size-3" />
              ollama.com
            </a>
          </div>
        </div>
      </div>

      <!-- ── LM Studio ────────────────────────────────────────────────────── -->
      <div class="p-4">
        <div class="flex items-center gap-2 mb-3">
          <UIcon
            :name="modelIcon('local-cloud')"
            class="size-4 shrink-0"
            :class="lmStudioModels.length ? 'text-amber-500' : 'text-zinc-400'"
          />
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-300">LM Studio</span>
          <UBadge
            v-if="lmStudioModels.length"
            :label="`${lmStudioModels.length} model${lmStudioModels.length === 1 ? '' : 's'}`"
            color="warning"
            variant="subtle"
            size="sm"
          />
          <span v-else class="text-xs text-zinc-400">Server not running</span>
        </div>

        <!-- Running models -->
        <div v-if="lmStudioModels.length" class="space-y-1 mb-2">
          <div
            v-for="m in lmStudioModels"
            :key="m.id"
            class="flex items-center gap-2 text-xs px-2 py-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg"
          >
            <div class="size-1.5 rounded-full bg-amber-500 shrink-0" />
            <span class="font-mono text-zinc-700 dark:text-zinc-300 truncate">{{ m.name }}</span>
          </div>
        </div>

        <!-- Setup guide -->
        <div v-if="!lmStudioModels.length" class="space-y-2">
          <p class="text-xs text-zinc-500 mb-2">
            LM Studio is a GUI app for running models locally. Sends traffic through a local server — no cloud API needed.
          </p>
          <div
            v-for="(step, i) in LMSTUDIO_STEPS"
            :key="i"
            class="flex gap-2.5 text-xs text-zinc-600 dark:text-zinc-400"
          >
            <span class="size-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 font-medium text-zinc-500 text-[10px]">{{ i + 1 }}</span>
            <div>
              <p class="font-medium text-zinc-700 dark:text-zinc-300">{{ step.text }}</p>
              <p v-if="step.detail" class="font-mono text-zinc-500 mt-0.5">{{ step.detail }}</p>
            </div>
          </div>
          <div class="pt-1">
            <a
              href="https://lmstudio.ai"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline"
            >
              <UIcon name="i-lucide-external-link" class="size-3" />
              lmstudio.ai
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
