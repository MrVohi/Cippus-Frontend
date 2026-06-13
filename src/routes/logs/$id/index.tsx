import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useAuthStore } from '#/stores/useAuthStore'
import { fetchWithAuth } from '#/lib/api'

export const Route = createFileRoute('/logs/$id/')({
  component: LogDetail,
})

type Comment = {
  id: number
  content: string
  created_at: string
  updated_at: string
  user_id: number
  post_id: number
  author?: {
    user_id: number
    username: string
    avatar_url: string | null
  } | null
}

type ReportTarget = { type: 'comment'; id: number; username: string } | null

const REPORT_REASONS = [
  {
    id: 'spam',
    label: 'Spam',
    sub: 'Promotional, repetitive, or off-platform sales.',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate content',
    sub: 'Harassment, explicit imagery, threats.',
  },
  {
    id: 'off-topic',
    label: 'Off-topic',
    sub: 'Not about building or this log.',
  },
  { id: 'other', label: 'Other', sub: 'Something else worth a look.' },
]

const BASE = import.meta.env.VITE_API_URL

async function fetchPost(id: string) {
  const res = await fetch(BASE + '/api/v1/logs/' + id)
  if (!res.ok) throw new Error()
  return res.json()
}

async function fetchSimilar(id: string) {
  const res = await fetch(BASE + '/api/v1/logs/' + id + '/similar')
  if (res.status === 404 || !res.ok) return []
  const data = await res.json()
  return data.results ?? []
}

async function fetchLikes(postId: string) {
  const res = await fetchWithAuth('/api/v1/logs/' + postId + '/likes', {})
  if (!res.ok) return { likes: 0, user_liked: false }
  return res.json()
}

async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await fetch(BASE + '/api/v1/logs/' + postId + '/comments')
  if (!res.ok) return []
  const data = await res.json()
  return data.comments ?? []
}

async function togglePostLike(postId: string) {
  const res = await fetchWithAuth('/api/v1/logs/' + postId + '/likes', {
    method: 'POST',
  })
  if (!res.ok) throw new Error()
  return res.json()
}

async function createComment(postId: string, content: string) {
  const res = await fetchWithAuth('/api/v1/logs/' + postId + '/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error()
  return res.json()
}

async function updateComment(
  postId: string,
  commentId: number,
  content: string,
) {
  const res = await fetchWithAuth(
    '/api/v1/logs/' + postId + '/comments/' + commentId,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    },
  )
  if (!res.ok) throw new Error()
  return res.json()
}

async function removeComment(postId: string, commentId: number) {
  const res = await fetchWithAuth(
    '/api/v1/logs/' + postId + '/comments/' + commentId,
    {
      method: 'DELETE',
    },
  )
  if (!res.ok) throw new Error()
}

async function fetchCommentLikes(postId: string, commentId: number) {
  const res = await fetchWithAuth(
    '/api/v1/logs/' + postId + '/comments/' + commentId + '/likes',
    {},
  )
  if (!res.ok) return { likes: 0, user_liked: false }
  return res.json()
}

async function toggleCommentLike(postId: string, commentId: number) {
  const res = await fetchWithAuth(
    '/api/v1/logs/' + postId + '/comments/' + commentId + '/likes',
    {
      method: 'POST',
    },
  )
  if (!res.ok) throw new Error()
  return res.json()
}

async function submitReport(
  contentType: string,
  contentId: number,
  reason: string,
  extra: string,
) {
  const res = await fetchWithAuth('/api/v1/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content_type: contentType,
      content_id: contentId,
      reason,
      extra,
    }),
  })
  if (!res.ok) throw new Error()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return m + 'm ago'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h ago'
  const d = Math.floor(h / 24)
  if (d < 7) return d + 'd ago'
  return formatDate(iso)
}

function shortAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d < 7) return d + 'D'
  const w = Math.floor(d / 7)
  if (w < 5) return w + 'W'
  return Math.floor(d / 30) + 'MO'
}

function matchKind(distance: number): string {
  if (distance < 0.15) return 'EXACT'
  if (distance < 0.3) return 'SAME STAGE'
  return 'SIMILAR'
}

function MatchTile({ match }: { match: any }) {
  const kind = matchKind(match.distance ?? 1)
  const exact = kind === 'EXACT'
  const initial = (match.author?.username?.[0] ?? '?').toUpperCase()
  return (
    <Link
      to="/logs/$id"
      params={{ id: String(match.post_id ?? match.id) }}
      className={[
        'block no-underline p-[14px_16px] border transition-colors duration-[180ms]',
        exact
          ? 'border-(--color-accent)'
          : 'border-(--color-border) hover:border-(--color-text-secondary)',
      ].join(' ')}
    >
      <div className="flex justify-between items-baseline mb-1.5">
        <span
          className={[
            'label text-[10px] tracking-[0.16em]',
            exact ? 'text-(--color-accent)' : 'text-(--color-text-placeholder)',
          ].join(' ')}
        >
          {kind}
        </span>
        <span className="font-[JetBrains_Mono,ui-monospace,monospace] text-[10px] text-(--color-text-placeholder) tracking-[0.08em]">
          {shortAgo(match.created_at)}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="w-[22px] h-[22px] rounded-full bg-(--color-surface-raised) border border-(--color-border) grid place-items-center font-display text-[12px] font-medium text-(--color-text-muted) shrink-0">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="font-body text-[13px] text-(--color-text-primary) truncate">
            {match.author?.username}
          </div>
          <div className="font-body text-[12px] italic text-(--color-text-muted) truncate">
            {match.title}
          </div>
        </div>
      </div>
    </Link>
  )
}

function Avatar({
  user,
}: {
  user: { username: string; avatar_url: string | null }
}) {
  return (
    <div className="w-8 h-8 rounded-full bg-(--color-surface-raised) border border-(--color-border) grid place-items-center font-display text-[15px] font-medium text-(--color-text-muted) shrink-0 overflow-hidden">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.username}
          className="w-full h-full object-cover"
        />
      ) : (
        (user.username[0] || '?').toUpperCase()
      )}
    </div>
  )
}

function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserRole,
  onReport,
}: {
  comment: Comment
  postId: string
  currentUserId: number | undefined
  currentUserRole: string | undefined
  onReport: (target: ReportTarget) => void
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.content)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userLiked, setUserLiked] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const isOwn =
    currentUserId != null && currentUserId === comment.author?.user_id
  const canModerate =
    currentUserRole === 'moderator' || currentUserRole === 'admin'

  const { data: likesData } = useQuery({
    queryKey: ['comment-likes', postId, comment.id],
    queryFn: () => fetchCommentLikes(postId, comment.id),
  })
  const likeCount = likesData?.likes ?? 0

  useEffect(() => {
    if (likesData?.user_liked !== undefined) setUserLiked(likesData.user_liked)
  }, [likesData?.user_liked])

  const likeMutation = useMutation({
    mutationFn: () => toggleCommentLike(postId, comment.id),
    onMutate: () => setUserLiked((v) => !v),
    onSuccess: (data) => {
      qc.setQueryData(['comment-likes', postId, comment.id], data)
      setUserLiked(data.user_liked)
    },
    onError: () => setUserLiked((v) => !v),
  })

  const editMutation = useMutation({
    mutationFn: () => updateComment(postId, comment.id, editValue),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => removeComment(postId, comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  })

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="flex gap-3.5 group">
      {comment.author && <Avatar user={comment.author} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-body text-[14px] text-(--color-text-primary)">
            {comment.author?.username ?? 'unknown'}
          </span>
          <span className="font-body text-[12px] text-(--color-text-placeholder)">
            {timeAgo(comment.created_at)}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="font-body text-[11px] italic text-(--color-text-muted)">
              (edited)
            </span>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2 mt-1">
            <textarea
              className="w-full font-body text-[14px] text-(--color-text-primary) bg-(--color-surface-raised) border border-(--color-border) px-3 py-2 resize-none focus:outline-none focus:border-(--color-text-secondary) transition-colors duration-[180ms] leading-relaxed"
              rows={3}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => editMutation.mutate()}
                disabled={!editValue.trim() || editMutation.isPending}
                className="font-body text-[12px] tracking-[0.04em] text-(--color-text-primary) border border-(--color-border) px-3 py-1.5 hover:border-(--color-text-secondary) transition-colors duration-[180ms] disabled:opacity-40"
              >
                {editMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setEditValue(comment.content)
                }}
                className="font-body text-[12px] text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors duration-[180ms]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="font-body text-[14px] text-(--color-text-primary) leading-relaxed">
            {comment.content}
          </p>
        )}

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={() => currentUserId && likeMutation.mutate()}
            disabled={!currentUserId}
            className={[
              'flex items-center gap-1.5 font-body text-[12px] transition-colors duration-[180ms]',
              userLiked
                ? 'text-(--color-accent)'
                : 'text-(--color-text-placeholder) hover:text-(--color-text-muted)',
              !currentUserId ? 'cursor-default' : 'cursor-pointer',
            ].join(' ')}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={userLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {(isOwn || canModerate) && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="font-body text-[12px] text-(--color-text-placeholder) hover:text-(--color-text-muted) transition-colors duration-[180ms] opacity-0 group-hover:opacity-100"
              >
                Edit
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="font-body text-[12px] text-(--color-text-placeholder) hover:text-(--color-text-muted) transition-colors duration-[180ms] opacity-0 group-hover:opacity-100"
              >
                {deleteMutation.isPending ? '…' : 'Delete'}
              </button>
            </>
          )}

          {!isOwn && currentUserId && !editing && (
            <div className="relative ml-auto" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-[180ms] p-1 text-(--color-text-placeholder) hover:text-(--color-text-muted)"
                aria-label="More options"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <circle cx="12" cy="5" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="12" cy="19" r="1.6" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 w-36 bg-(--color-surface) border border-(--color-border) z-10 py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      onReport({
                        type: 'comment',
                        id: comment.id,
                        username: comment.author?.username ?? '',
                      })
                    }}
                    className="w-full text-left font-body text-[13px] text-(--color-text-primary) px-3 py-2 hover:bg-(--color-surface-raised) transition-colors duration-[120ms]"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportModal({
  target,
  onClose,
}: {
  target: ReportTarget
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [otherText, setOtherText] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const reportMutation = useMutation({
    mutationFn: () =>
      submitReport(target!.type, target!.id, selected!, otherText),
    onSuccess: () => setConfirmed(true),
    onError: () => setConfirmed(true),
  })

  useEffect(() => {
    if (!confirmed) return
    const t = setTimeout(onClose, 1900)
    return () => clearTimeout(t)
  }, [confirmed, onClose])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="sheet-enter relative bg-(--color-surface) border-t border-(--color-border) w-full">
        <div className="max-w-[560px] mx-auto px-8 pt-7 pb-8">
          {confirmed ? (
            <div className="py-6 flex flex-col items-center gap-3.5 text-center">
              <svg
                width="28"
                height="32"
                viewBox="0 0 32 36"
                aria-hidden="true"
                className="text-(--color-text-muted)"
              >
                <path
                  d="M11.5 9 L11 33 L21 33 L20.5 9 L18 7 L14 7.5 Z"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
              <span className="font-display text-[26px] font-medium text-(--color-text-primary)">
                Reported.
              </span>
              <span className="font-body text-[14px] text-(--color-text-muted)">
                We'll take a look.
              </span>
              <div className="mt-3.5 w-20 h-0.5 bg-(--color-border) relative overflow-hidden rounded-sm">
                <div className="close-bar absolute inset-y-0 left-0 bg-(--color-text-muted)" />
              </div>
              <span className="label text-(--color-text-placeholder) text-[10px] tracking-[0.08em]">
                CLOSING
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-1.5">
                <h2 className="font-display text-[26px] font-medium text-(--color-text-primary) m-0">
                  Report this content
                </h2>
                <span className="label text-(--color-text-placeholder) text-[10px]">
                  Comment · {target?.username}
                </span>
              </div>
              <p className="font-body text-[14px] text-(--color-text-muted) leading-relaxed mb-5 max-w-[460px]">
                Tell us what you saw. A moderator will read it within a day or
                two.
              </p>
              <div className="border border-(--color-border) bg-(--color-surface-raised) overflow-hidden">
                {REPORT_REASONS.map((r, i) => {
                  const isSelected = selected === r.id
                  const isLast = i === REPORT_REASONS.length - 1
                  return (
                    <div key={r.id}>
                      <label
                        className={[
                          'flex items-center gap-3.5 px-4 py-3.5 cursor-pointer transition-colors duration-[120ms]',
                          isSelected
                            ? 'bg-(--color-surface)'
                            : 'hover:bg-(--color-surface)',
                          !isLast ? 'border-b border-(--color-border)' : '',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'w-[18px] h-[18px] rounded-full border flex items-center justify-center shrink-0 transition-colors duration-[120ms]',
                            isSelected
                              ? 'border-(--color-text-primary)'
                              : 'border-(--color-text-muted)',
                          ].join(' ')}
                        >
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-(--color-text-primary)" />
                          )}
                        </span>
                        <input
                          type="radio"
                          name="report-reason"
                          value={r.id}
                          className="sr-only"
                          onChange={() => setSelected(r.id)}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block font-body text-[15px] text-(--color-text-primary)">
                            {r.label}
                          </span>
                          <span className="block font-body text-[12px] text-(--color-text-muted) mt-0.5">
                            {r.sub}
                          </span>
                        </span>
                      </label>
                      {r.id === 'other' && isSelected && (
                        <div className="px-4 pb-4 pt-1 bg-(--color-surface)">
                          <div className="label text-(--color-text-placeholder) text-[10px] tracking-[0.05em] mb-1.5">
                            A BIT MORE (OPTIONAL)
                          </div>
                          <textarea
                            className="w-full bg-(--color-bg) border border-(--color-border) px-3 py-2.5 font-body text-[14px] text-(--color-text-primary) placeholder:text-(--color-text-placeholder) placeholder:italic resize-none focus:outline-none focus:border-(--color-text-secondary) transition-colors duration-[180ms] leading-relaxed"
                            rows={3}
                            placeholder="Tell us what stood out."
                            value={otherText}
                            onChange={(e) => setOtherText(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-end gap-6 mt-5">
                <button
                  onClick={onClose}
                  className="font-body text-[14px] text-(--color-text-muted) underline underline-offset-[3px] decoration-(--color-border) hover:text-(--color-text-primary) transition-colors duration-[180ms]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => reportMutation.mutate()}
                  disabled={!selected || reportMutation.isPending}
                  className={[
                    'font-body text-[14px] px-5 py-2.5 border transition-colors duration-[180ms]',
                    selected
                      ? 'bg-(--color-text-primary) text-(--color-bg) border-(--color-text-primary) hover:opacity-80'
                      : 'bg-(--color-surface-raised) text-(--color-text-muted) border-(--color-border) cursor-not-allowed',
                  ].join(' ')}
                >
                  {reportMutation.isPending ? 'Submitting…' : 'Submit report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LogDetail() {
  const { id } = Route.useParams()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const [reportTarget, setReportTarget] = useState<ReportTarget>(null)
  const [userLiked, setUserLiked] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })
  const post = data?.post

  const { data: similarData } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => fetchSimilar(id),
    enabled: !!post,
  })
  const matches: any[] = similarData ?? []

  const { data: likesData } = useQuery({
    queryKey: ['post-likes', id],
    queryFn: () => fetchLikes(id),
    enabled: !!post,
  })
  const likeCount = likesData?.likes ?? 0

  useEffect(() => {
    if (likesData?.user_liked !== undefined) setUserLiked(likesData.user_liked)
  }, [likesData?.user_liked])

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => fetchComments(id),
    enabled: !!post,
  })
  const comments: Comment[] = commentsData ?? []

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['post-likes', id] })
      const prev = qc.getQueryData(['post-likes', id])
      const nextLiked = !userLiked
      setUserLiked(nextLiked)
      qc.setQueryData(['post-likes', id], (old: any) => ({
        ...old,
        likes: nextLiked
          ? (old?.likes ?? 0) + 1
          : Math.max((old?.likes ?? 1) - 1, 0),
      }))
      return { prev }
    },
    onSuccess: (likeData) => {
      qc.setQueryData(['post-likes', id], likeData)
      setUserLiked(likeData.user_liked)
    },
    onError: (_err, _v, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) qc.setQueryData(['post-likes', id], ctx.prev)
      setUserLiked((v) => !v)
    },
  })

  const commentMutation = useMutation({
    mutationFn: () => createComment(id, newComment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', id] })
      setNewComment('')
    },
  })

  const editor = useEditor({
    editable: false,
    extensions: [StarterKit],
  })

  useEffect(() => {
    if (!post?.content) return
    try {
      editor.commands.setContent(JSON.parse(post.content))
    } catch {
      editor.commands.setContent(post.content)
    }
  }, [editor, post])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center">
        <p className="font-body text-sm italic text-(--color-text-muted)">
          Loading…
        </p>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center">
        <p className="font-body text-sm italic text-(--color-text-muted)">
          Something went wrong. Try again later.
        </p>
      </div>
    )
  }

  const category = post.categories?.[0]?.name ?? ''
  const isOwner = user?.id === post.author_id

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <section
        className="row-enter max-w-[1240px] mx-auto w-full px-4 sm:px-8 lg:px-14 pt-11 pb-9"
        style={{ animationDelay: '0ms' }}
      >
        <div className="flex items-center gap-2.5 mb-7">
          <Link
            to="/logs"
            search={{ sort: 'recent' }}
            className="font-body text-[13px] text-(--color-text-muted) no-underline hover:text-(--color-text-primary) transition-colors duration-[180ms]"
          >
            ← The road
          </Link>
          {category && (
            <>
              <span
                aria-hidden
                className="w-[3px] h-[3px] rounded-full bg-(--color-text-placeholder) inline-block"
              />
              <Link
                to="/category/$id"
                params={{ id: category.toLowerCase() }}
                className="label text-(--color-text-placeholder) no-underline hover:text-(--color-text-muted) transition-colors duration-[180ms]"
              >
                {category.toUpperCase()}
              </Link>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-end gap-8 lg:gap-12">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-3.5">
              <span className="label text-(--color-text-muted)">
                {post.author?.username?.toUpperCase()}
              </span>
              {isOwner && (
                <Link
                  to="/logs/$id/edit"
                  params={{ id }}
                  className="font-body text-[12px] text-(--color-text-muted) no-underline border-b border-(--color-border) pb-px hover:text-(--color-text-primary) hover:border-(--color-text-primary) transition-colors duration-[180ms]"
                >
                  Edit
                </Link>
              )}
            </div>
            <h1 className="font-display text-[44px] sm:text-[56px] lg:text-[72px] font-medium tracking-[-0.012em] leading-[1.02] m-0 text-(--color-text-primary) text-pretty">
              {post.title}
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-6 lg:gap-9 pb-2.5 whitespace-nowrap">
            {[
              {
                label: 'STARTED',
                value: formatDate(post.created_at),
                mono: false,
              },
              {
                label: 'IN',
                value: daysAgo(post.created_at) + 'd',
                mono: true,
              },
              { label: 'REPLIES', value: String(comments.length), mono: false },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <div className="label text-(--color-text-placeholder) text-[10px] mb-1.5">
                  {label}
                </div>
                <div
                  className={[
                    mono
                      ? 'font-[JetBrains_Mono,ui-monospace,monospace] text-[22px] tracking-[0.02em]'
                      : 'font-display text-[28px] tracking-[-0.005em]',
                    'font-medium text-(--color-text-primary) leading-none',
                  ].join(' ')}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {post.stuck ? (
        <div
          className="row-enter border-t border-b border-(--color-border) bg-(--color-bg)"
          style={{ animationDelay: '60ms' }}
        >
          <div className="max-w-[1240px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-4 flex items-center gap-3">
            <span
              aria-hidden
              className="live-dot w-1.5 h-1.5 rounded-full bg-(--color-accent) inline-block"
            />
            <span className="label text-(--color-accent)">STUCK</span>
            <span className="font-body text-[13px] italic text-(--color-text-muted)">
              Builder is stuck at this stage.
            </span>
            <Link
              to="/logs/$id/match"
              params={{ id }}
              className="font-body text-[13px] text-(--color-accent) no-underline border-b border-(--color-accent) pb-px ml-1 hover:opacity-70 transition-opacity duration-[180ms]"
            >
              Find matches →
            </Link>
          </div>
        </div>
      ) : (
        <div className="border-t border-(--color-border)" />
      )}

      <main
        className="row-enter max-w-[1240px] w-full mx-auto px-4 sm:px-8 lg:px-14 py-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-16 lg:gap-20 items-start"
        style={{ animationDelay: '120ms' }}
      >
        <div className="min-w-0">
          <div className="label text-(--color-text-muted) mb-6">JOURNAL</div>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full mb-8 border border-(--color-border) object-cover max-h-[480px]"
            />
          )}

          <div className="prose-cippus">
            <EditorContent editor={editor} />
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={() => user && likeMutation.mutate()}
              disabled={!user || likeMutation.isPending}
              className={[
                'flex items-center gap-2 font-body text-[13px] border px-3.5 py-2 transition-colors duration-[180ms]',
                userLiked
                  ? 'border-(--color-accent) text-(--color-accent)'
                  : 'border-(--color-border) text-(--color-text-muted) hover:border-(--color-text-secondary) hover:text-(--color-text-primary)',
                !user ? 'cursor-default opacity-60' : 'cursor-pointer',
              ].join(' ')}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill={userLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>
                {likeCount > 0
                  ? likeCount + (likeCount === 1 ? ' like' : ' likes')
                  : 'Like'}
              </span>
            </button>
            {!user && (
              <span className="font-body text-[12px] italic text-(--color-text-placeholder)">
                <Link
                  to="/auth/login"
                  className="not-italic text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors duration-[180ms]"
                >
                  Sign in
                </Link>{' '}
                to like or comment.
              </span>
            )}
          </div>

          <div className="mt-12 pt-10 border-t border-(--color-border)">
            <div className="label text-(--color-text-muted) mb-6">
              {comments.length > 0 ? 'REPLIES · ' + comments.length : 'REPLIES'}
            </div>

            {user && (
              <div className="flex gap-3.5 mb-8">
                <Avatar
                  user={{ username: user.username, avatar_url: user.avatarUrl }}
                />
                <div className="flex-1 flex flex-col gap-2">
                  <textarea
                    className="w-full font-body text-[14px] text-(--color-text-primary) bg-(--color-surface-raised) border border-(--color-border) px-3 py-2.5 resize-none focus:outline-none focus:border-(--color-text-secondary) transition-colors duration-[180ms] leading-relaxed placeholder:text-(--color-text-placeholder) placeholder:italic"
                    rows={2}
                    placeholder="Leave a reply…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        (e.metaKey || e.ctrlKey) &&
                        newComment.trim()
                      ) {
                        commentMutation.mutate()
                      }
                    }}
                  />
                  {newComment.trim() && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => commentMutation.mutate()}
                        disabled={commentMutation.isPending}
                        className="font-body text-[12px] tracking-[0.04em] text-(--color-text-primary) border border-(--color-border) px-3 py-1.5 hover:border-(--color-text-secondary) transition-colors duration-[180ms] disabled:opacity-40"
                      >
                        {commentMutation.isPending ? 'Posting…' : 'Reply'}
                      </button>
                      <span className="font-body text-[11px] text-(--color-text-placeholder)">
                        ⌘↵
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {comments.length === 0 ? (
              <p className="font-body text-[14px] italic text-(--color-text-placeholder)">
                No replies yet. Be the first.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {comments.map((c, i) => (
                  <div
                    key={c.id}
                    className="row-enter"
                    style={{ animationDelay: i * 40 + 'ms' }}
                  >
                    <CommentItem
                      comment={c}
                      postId={id}
                      currentUserId={user?.id}
                      currentUserRole={user?.role}
                      onReport={setReportTarget}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside
          className="row-enter hidden lg:flex flex-col gap-9 sticky top-6"
          style={{ animationDelay: '180ms' }}
        >
          <div>
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="label text-(--color-text-muted)">
                {matches.length > 0 ? 'MATCHES · ' + matches.length : 'MATCHES'}
              </span>
              {post.stuck && matches.length > 3 && (
                <Link
                  to="/logs/$id/match"
                  params={{ id }}
                  className="font-body text-[12px] text-(--color-text-muted) no-underline hover:text-(--color-text-primary) transition-colors duration-[180ms]"
                >
                  see all
                </Link>
              )}
            </div>
            {matches.length > 0 ? (
              <div className="flex flex-col gap-2">
                {matches.slice(0, 3).map((m: any) => (
                  <MatchTile key={m.post_id ?? m.id} match={m} />
                ))}
                {post.stuck && (
                  <Link
                    to="/logs/$id/match"
                    params={{ id }}
                    className="font-body text-[12px] text-(--color-accent) no-underline border-b border-(--color-accent) pb-px self-start mt-1 hover:opacity-70 transition-opacity duration-[180ms]"
                  >
                    View constellation →
                  </Link>
                )}
              </div>
            ) : (
              <p className="font-body text-[13px] italic text-(--color-text-placeholder)">
                No match moment yet.
              </p>
            )}
          </div>

          <div className="pt-5 border-t border-(--color-border) font-body text-[12px] italic text-(--color-text-placeholder) leading-relaxed">
            Carved by those who passed · found by those still on the way.
          </div>
        </aside>
      </main>

      {reportTarget && (
        <ReportModal
          target={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  )
}
