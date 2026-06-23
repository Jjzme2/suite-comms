<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const projectId = computed(() => route.params.projectId as string)
const threadId = computed(() => route.params.threadId as string)

const { projects } = useProjects()
const { threads } = useForumThreads(projectId)
const { replies, addReply, deleteReply } = useForumThread(threadId)
const authStore = useAuthStore()
const toast = useToast()

const project = computed(() => projects.value?.find(p => p.id === projectId.value))
const thread = computed(() => threads.value?.find(t => t.id === threadId.value))
useSeoMeta({ title: computed(() => thread.value?.title ?? 'Discussion') })

const replying = ref(false)
const submitting = ref(false)

const editor = new Editor({
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: 'Write a reply…' })
  ]
})

onUnmounted(() => editor.destroy())

async function submitReply() {
  if (editor.isEmpty) return
  submitting.value = true
  try {
    await addReply(editor.getHTML())
    editor.commands.clearContent()
    replying.value = false
    toast.add({ title: 'Reply posted', color: 'success' })
  } catch {
    toast.add({ title: 'Failed to post reply', color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-zinc-400 mb-4">
      <NuxtLink to="/forums" class="hover:text-zinc-600 dark:hover:text-zinc-200">Forums</NuxtLink>
      <UIcon name="i-lucide-chevron-right" class="size-3.5" />
      <NuxtLink :to="`/forums/${projectId}`" class="hover:text-zinc-600 dark:hover:text-zinc-200">{{ project?.name }}</NuxtLink>
      <UIcon name="i-lucide-chevron-right" class="size-3.5" />
      <span class="text-zinc-700 dark:text-zinc-300 truncate">{{ thread?.title }}</span>
    </div>

    <!-- Thread header -->
    <div v-if="thread" class="mb-6">
      <div class="flex items-center gap-2 mb-2">
        <UIcon v-if="thread.pinned" name="i-lucide-pin" class="size-4 text-violet-500" />
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ thread.title }}</h1>
      </div>
      <div class="flex items-center gap-3 text-xs text-zinc-400 mb-4">
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-user" class="size-3" />
          {{ thread.authorName }}
        </span>
        <span>{{ dayjs(thread.createdAt?.toDate()).fromNow() }}</span>
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-message-square" class="size-3" />
          {{ thread.replyCount }} {{ thread.replyCount === 1 ? 'reply' : 'replies' }}
        </span>
      </div>

      <!-- Original post -->
      <UCard>
        <div class="flex gap-3">
          <div class="size-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
            <UIcon name="i-lucide-user" class="size-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{{ thread.authorName }}</span>
              <UBadge label="OP" color="violet" variant="soft" size="xs" />
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="text-sm text-zinc-700 dark:text-zinc-300 tiptap-editor" v-html="thread.content" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Replies -->
    <div v-if="replies && replies.length" class="space-y-4 mb-6">
      <UCard v-for="reply in replies" :key="reply.id" class="group">
        <ForumsReplyCard
          :reply="reply"
          :can-delete="reply.authorId === authStore.currentUser?.uid"
          @delete="deleteReply(reply.id)"
        />
      </UCard>
    </div>

    <!-- Reply composer -->
    <div class="mt-6">
      <div v-if="!replying">
        <UButton color="violet" variant="soft" icon="i-lucide-reply" @click="replying = true">
          Write a reply
        </UButton>
      </div>
      <UCard v-else>
        <div class="tiptap-editor border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 min-h-24 mb-3">
          <EditorContent :editor="editor" />
        </div>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="replying = false">Cancel</UButton>
          <UButton
            color="violet"
            :loading="submitting"
            :disabled="editor.isEmpty"
            @click="submitReply"
          >
            Post Reply
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
