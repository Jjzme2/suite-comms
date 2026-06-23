<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const { createConversation } = useConversations()
const router = useRouter()
const toast = useToast()

const newEmail = ref('')
const newName = ref('')
const creating = ref(false)

async function startConversation() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const id = await createConversation(newEmail.value.trim(), newName.value.trim())
    open.value = false
    newEmail.value = ''
    newName.value = ''
    router.push(`/messages/${id}`)
  } catch {
    toast.add({ title: 'Could not start conversation', color: 'error' })
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="New Conversation">
    <template #body>
      <div class="space-y-3">
        <UFormField label="Contact name">
          <UInput v-model="newName" placeholder="Name" autofocus @keydown.enter="startConversation" />
        </UFormField>
        <UFormField label="User ID or email (optional)">
          <UInput v-model="newEmail" placeholder="user@example.com" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="open = false">Cancel</UButton>
        <UButton color="violet" :loading="creating" :disabled="!newName.trim()" @click="startConversation">
          Start
        </UButton>
      </div>
    </template>
  </UModal>
</template>
