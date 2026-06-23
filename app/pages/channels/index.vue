<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { channels } = useChannels()
const showCreate = ref(false)
</script>

<template>
  <div class="flex h-full">
    <!-- Channel list sidebar -->
    <div class="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900">
      <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Channels</h2>
        <UButton icon="i-lucide-plus" variant="ghost" color="neutral" size="xs" @click="showCreate = true" />
      </div>
      <div class="flex-1 overflow-y-auto scrollbar-thin p-2">
        <div v-if="channels && channels.length" class="space-y-0.5">
          <NuxtLink v-for="ch in channels" :key="ch.id" :to="`/channels/${ch.id}`">
            <ChannelsChannelItem :channel="ch" />
          </NuxtLink>
        </div>
        <div v-else class="flex flex-col items-center justify-center h-40 text-center">
          <UIcon name="i-lucide-hash" class="size-8 text-zinc-300 dark:text-zinc-600 mb-2" />
          <p class="text-sm text-zinc-400">No channels yet</p>
          <UButton variant="ghost" size="xs" class="mt-2" @click="showCreate = true">
            Create one
          </UButton>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <UIcon name="i-lucide-hash" class="size-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
        <p class="text-sm text-zinc-500">Select a channel or create a new one</p>
        <UButton color="violet" variant="soft" class="mt-3" @click="showCreate = true">
          New Channel
        </UButton>
      </div>
    </div>

    <ChannelsCreateChannelModal v-model:open="showCreate" />
  </div>
</template>
