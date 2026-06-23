<script setup lang="ts">
const emit = defineEmits<{ created: [id: string] }>()

const open = defineModel<boolean>('open', { default: false })

const { createChannel } = useChannels()
const toast = useToast()
const router = useRouter()

const name = ref('')
const description = ref('')
const aiModel = ref('')
const creating = ref(false)

const modelOptions = QUICK_MODEL_OPTIONS

async function submit() {
  if (!name.value.trim()) return
  creating.value = true
  try {
    const id = await createChannel({
      name: name.value,
      description: description.value,
      aiModel: aiModel.value
    })
    if (id) {
      open.value = false
      name.value = ''
      description.value = ''
      aiModel.value = ''
      emit('created', id)
      router.push(`/channels/${id}`)
    }
  } catch {
    toast.add({ title: 'Could not create channel', color: 'error' })
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="New Channel">
    <template #body>
      <div class="space-y-4">
        <UFormField label="Channel name" required>
          <UInput
            v-model="name"
            placeholder="e.g. general"
            autofocus
            @keydown.enter="submit"
          />
          <template #hint>
            <span class="text-xs text-zinc-400">Lowercase, no spaces (auto-formatted)</span>
          </template>
        </UFormField>

        <UFormField label="Description">
          <UInput v-model="description" placeholder="What's this channel for?" />
        </UFormField>

        <UFormField label="AI model">
          <USelect
            v-model="aiModel"
            :options="modelOptions"
            option-attribute="label"
            value-attribute="value"
          />
          <template #hint>
            <span class="text-xs text-zinc-400 flex items-center gap-1">
              <UIcon name="i-lucide-sparkles" class="size-3 text-violet-400" />
              Members can Ask AI in this channel using the selected model
            </span>
          </template>
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="open = false">Cancel</UButton>
        <UButton
          color="violet"
          :loading="creating"
          :disabled="!name.trim()"
          @click="submit"
        >
          Create Channel
        </UButton>
      </div>
    </template>
  </UModal>
</template>
