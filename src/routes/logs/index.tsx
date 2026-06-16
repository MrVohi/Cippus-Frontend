import { Fragment, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { LogRow } from '#/components/LogRow'
import { generateText } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

export const Route = createFileRoute('/logs/')({
  validateSearch: (search): { category?: string; sort: string } => ({
    ...(typeof search.category === 'string' && search.category !== 'all'
      ? { category: search.category }
      : {}),
    sort: typeof search.sort === 'string' ? search.sort : 'recent',
  }),
  component: LogsPage,
})

type Category = { category_id: number; name: string }

async function fetchCategories(): Promise<Category[]> {
  const url = import.meta.env.VITE_API_URL + '/api/v1/categories'
  const res = await fetch(url)
  if (!res.ok) throw new Error()
  const data = await res.json()
  const cats: Category[] = Array.isArray(data.category) ? data.category : []
  return [{ category_id: 0, name: 'All' }, ...cats]
}

async function fetchPosts(category: string, sort: string, categoryId?: number) {
  const params = new URLSearchParams()
  if (category !== 'all' && categoryId) {
    params.set('category_id', String(categoryId))
  }
  params.set('sort', sort)
  const url = import.meta.env.VITE_API_URL + '/api/v1/logs?' + params.toString()
  const response = await fetch(url)
  if (!response.ok) throw new Error()
  return response.json()
}

function getExcerpt(content: string): string {
  const json = JSON.parse(content)
  return generateText(json, [StarterKit]).slice(0, 160).trim()
}

function formatWhen(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (minutes < 60) {
    return minutes + 'm ago'
  }
  if (hours < 24) {
    return hours + 'h ago'
  }
  return days + 'd ago'
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'new', label: 'New' },
]

function SortPills({
  sort,
  onSortClick,
}: {
  sort: string
  onSortClick: (s: string) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const activeIndex = SORT_OPTIONS.findIndex((o) => o.value === sort)
    const el = refs.current[activeIndex]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [sort])

  return (
    <div className="relative flex gap-[22px]">
      {SORT_OPTIONS.map((option, i) => (
        <button
          key={option.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          onClick={() => onSortClick(option.value)}
          className="font-body text-[13px] tracking-[0.04em] py-[6px] bg-transparent border-none cursor-pointer leading-none transition-colors duration-[180ms]"
          style={{
            color:
              sort === option.value
                ? 'var(--color-text-primary)'
                : 'var(--color-text-muted)',
          }}
        >
          {option.label}
        </button>
      ))}
      <span
        aria-hidden
        className="absolute bottom-[-8px] h-px bg-(--color-text-primary) transition-all duration-[300ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </div>
  )
}

function CategoryPills({
  categories,
  category,
  onAllClick,
}: {
  categories: Category[]
  category: string
  onAllClick: () => void
}) {
  const allRef = useRef<HTMLButtonElement | null>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, top: 0 })
  const isAll = category === 'all'

  useEffect(() => {
    const el = allRef.current
    if (el && isAll)
      setIndicator({
        left: el.offsetLeft,
        width: el.offsetWidth,
        top: el.offsetTop + el.offsetHeight + 4,
      })
  }, [isAll])

  return (
    <div className="relative flex items-center flex-wrap gap-y-[10px]">
      <button
        ref={allRef}
        type="button"
        onClick={onAllClick}
        className="font-body text-[12px] tracking-[0.1em] uppercase bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors duration-[180ms]"
        style={{
          color: isAll
            ? 'var(--color-text-primary)'
            : 'var(--color-text-muted)',
          fontWeight: isAll ? 500 : 400,
        }}
      >
        All
      </button>

      {categories
        .filter((c) => c.name !== 'All')
        .map((cat) => (
          <Fragment key={cat.category_id}>
            <span
              aria-hidden
              className="w-px h-[11px] bg-(--color-border) mx-3.5"
            />
            <Link
              to="/category/$id"
              params={{ id: cat.name.toLowerCase() }}
              className="font-body text-[12px] tracking-[0.1em] uppercase no-underline whitespace-nowrap transition-colors duration-[180ms]"
              style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'var(--color-text-primary)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--color-text-muted)')
              }
            >
              {cat.name}
            </Link>
          </Fragment>
        ))}

      {isAll && (
        <span
          aria-hidden
          className="absolute h-px bg-(--color-text-primary) transition-all duration-[300ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            left: indicator.left,
            width: indicator.width,
            top: indicator.top,
          }}
        />
      )}
    </div>
  )
}

function LogsPage() {
  const { category: rawCategory, sort } = Route.useSearch()
  const category = rawCategory ?? 'all'
  const navigate = useNavigate()

  const { data: categories = [{ category_id: 0, name: 'All' }] } = useQuery<
    Category[]
  >({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  })

  const selectedCategoryId = categories.find(
    (c) => c.name.toLowerCase() === category,
  )?.category_id

  const { data, isLoading, isError } = useQuery({
    queryKey: ['posts', category, sort, selectedCategoryId],
    queryFn: () => fetchPosts(category, sort, selectedCategoryId),
  })

  function handleSortClick(s: string) {
    navigate({ to: '/logs', search: () => ({ category, sort: s }) })
  }

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <div
        className="row-enter max-w-[1320px] mx-auto w-full px-4 sm:px-8 lg:px-14 pt-8 lg:pt-10 pb-6 lg:pb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 lg:gap-10"
        style={{ animationDelay: '0ms' }}
      >
        <div>
          <div className="label mb-3">THE ROAD</div>
          <h1 className="font-display text-[40px] sm:text-[56px] lg:text-[64px] font-medium tracking-tight leading-none m-0 text-(--color-text-primary)">
            Logs
          </h1>
          <p className="font-body text-base italic text-(--color-text-muted) mt-3.5 mb-0 max-w-[480px] leading-normal">
            {isLoading
              ? 'Loading…'
              : `${data?.post?.length ?? 0} builders mid-build right now.`}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-7 pb-1.5">
          <span className="label text-(--color-text-placeholder)">SORT</span>
          <SortPills sort={sort} onSortClick={handleSortClick} />
        </div>
      </div>

      <div
        className="row-enter border-t border-b border-(--color-border) bg-(--color-bg)"
        style={{ animationDelay: '60ms' }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-14 py-[18px] flex flex-col gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
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
                What are you working on?
              </span>
            </div>
            <span className="hidden sm:block font-body text-[12px] tracking-[0.16em] uppercase text-(--color-text-placeholder) ml-auto">
              {data?.post?.length ?? 0} logs
            </span>
          </div>

          <div className="sm:flex items-center gap-7 pb-1.5 sm:hidden">
            <span className="label text-(--color-text-placeholder)">SORT</span>
            <SortPills sort={sort} onSortClick={handleSortClick} />
          </div>

          <CategoryPills
            categories={categories}
            category={category}
            onAllClick={() =>
              navigate({ to: '/logs', search: () => ({ sort }) })
            }
          />
        </div>
      </div>

      <main className="max-w-[1320px] w-full mx-auto">
        {isError && (
          <p className="font-body text-sm italic text-(--color-text-muted) px-14 py-8">
            Something went wrong. Try again later.
          </p>
        )}
        {data?.post?.map((post: any, i: number) => (
          <div
            key={post.post_id}
            className="row-enter"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <LogRow
              id={post.post_id}
              builder={post.author?.username ?? ''}
              builderInitial={(post.author?.username?.[0] ?? '?').toUpperCase()}
              avatarUrl={post.author?.avatar_url ?? null}
              imageUrl={post.image_url || null}
              when={formatWhen(post.created_at)}
              title={post.title}
              excerpt={getExcerpt(post.content)}
              category={post.categories?.[0]?.name ?? ''}
              daysIn={Math.floor(
                (Date.now() - new Date(post.created_at).getTime()) / 86_400_000,
              )}
              isStuck={post.stuck}
            />
          </div>
        ))}
      </main>

      <footer
        className="row-enter max-w-[1320px] mx-auto w-full px-14 pt-9 pb-14 flex items-center justify-between"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden
            className="live-dot w-1.5 h-1.5 rounded-full bg-(--color-accent) inline-block"
          />
          <span className="font-body text-[12px] tracking-[0.16em] uppercase text-(--color-text-muted)">
            {data?.post?.length ?? 0} building right now
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
