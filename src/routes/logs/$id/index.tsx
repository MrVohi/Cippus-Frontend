import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
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

async function fetchSimilar(id: string) {
  const url = import.meta.env.VITE_API_URL + '/api/v1/logs/' + id + '/similar'
  const response = await fetch(url)
  if (response.status === 404) return []
  if (!response.ok) return []
  const data = await response.json()
  return data.results ?? []
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

function LogDetail() {
  const { id } = Route.useParams()
  const user = useAuthStore((s) => s.user)

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

          <div className="mt-14 pt-10 border-t border-(--color-border)">
            <div className="label text-(--color-text-muted) mb-6">REPLIES</div>
            <p className="font-body text-[14px] italic text-(--color-text-placeholder)">
              Comments are coming in the next update.
            </p>
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
            {matches.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {matches.slice(0, 3).map((m: any) => (
                  <Link
                    key={m.post_id ?? m.id}
                    to="/logs/$id/"
                    params={{ id: String(m.post_id ?? m.id) }}
                    className="no-underline group"
                  >
                    <div className="font-body text-[13px] text-(--color-text-primary) group-hover:text-(--color-accent) transition-colors duration-[180ms] leading-snug">
                      {m.title}
                    </div>
                    <div className="font-body text-[11px] text-(--color-text-placeholder) mt-0.5">
                      {m.author?.username}
                    </div>
                  </Link>
                ))}
                {matches.length > 3 && (
                  <p className="font-body text-[12px] italic text-(--color-text-placeholder)">
                    +{matches.length - 3} more similar logs
                  </p>
                )}
                {post.stuck && (
                  <Link
                    to="/logs/$id/match"
                    params={{ id }}
                    className="font-body text-[12px] text-(--color-accent) no-underline border-b border-(--color-accent) pb-px self-start hover:opacity-70 transition-opacity duration-[180ms]"
                  >
                    View all matches →
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
    </div>
  )
}
