<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const projectId = computed(() => route.params.projectId as string)

const { projects } = useProjects()
const { threads, createThread, pinThread, deleteThread } = useForumThreads(projectId)
const toast = useToast()

const project = computed(() => projects.value?.find(p => p.id === projectId.value))
const showComposer = ref(false)
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-zinc-400 mb-4">
      <NuxtLink to="/forums" class="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">Forums</NuxtLink>
      <UIcon name="i-lucide-chevron-right" class="size-3.5" />
      <span class="text-zinc-700 dark:text-zinc-300 font-medium">{{ project?.name ?? 'Project' }}</span>
    </div>

    <!-- Project header -->
    <div class="flex items-start justify-between mb-6">
      <div class="flex items-center gap-3">
        <div v-if="project" class="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <UIcon
            :name="project.icon || 'i-lucide-folder'"
            class="size-6"
            :class="COLOR_MAP[project.color] || 'text-zinc-400'"
          />
        </div>
        <div>
          <h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">{{ project?.name ?? 'Project Forum' }}</h1>
          <p v-if="project?.description" class="text-sm text-zinc-500">{{ project.description }}</p>
        </div>
      </div>
      <UButton color="violet" icon="i-lucide-plus" @click="showComposer = !showComposer">
        New Discussion
      </UButton>
    </div>

    <!-- Composer -->
    <div v-if="showComposer" class="mb-6">
      <ForumsThreadComposer
        :project-id="projectId"
        @saved="showComposer = false"
        @cancel="showComposer = false"
      />
    </div>

    <!-- Thread list -->
    <div v-if="threads && threads.length" class="space-y-3">
      <ForumsThreadCard
        v-for="thread in threads"
        :key="thread.id"
        :thread="thread"
        :project-id="projectId"
        @pin="pinThread(thread.id, !thread.pinned)"
        @delete="deleteThread(thread.id).then(() => toast.add({ title: 'Thread deleted', color: 'neutral' }))"
      />
    </div>

    <div v-else class="text-center py-12">
      <UIcon name="i-lucide-messages-square" class="size-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
      <p class="text-sm text-zinc-400">No discussions yet. Start one above.</p>
    </div>
  </div>
</template>
