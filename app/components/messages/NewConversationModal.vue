<script setup lang="ts">
import type { HubUser } from '~/types'

const open = defineModel<boolean>('open', { default: false })

const { createConversation } = useConversations()
const { searchUsers } = useHubUsers()
const router = useRouter()
const toast = useToast()

const query = ref('')
const selected = ref<HubUser | null>(null)
const creating = ref(false)

const results = computed(() => searchUsers(query.value))
const showResults = computed(() => query.value.trim().length > 0 && !selected.value)

function pickUser(user: HubUser) {
  selected.value = user
  query.value = user.displayName || user.email
}

function clearSelection() {
  selected.value = null
  query.value = ''
}

async function startConversation() {
  if (!selected.value) return
  creating.value = true
  try {
    const id = await createConversation(
      selected.value.uid,
      selected.value.displayName || selected.value.email,
      selected.value.photoURL
    )
    open.value = false
    selected.value = null
    query.value = ''
    router.push(`/messages/${id}`)
  } catch {
    toast.add({ title: 'Could not start conversation', color: 'error' })
  } finally {
    creating.value = false
  }
}

watch(open, v => {
  if (!v) {
    selected.value = null
    query.value = ''
  }
})
</script>

<template>
  <UModal v-model:open="open" title="New Conversation">
    <template #body>
      <div class="space-y-3">
        <div class="relative">
          <UInput
            v-model="query"
            placeholder="Search by name or email…"
            icon="i-lucide-search"
            autofocus
            :trailing-icon="selected ? 'i-lucide-x' : undefined"
            @keydown.escape="clearSelection"
            @click:trailing="clearSelection"
          />

          <div
            v-if="showResults"
            class="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg overflow-hidden"
          >
            <div v-if="results.length" class="max-h-56 overflow-y-auto">
              <button
                v-for="user in results"
                :key="user.uid"
                class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                @click="pickUser(user)"
              >
                <UAvatar :src="user.photoURL" :alt="user.displayName || user.email" size="sm" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {{ user.displayName || user.email }}
                  </p>
                  <p v-if="user.displayName" class="text-xs text-zinc-400 truncate">{{ user.email }}</p>
                </div>
              </button>
            </div>
            <div v-else class="px-3 py-4 text-center text-xs text-zinc-400">
              No users found
            </div>
          </div>
        </div>

        <div v-if="selected" class="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg">
          <UAvatar :src="selected.photoURL" :alt="selected.displayName || selected.email" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {{ selected.displayName || selected.email }}
            </p>
            <p v-if="selected.displayName" class="text-xs text-zinc-400 truncate">{{ selected.email }}</p>
          </div>
          <UButton icon="i-lucide-x" variant="ghost" color="neutral" size="xs" @click="clearSelection" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="open = false">Cancel</UButton>
        <UButton color="violet" :loading="creating" :disabled="!selected" @click="startConversation">
          Start
        </UButton>
      </div>
    </template>
  </UModal>
</template>
