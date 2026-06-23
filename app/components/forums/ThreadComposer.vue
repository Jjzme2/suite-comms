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
      content: editor.getHTML()
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
      <div class="flex justify-end gap-2">
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
  </UCard>
</template>
