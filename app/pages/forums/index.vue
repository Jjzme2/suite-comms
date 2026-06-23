<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { projects } = useProjects()
const { threads } = useForumThreads()
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">Forums</h1>
      <p class="text-sm text-zinc-500 mt-0.5">Project discussions and team conversations</p>
    </div>

    <div v-if="projects && projects.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="project in projects"
        :key="project.id"
        :to="`/forums/${project.id}`"
        class="group"
      >
        <UCard class="hover:shadow-md transition-all group-hover:border-violet-200 dark:group-hover:border-violet-800">
          <div class="flex items-center gap-3 mb-3">
            <div class="size-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <UIcon
                :name="project.icon || 'i-lucide-folder'"
                class="size-5"
                :class="COLOR_MAP[project.color] || 'text-zinc-400'"
              />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ project.name }}</p>
              <p class="text-xs text-zinc-400 truncate">{{ project.description || 'No description' }}</p>
            </div>
          </div>
          <p class="text-xs text-zinc-400 flex items-center gap-1">
            <UIcon name="i-lucide-messages-square" class="size-3.5" />
            {{ (threads?.filter(t => t.projectId === project.id).length ?? 0) }} discussions
          </p>
        </UCard>
      </NuxtLink>
    </div>

    <div v-else class="text-center py-16">
      <UIcon name="i-lucide-folder-open" class="size-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
      <h3 class="text-base font-medium text-zinc-700 dark:text-zinc-300 mb-1">No projects found</h3>
      <p class="text-sm text-zinc-400">Create a project in ILYTAT PM to start discussions</p>
    </div>
  </div>
</template>
