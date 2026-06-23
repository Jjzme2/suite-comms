<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{ projectId: string }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const { createThread } = useForumThreads()
const toast = useToast()

const title = ref('')
const saving = ref(false)
const enableAI = ref(false)
const aiModelId = ref('claude-sonnet-4-6')

const editor = new Editor({
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: 'Share your thoughts, ask a question, or start a discussion…' })
  ]
})

onUnmounted(() => editor.destroy())

async function save() {
  if (!title.value.trim() || editor.isEmpty) return
  saving.value = true
  try {
    await createThread({
      projectId: props.projectId,
      title: title.value.trim(),
      content: editor.getHTML(),
      ...(enableAI.value ? { aiModel: aiModelId.value } : {})
    })
    toast.add({ title: 'Discussion started', color: 'success' })
    emit('saved')
  } catch {
    toast.add({ title: 'Failed to post', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UCard>
    <div class="space-y-3">
      <UInput
        v-model="title"
        placeholder="Discussion title…"
        size="lg"
        class="font-medium"
      />
      <div class="tiptap-editor border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 min-h-32">
        <EditorContent :editor="editor" />
      </div>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UToggle v-model="enableAI" size="sm" color="violet" />
          <span class="text-xs text-zinc-500 dark:text-zinc-400">AI assistance</span>
          <AiModelPicker v-if="enableAI" v-model:model-id="aiModelId" />
        </div>
        <div class="flex gap-2">
          <UButton variant="ghost" color="neutral" @click="emit('cancel')">Cancel</UButton>
          <UButton
            color="violet"
            :loading="saving"
            :disabled="!title.trim() || editor.isEmpty"
            @click="save"
          >
            Post Discussion
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
