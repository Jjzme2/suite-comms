import type { Timestamp } from 'firebase/firestore'

// ── Hub user directory ──────────────────────────────────────────────────────

export interface HubUser {
  uid: string
  displayName: string
  email: string
  photoURL: string
}

// ── Suite cross-app events ──────────────────────────────────────────────────

export type SuiteEventType =
  | 'task.created'
  | 'task.completed'
  | 'project.created'
  | 'project.completed'
  | 'timer.stopped'
  | 'note.created'
  | 'message.received'
  | 'forum.reply'
  | 'ai.chat.created'
  | 'channel.message'

// ── AI models ───────────────────────────────────────────────────────────────

export type ModelHosting = 'cloud' | 'local' | 'local-cloud'

export interface AIModel {
  id: string
  name: string
  provider: string
  hosting: ModelHosting
  description?: string
  contextLength?: number
  available?: boolean
  unavailableReason?: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Timestamp
}

export interface AIChat {
  id: string
  modelId: string
  title: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ── Direct messages ─────────────────────────────────────────────────────────

export interface Conversation {
  id: string
  participantIds: string[]
  participantNames: Record<string, string>
  participantPhotos: Record<string, string>
  lastMessage: {
    text: string
    senderId: string
    createdAt: Timestamp
  } | null
  unreadCount: Record<string, number>
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Message {
  id: string
  senderId: string
  text: string
  reactions: Record<string, string[]>
  createdAt: Timestamp
  edited: boolean
}

// ── Group channels ───────────────────────────────────────────────────────────

export interface Channel {
  id: string
  name: string
  description: string
  createdBy: string
  memberIds: string[]
  aiModel: string
  lastMessage: {
    text: string
    senderId: string
    senderName: string
    createdAt: Timestamp
  } | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ChannelMessage {
  id: string
  senderId: string
  senderName: string
  senderPhoto: string
  text: string
  role: 'user' | 'ai'
  modelId?: string
  reactions: Record<string, string[]>
  createdAt: Timestamp
  edited: boolean
}

// ── Project forums ──────────────────────────────────────────────────────────

export type ProjectColor =
  | 'violet' | 'red' | 'orange' | 'amber' | 'yellow'
  | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan'
  | 'sky' | 'blue' | 'indigo' | 'purple' | 'fuchsia'
  | 'pink' | 'rose'

export interface Project {
  id: string
  name: string
  description: string
  color: ProjectColor
  icon: string
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ForumThread {
  id: string
  projectId: string
  title: string
  content: string
  authorId: string
  authorName: string
  pinned: boolean
  replyCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ForumReply {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ── Colour helpers ──────────────────────────────────────────────────────────

export const COLOR_MAP: Record<string, string> = {
  violet: 'text-violet-500',
  blue: 'text-blue-500',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
  sky: 'text-sky-500',
  green: 'text-green-500',
  orange: 'text-orange-500',
  purple: 'text-purple-500',
  teal: 'text-teal-500',
  pink: 'text-pink-500',
  indigo: 'text-indigo-500',
  lime: 'text-lime-500',
  red: 'text-red-500',
  cyan: 'text-cyan-500',
  fuchsia: 'text-fuchsia-500'
}
