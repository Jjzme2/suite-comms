import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'

export interface ToolResult {
  result: string
  isError: boolean
  imageUrl?: string
}

const TOOL_LABELS: Record<string, string> = {
  get_user_context: 'reading your data',
  list_pm_projects: 'list projects',
  list_pm_tasks: 'list tasks',
  create_project: 'create project',
  create_task: 'create task',
  create_note: 'create note',
  update_task: 'update task',
  create_forum_thread: 'create forum thread',
  list_comms_channels: 'list channels',
  create_channel: 'create channel',
  generate_image: 'generate image'
}

export function toolDisplayLabel(name: string): string {
  return TOOL_LABELS[name] ?? name
}

export function useAISuiteTools() {
  const db = useFirestore()
  const user = useCurrentUser()
  const { emitActivity } = useSuiteEvents()

  async function executeTool(name: string, input: Record<string, unknown>): Promise<ToolResult> {
    try {
      if (!user.value) return { result: 'Not authenticated', isError: true }
      const uid = user.value.uid

      switch (name) {
        // ── Read: list PM projects ──────────────────────────────────────────
        case 'list_pm_projects': {
          const snap = await getDocs(
            query(collection(db, 'users', uid, 'pm_projects'), orderBy('order', 'asc'))
          )
          if (snap.empty) return { result: 'No projects found.', isError: false }
          const list = snap.docs.map(d => {
            const data = d.data()
            return `- ID: ${d.id}, Name: "${data.name}", Status: ${data.status}`
          }).join('\n')
          return { result: `PM Projects:\n${list}`, isError: false }
        }

        // ── Write: create PM project ────────────────────────────────────────
        case 'create_project': {
          const {
            name: pname,
            description = '',
            color = 'violet',
            icon = 'i-lucide-folder'
          } = input as { name: string; description?: string; color?: string; icon?: string }
          const ref = collection(db, 'users', uid, 'pm_projects')
          const existing = await getDocs(ref)
          const docRef = await addDoc(ref, {
            name: pname,
            description,
            color,
            icon,
            status: 'active',
            order: existing.size,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          await emitActivity('project.created', `Created project "${pname}" via AI`, { name: pname, projectId: docRef.id })
          return { result: `Project "${pname}" created (ID: ${docRef.id}).`, isError: false }
        }

        // ── Write: create PM task ───────────────────────────────────────────
        case 'create_task': {
          const {
            project_id: projectId,
            title,
            description = '',
            priority = 'medium',
            status = 'todo'
          } = input as {
            project_id: string
            title: string
            description?: string
            priority?: string
            status?: string
          }
          const ref = collection(db, 'users', uid, 'pm_tasks')
          const existing = await getDocs(
            query(ref, where('projectId', '==', projectId), where('status', '==', status))
          )
          await addDoc(ref, {
            projectId,
            title,
            description,
            status,
            priority,
            tags: [],
            checklist: [],
            dueDate: null,
            order: existing.size,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          await emitActivity('task.created', `Created task "${title}" via AI`, { projectId, title })
          return { result: `Task "${title}" created in project ${projectId}.`, isError: false }
        }

        // ── Write: create forum thread ──────────────────────────────────────
        case 'create_forum_thread': {
          const { project_id: projectId, title, content } = input as {
            project_id: string
            title: string
            content: string
          }
          const docRef = await addDoc(collection(db, 'users', uid, 'comms_forums'), {
            projectId,
            title,
            content,
            authorId: uid,
            authorName: user.value.displayName || user.value.email || 'Unknown',
            pinned: false,
            replyCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          await emitActivity('forum.reply', `Started discussion "${title}" via AI`, { threadId: docRef.id, projectId })
          return { result: `Forum thread "${title}" created (ID: ${docRef.id}).`, isError: false }
        }

        // ── Read: list Comms channels ───────────────────────────────────────
        case 'list_comms_channels': {
          const snap = await getDocs(
            query(
              collection(db, 'comms_channels'),
              where('memberIds', 'array-contains', uid)
            )
          )
          if (snap.empty) return { result: 'No channels found.', isError: false }
          const list = snap.docs.map(d => {
            const data = d.data()
            return `- ID: ${d.id}, Name: "#${data.name}", Members: ${data.memberIds?.length ?? 0}`
          }).join('\n')
          return { result: `Channels:\n${list}`, isError: false }
        }

        // ── Write: create channel ───────────────────────────────────────────
        case 'create_channel': {
          const { name: cname, description = '' } = input as { name: string; description?: string }
          const slug = cname.trim().toLowerCase().replace(/\s+/g, '-')
          const docRef = await addDoc(collection(db, 'comms_channels'), {
            name: slug,
            description,
            createdBy: uid,
            memberIds: [uid],
            aiModel: '',
            lastMessage: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          return { result: `Channel "#${slug}" created (ID: ${docRef.id}).`, isError: false }
        }

        // ── Read: list PM tasks ─────────────────────────────────────────────
        case 'list_pm_tasks': {
          const { project_id: projectId, status: filterStatus } = input as {
            project_id?: string
            status?: string
          }
          const ref = collection(db, 'users', uid, 'pm_tasks')
          const q = projectId
            ? query(ref, where('projectId', '==', projectId))
            : query(ref, orderBy('createdAt', 'desc'))
          const snap = await getDocs(q)
          if (snap.empty) return { result: 'No tasks found.', isError: false }
          let taskDocs = snap.docs
          if (filterStatus) taskDocs = taskDocs.filter(d => d.data().status === filterStatus)
          const list = taskDocs.slice(0, 30).map(d => {
            const data = d.data()
            return `- ID: ${d.id}, Title: "${data.title}", Status: ${data.status}, Priority: ${data.priority}`
          }).join('\n')
          return { result: `Tasks:\n${list}`, isError: false }
        }

        // ── Write: create PM note ───────────────────────────────────────────
        case 'create_note': {
          const { title, content, project_id: projectId } = input as {
            title: string
            content: string
            project_id?: string
          }
          const docRef = await addDoc(collection(db, 'users', uid, 'pm_notes'), {
            title,
            content,
            projectId: projectId ?? null,
            tags: [],
            pinned: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })
          await emitActivity('note.created', `Created note "${title}" via AI`, { noteId: docRef.id })
          return { result: `Note "${title}" created (ID: ${docRef.id}).`, isError: false }
        }

        // ── Write: update PM task ───────────────────────────────────────────
        case 'update_task': {
          const { task_id: taskId, status, priority, title: newTitle } = input as {
            task_id: string
            status?: string
            priority?: string
            title?: string
          }
          const updates: Record<string, unknown> = { updatedAt: serverTimestamp() }
          if (status) updates.status = status
          if (priority) updates.priority = priority
          if (newTitle) updates.title = newTitle
          await updateDoc(doc(db, 'users', uid, 'pm_tasks', taskId), updates)
          if (status === 'done') {
            await emitActivity('task.completed', `Completed a task via AI`, { taskId })
          }
          return { result: `Task updated successfully.`, isError: false }
        }

        // ── Read: user context summary ──────────────────────────────────────
        case 'get_user_context': {
          const [projectsSnap, tasksSnap] = await Promise.all([
            getDocs(collection(db, 'users', uid, 'pm_projects')),
            getDocs(collection(db, 'users', uid, 'pm_tasks'))
          ])
          const projectList = projectsSnap.docs
            .map(d => `"${d.data().name}" (${d.data().status}, ID: ${d.id})`)
            .join(', ') || 'none'
          const tasksByStatus = tasksSnap.docs.reduce<Record<string, number>>((acc, d) => {
            const s = d.data().status as string
            acc[s] = (acc[s] ?? 0) + 1
            return acc
          }, {})
          const taskSummary = Object.entries(tasksByStatus)
            .map(([s, n]) => `${n} ${s}`)
            .join(', ') || 'none'
          const lines = [
            `Name: ${user.value?.displayName || 'Unknown'}`,
            `Email: ${user.value?.email || 'Unknown'}`,
            `Projects (${projectsSnap.size}): ${projectList}`,
            `Tasks: ${taskSummary}`
          ]
          return { result: lines.join('\n'), isError: false }
        }

        // ── Image generation ────────────────────────────────────────────────
        case 'generate_image': {
          const { prompt, size, quality } = input as {
            prompt: string
            size?: '1024x1024' | '1792x1024' | '1024x1792'
            quality?: 'standard' | 'hd'
          }
          const res = await $fetch<{ imageUrl: string }>('/api/ai/generate-image', {
            method: 'POST',
            body: { prompt, size, quality }
          })
          return { result: `Image generated for: "${prompt}"`, isError: false, imageUrl: res.imageUrl }
        }

        default:
          return { result: `Unknown tool: ${name}`, isError: true }
      }
    } catch (e: unknown) {
      return {
        result: e instanceof Error ? e.message : 'Tool execution failed',
        isError: true
      }
    }
  }

  return { executeTool }
}
