import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { LogRow } from '#/components/LogRow'
import { generateText } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

export const Route = createFileRoute('/category/$id')({
  component: RouteComponent,
})

type Category = { category_id: number; name: string }

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(import.meta.env.VITE_API_URL + '/api/v1/categories')
  if (!res.ok) throw new Error()
  const data = await res.json()
  return Array.isArray(data.category) ? data.category : []
}

async function fetchByCategory(categoryId: number) {
  const params = new URLSearchParams()
  params.set('category_id', String(categoryId))
  params.set('sort', 'recent')
  const url = import.meta.env.VITE_API_URL + '/api/v1/logs?' + params.toString()
  const response = await fetch(url)
  if (!response.ok) throw new Error()
  return response.json()
}

function getExcerpt(content: string): string {
  try {
    const json = JSON.parse(content)
    return generateText(json, [StarterKit]).slice(0, 160).trim()
  } catch {
    return ''
  }
}

function formatWhen(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (minutes < 60) return minutes + 'm ago'
  if (hours < 24) return hours + 'h ago'
  return days + 'd ago'
}

function RouteComponent() {
  const { id } = Route.useParams()
  const displayName = id.charAt(0).toUpperCase() + id.slice(1)

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  })

  const categoryId = categories.find(
    (c) => c.name.toLowerCase() === id,
  )?.category_id

  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', id, categoryId],
    queryFn: () => fetchByCategory(categoryId!),
    enabled: categoryId !== undefined,
  })

  const posts = data?.post ?? []

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <div
        className="row-enter max-w-[1320px] mx-auto w-full px-4 sm:px-8 lg:px-14 pt-10 pb-8"
        style={{ animationDelay: '0ms' }}
      >
        <Link
          to="/logs"
          search={{ sort: 'recent' }}
          className="inline-flex items-center gap-2 font-body text-[12px] tracking-[0.16em] uppercase text-(--color-text-muted) no-underline mb-5 hover:text-(--color-text-primary) transition-colors duration-[180ms]"
        >
          <span aria-hidden>←</span>
          All logs
        </Link>

        <div className="flex items-end justify-between gap-10">
          <div>
            <h1 className="font-display text-[56px] sm:text-[80px] lg:text-[96px] font-medium tracking-[-0.015em] leading-none m-0 text-(--color-text-primary)">
              {displayName}
            </h1>
            <div className="mt-[18px] flex items-center gap-3.5 font-body text-[15px] text-(--color-text-muted)">
              <span
                aria-hidden
                className="live-dot w-1.5 h-1.5 rounded-full bg-(--color-accent) inline-block"
              />
              <span className="italic">
                {isLoading
                  ? 'Loading…'
                  : `${posts.length} logs in ${displayName}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        className="row-enter border-t border-b border-(--color-border) bg-(--color-bg)"
        style={{ animationDelay: '60ms' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-14 py-[18px] flex items-center gap-6">
          <div className="flex-1 sm:flex-[0_0_360px] flex items-center gap-[10px] px-3.5 py-[9px] bg-(--color-surface-raised) border border-(--color-border) rounded-[var(--radius-sm)]">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="text-(--color-text-placeholder) shrink-0"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="M15.5 15.5 L20 20" strokeLinecap="round" />
            </svg>
            <span className="font-body text-[13px] italic text-(--color-text-placeholder)">
              Find a log in {displayName}
            </span>
          </div>

          <span className="hidden sm:block font-body text-[12px] tracking-[0.16em] uppercase text-(--color-text-placeholder) ml-auto">
            {posts.length} logs
          </span>
        </div>
      </div>

      <main className="max-w-[1320px] w-full mx-auto">
        {isError && (
          <p className="font-body text-sm italic text-(--color-text-muted) px-4 sm:px-8 lg:px-14 py-8">
            Something went wrong. Try again later.
          </p>
        )}
        {posts.map((post: any, i: number) => (
          <div
            key={post.post_id}
            className="row-enter"
            style={{ animationDelay: `${120 + i * 40}ms` }}
          >
            <LogRow
              id={post.post_id}
              builder={post.author?.username ?? ''}
              builderInitial={(post.author?.username?.[0] ?? '?').toUpperCase()}
              avatarUrl={post.author?.avatar_url ?? null}
              when={formatWhen(post.created_at)}
              title={post.title}
              excerpt={getExcerpt(post.content)}
              category={displayName}
              daysIn={Math.floor(
                (Date.now() - new Date(post.created_at).getTime()) / 86_400_000,
              )}
              isStuck={post.stuck}
            />
          </div>
        ))}
      </main>

      <footer className="max-w-[1320px] mx-auto w-full px-4 sm:px-8 lg:px-14 pt-9 pb-14 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="live-dot w-1.5 h-1.5 rounded-full bg-(--color-accent) inline-block"
          />
          <span className="font-body text-[12px] tracking-[0.16em] uppercase text-(--color-text-muted)">
            {posts.length} building in {displayName.toLowerCase()} right now
          </span>
        </div>
        <Link
          to="/logs"
          search={{ sort: 'recent' }}
          className="font-body text-[13px] text-(--color-text-primary) no-underline border-b border-(--color-text-primary) pb-0.5"
        >
          Older logs →
        </Link>
      </footer>
    </div>
  )
}
