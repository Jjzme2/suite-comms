<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const { projects } = useProjects()
const { channels } = useChannels()
const sidebar = useSidebar()

const navItems = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Messages', icon: 'i-lucide-message-circle', to: '/messages' },
  { label: 'Channels', icon: 'i-lucide-hash', to: '/channels' },
  { label: 'AI Chat', icon: 'i-lucide-bot', to: '/ai' },
  { label: 'Forums', icon: 'i-lucide-messages-square', to: '/forums' }
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const showCreate = ref(false)
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-40 w-60 h-full shrink-0',
      'bg-white dark:bg-zinc-900 flex flex-col',
      'border-r border-zinc-200 dark:border-zinc-800',
      'transition-transform duration-300 ease-in-out',
      'lg:static lg:z-auto lg:translate-x-0',
      sidebar.isOpen.value ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <!-- Logo -->
    <div class="h-14 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <UIcon name="i-lucide-message-circle-more" class="size-5 text-violet-500" />
        <span class="font-semibold tracking-tight">ILYTAT Comms</span>
      </NuxtLink>
    </div>

    <!-- Main nav -->
    <nav class="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
      <ul class="space-y-0.5">
        <li v-for="item in navItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(item.to)
              ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'"
          >
            <UIcon :name="item.icon" class="size-4 shrink-0" />
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>

      <!-- Channels quick-list -->
      <div v-if="channels && channels.length" class="mt-4">
        <div class="flex items-center justify-between px-3 py-1">
          <p class="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Channels
          </p>
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            title="New channel"
            @click="showCreate = true"
          >
            <UIcon name="i-lucide-plus" class="size-3.5" />
          </button>
        </div>
        <ul class="mt-1 space-y-0.5">
          <li v-for="ch in channels.slice(0, 8)" :key="ch.id">
            <NuxtLink
              :to="`/channels/${ch.id}`"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="route.path === `/channels/${ch.id}`
                ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'"
            >
              <span class="text-base leading-none opacity-60">#</span>
              <span class="truncate">{{ ch.name }}</span>
              <UIcon v-if="ch.aiModel" name="i-lucide-sparkles" class="size-3 ml-auto shrink-0 text-violet-400 opacity-60" />
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Project forums -->
      <div v-if="projects && projects.length" class="mt-4">
        <p class="px-3 py-1 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Project Forums
        </p>
        <ul class="mt-1 space-y-0.5">
          <li v-for="project in projects" :key="project.id">
            <NuxtLink
              :to="`/forums/${project.id}`"
              class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
              :class="route.path.startsWith(`/forums/${project.id}`)
                ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-medium'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'"
            >
              <UIcon
                :name="project.icon || 'i-lucide-folder'"
                class="size-4 shrink-0"
                :class="COLOR_MAP[project.color] || 'text-zinc-400'"
              />
              <span class="truncate">{{ project.name }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Back to hub -->
    <div class="p-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
      <a
        :href="config.public.hubUrl"
        target="_blank"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <UIcon name="i-lucide-layout-grid" class="size-4 shrink-0" />
        Back to Hub
        <UIcon name="i-lucide-external-link" class="size-3 ml-auto shrink-0 opacity-50" />
      </a>
    </div>
  </aside>

  <ChannelsCreateChannelModal v-model:open="showCreate" />
</template>
