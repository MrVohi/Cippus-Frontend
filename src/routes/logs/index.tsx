
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'
import { useAuthStore } from '#/stores/useAuthStore'

export const Route = createFileRoute('/logs/$id/')({
  component: LogDetail,
})

async function fetchPost(id: string) {
  const url = import.meta.env.VITE_API_URL + '/api/v1/logs/' + id
  const response = await fetch(url)
  if (!response.ok) throw new Error()
  return response.json()
}

async function fetchLikes(id: string) {
  const res = await fetch(import.meta.env.VITE_API_URL + '/api/v1/logs/' + id + '/likes')
  if (!res.ok) throw new Error()
  return res.json()
}

async function likePost(id: string, token: string) {
  const res = await fetch(import.meta.env.VITE_API_URL + '/api/v1/logs/' + id + '/likes', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    credentials: 'include',
  })
  if (!res.ok) throw new Error()
  return res.json()
}

async function fetchComments(id: string) {
  const res = await fetch(import.meta.env.VITE_API_URL + '/api/v1/logs/' + id + '/comments')
  if (!res.ok) throw new Error()
  return res.json()
}

async function createComment(id: string, content: string, token: string) {
  const res = await fetch(import.meta.env.VITE_API_URL + '/api/v1/logs/' + id + '/comments', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token 
    },
    credentials: 'include',
    body: JSON.stringify({ content }),
  })
  if (!res.ok) throw new Error()
  return res.json()
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

export function LogDetail() {
  const { id } = Route.useParams()
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

  const post = data?.post

  const editor = useEditor({
    editable: false,
    extensions: [StarterKit],
  })

  const { data: likesData, refetch: refetchLikes } = useQuery({
    queryKey: ['likes', id],
    queryFn: () => fetchLikes(id),
  })

  const likesCount = likesData?.likes ?? 0

  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => fetchComments(id),
  })

  const comments = commentsData?.comments ?? []
  const [commentContent, setCommentContent] = useState('')

  // 1. Le hook reste bien en haut pour React
  useEffect(() => {
    // On vérifie UNIQUEMENT l'éditeur et la présence du contenu. 
    // Le check '!post' provoquait l'erreur TypeScript car géré plus bas.
    if (!editor || !post?.content) return

    try {
      editor.commands.setContent(JSON.parse(post.content))
    } catch {
      editor.commands.setContent(post.content)
    }
  }, [editor, post?.content]) // On écoute uniquement la propriété de manière optionnelle

  // 2. Les gardes de rendu viennent juste après tous les hooks
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

  // 3. Le reste de ton code (category, isOwner, return JSX...)
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
            <div className="label text-(--color-text-muted) mb-3.5">
              {post.author?.username?.toUpperCase()}
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
            {isOwner && (
              <div className="flex items-end pb-0.5">
                <Link
                  to="/logs/$id/edit"
                  params={{ id }}
                  className="font-body text-[13px] text-(--color-text-muted) no-underline border-b border-(--color-border) pb-px hover:text-(--color-text-primary) hover:border-(--color-text-primary) transition-colors duration-[180ms]"
                >
                  Edit
                </Link>
              </div>
            )}
            <div className="flex items-end pb-0.5">
              <button
                onClick={async () => {
                  const token = useAuthStore.getState().token
                  if (!token) return
                  await likePost(id, token)
                  refetchLikes()
                }}
                className="font-body text-[13px] text-(--color-text-muted) border-b border-(--color-border) pb-px hover:text-(--color-text-primary) transition-colors duration-[180ms] bg-transparent cursor-pointer"
              >
                ♥ {likesCount}
              </button>
            </div>
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
              Builder is stuck at this stage — match moment may be available.
            </span>
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

          <div className="mt-14 pt-10 border-t border-(--color-border)">
            <div className="label text-(--color-text-muted) mb-6">REPLIES</div>

            {user && (
              <div className="mb-8 flex flex-col gap-3">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Leave a reply..."
                  rows={3}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color: 'var(--color-text-primary)',
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    padding: '10px 12px',
                    outline: 'none',
                    resize: 'vertical',
                    width: '100%',
                  }}
                />
                <button
                  onClick={async () => {
                    if (!commentContent.trim()) return
                    const token = useAuthStore.getState().token
                    if (!token) return
                    await createComment(id, commentContent, token)
                    setCommentContent('')
                    refetchComments()
                  }}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '10px 18px',
                    background: 'var(--color-accent)',
                    color: 'var(--color-text-on-accent)',
                    border: 'none',
                    cursor: 'pointer',
                    alignSelf: 'flex-end',
                  }}
                >
                  Reply
                </button>
              </div>
            )}

            <div className="flex flex-col gap-6">
              {comments.length === 0 ? (
                <p className="font-body text-[14px] italic text-(--color-text-placeholder)">
                  No replies yet. Be the first.
                </p>
              ) : (
                comments.map((comment: { ID: number; Author: { username: string }; Content: string; CreatedAt: string }) => (
                  <div key={comment.ID} className="border-b border-(--color-border) pb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-body text-[12px] text-(--color-text-muted)">
                        @{comment.Author.username}
                      </span>
                      <span className="font-body text-[11px] text-(--color-text-placeholder)">
                        {new Date(comment.CreatedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <p className="font-body text-[14px] text-(--color-text-secondary) m-0">
                      {comment.Content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside
          className="row-enter hidden lg:flex flex-col gap-9 sticky top-6"
          style={{ animationDelay: '180ms' }}
        >
          <div>
            <div className="label text-(--color-text-muted) mb-2.5">
              BUILDER
            </div>
            <div className="border border-(--color-border) p-4 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-(--color-surface-raised) border border-(--color-border) grid place-items-center font-display text-[17px] font-medium text-(--color-text-muted) shrink-0 overflow-hidden">
                {post.author?.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (post.author?.username?.[0] ?? '?').toUpperCase()
                )}
              </div>
              <div>
                <div className="font-body text-[14px] text-(--color-text-primary)">
                  {post.author?.username}
                </div>
                <div className="font-body text-[12px] italic text-(--color-text-muted) mt-0.5">
                  Building for {daysAgo(post.created_at)} days
                </div>
              </div>
            </div>
          </div>

          {post.categories?.length > 0 && (
            <div>
              <div className="label text-(--color-text-muted) mb-2.5">
                CATEGORIES
              </div>
              <div className="flex flex-wrap gap-2">
                {post.categories.map(
                  (cat: { category_id: number; name: string }) => (
                    <Link
                      key={cat.category_id}
                      to="/category/$id"
                      params={{ id: cat.name.toLowerCase() }}
                      className="font-body text-[12px] tracking-[0.1em] uppercase text-(--color-text-muted) no-underline border border-(--color-border) px-2.5 py-1 hover:text-(--color-text-primary) hover:border-(--color-text-secondary) transition-colors duration-[180ms]"
                    >
                      {cat.name}
                    </Link>
                  ),
                )}
              </div>
            </div>
          )}

          <div>
            <div className="label text-(--color-text-muted) mb-2.5">
              MATCHES
            </div>
            <p className="font-body text-[13px] italic text-(--color-text-placeholder)">
              Semantic matching coming soon.
            </p>
          </div>

          <div className="pt-5 border-t border-(--color-border) font-body text-[12px] italic text-(--color-text-placeholder) leading-relaxed">
            Carved by those who passed · found by those still on the way.
          </div>
        </aside>
      </main>
    </div>
  )
}
