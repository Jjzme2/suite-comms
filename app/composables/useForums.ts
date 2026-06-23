import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  increment,
  serverTimestamp
} from 'firebase/firestore'
import { useCollection } from 'vuefire'
import type { ForumThread, ForumReply, Project } from '~/types'

export function useProjects() {
  const db = useFirestore()
  const user = useCurrentUser()

  const projects = useCollection<Project>(
    computed(() => user.value
      ? query(
          collection(db, 'users', user.value.uid, 'pm_projects'),
          orderBy('order', 'asc')
        )
      : null
    )
  )

  return { projects }
}

export function useForumThreads(projectId?: MaybeRefOrGetter<string | null>) {
  const db = useFirestore()
  const user = useCurrentUser()
  const { emitActivity, emitNotification } = useSuiteEvents()

  function threadsRef() {
    return collection(db, 'users', user.value!.uid, 'comms_forums')
  }

  const threads = useCollection<ForumThread>(
    computed(() => {
      if (!user.value) return null
      const pid = toValue(projectId)
      const q = pid
        ? query(threadsRef(), where('projectId', '==', pid), orderBy('pinned', 'desc'), orderBy('updatedAt', 'desc'))
        : query(threadsRef(), orderBy('pinned', 'desc'), orderBy('updatedAt', 'desc'))
      return q
    })
  )

  async function createThread(data: {
    projectId: string
    title: string
    content: string
  }) {
    if (!user.value) return
    const ref = await addDoc(threadsRef(), {
      ...data,
      authorId: user.value.uid,
      authorName: user.value.displayName || user.value.email || 'Unknown',
      pinned: false,
      replyCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    emitActivity('forum.reply', `Started discussion: ${data.title}`, { threadId: ref.id, projectId: data.projectId })
    return ref.id
  }

  async function pinThread(threadId: string, pinned: boolean) {
    await updateDoc(doc(db, 'users', user.value!.uid, 'comms_forums', threadId), { pinned })
  }

  async function deleteThread(threadId: string) {
    await deleteDoc(doc(db, 'users', user.value!.uid, 'comms_forums', threadId))
  }

  return { threads, createThread, pinThread, deleteThread }
}

export function useForumThread(threadId: MaybeRefOrGetter<string>) {
  const db = useFirestore()
  const user = useCurrentUser()
  const { emitNotification } = useSuiteEvents()

  function repliesRef() {
    return collection(db, 'users', user.value!.uid, 'comms_forums', toValue(threadId), 'replies')
  }

  const replies = useCollection<ForumReply>(
    computed(() => user.value
      ? query(repliesRef(), orderBy('createdAt', 'asc'))
      : null
    )
  )

  async function addReply(content: string) {
    if (!user.value || !content.trim()) return
    await addDoc(repliesRef(), {
      content: content.trim(),
      authorId: user.value.uid,
      authorName: user.value.displayName || user.value.email || 'Unknown',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    await updateDoc(doc(db, 'users', user.value.uid, 'comms_forums', toValue(threadId)), {
      replyCount: increment(1),
      updatedAt: serverTimestamp()
    })
    emitNotification(
      'forum.reply',
      'New forum reply',
      `A reply was added to a discussion`,
      { threadId: toValue(threadId) }
    )
  }

  async function deleteReply(replyId: string) {
    await deleteDoc(doc(db, 'users', user.value!.uid, 'comms_forums', toValue(threadId), 'replies', replyId))
    await updateDoc(doc(db, 'users', user.value!.uid, 'comms_forums', toValue(threadId)), {
      replyCount: increment(-1)
    })
  }

  return { replies, addReply, deleteReply }
}
