import { useState, type KeyboardEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/search')({
  validateSearch: (
    search,
  ): {
    mode: 'conversational' | 'faceted'
    category: string
    stage: string
    since: string
    q: string
  } => ({
    mode:
      typeof search.mode === 'string' && search.mode === 'faceted'
        ? 'faceted'
        : 'conversational',
    category: typeof search.category === 'string' ? search.category : '',
    stage: typeof search.stage === 'string' ? search.stage : '',
    since: typeof search.since === 'string' ? search.since : '',
    q: typeof search.q === 'string' ? search.q : '',
  }),
  component: SearchPage,
})

type Mode = 'conversational' | 'faceted'
type FilterKey = 'category' | 'stage' | 'since' | 'q'

type ConvProps = {
  mode: Mode
  onSwitch: (m: Mode) => void
  inputValue: string
  onInputChange: (val: string) => void
  onSubmit: () => void
  results: any[]
  isLoading: boolean
  submittedQuery: string
}

type FacetProps = {
  mode: Mode
  onSwitch: (m: Mode) => void
  filters: { category: string; stage: string; since: string; q: string }
  categories: { category_id: number; name: string }[]
  posts: any[]
  isLoading: boolean
  onFilter: (key: FilterKey, value: string) => void
  onClearFilter: (key: FilterKey) => void
  onClearAll: () => void
}

function LiveDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'var(--color-accent)',
        display: 'inline-block',
        boxShadow:
          '0 0 0 3px color-mix(in oklab, var(--color-accent) 15%, transparent)',
      }}
    />
  )
}

function extractText(content: string): string {
  if (content.startsWith('{')) {
    try {
      const texts: string[] = []
      function walk(node: any) {
        if (node.type === 'text' && node.text) texts.push(node.text)
        if (node.content) node.content.forEach(walk)
      }
      walk(JSON.parse(content))
      return texts.join(' ').trim().slice(0, 180)
    } catch {
      return content.slice(0, 180)
    }
  }
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'just now'
  if (h < 24) return h + 'h ago'
  return d + 'd ago'
}

function closenessFor(distance: number): { label: string; isExact: boolean } {
  if (distance < 0.15) return { label: 'EXACT MATCH', isExact: true }
  if (distance < 0.3) return { label: 'SAME STAGE', isExact: false }
  return { label: 'SAME CRAFT', isExact: false }
}

function MatchCard({ result, index }: { result: any; index: number }) {
  const [hovered, setHovered] = useState(false)
  const { label, isExact } = closenessFor(result.distance ?? 1)
  const initial = result.author?.username?.[0]?.toUpperCase() ?? '?'
  const builderName = result.author?.username ?? 'Builder ' + result.post_id
  const when = result.created_at ? timeAgo(result.created_at) : ''
  const note = extractText(result.content ?? '')
  const stage = result.stuck ? 'Stuck' : 'Active'
  const craft = result.categories?.[0]?.name ?? ''
  const daysIn = result.created_at
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(result.created_at).getTime()) / 86400000,
        ),
      )
    : 1

  return (
    <a
      href={'/logs/' + result.post_id}
      aria-label={'Open ' + result.title}
      className="row-enter"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '160px minmax(0,1fr) 200px',
        alignItems: 'center',
        gap: 36,
        padding: '32px 32px 32px 48px',
        borderBottom: '1px solid var(--color-border)',
        animationDelay: index * 60 + 'ms',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 14,
          bottom: 14,
          width: 2,
          background: 'var(--color-accent)',
          transformOrigin: 'top',
          transform: hovered ? 'scaleY(1)' : 'scaleY(0)',
          transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />

      <div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isExact
              ? 'var(--color-accent)'
              : 'var(--color-text-secondary)',
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        {isExact && (
          <p
            style={{
              margin: '10px 0 0',
              maxWidth: 130,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
              lineHeight: 1.4,
            }}
          >
            Looks like someone went through the exact same thing.
          </p>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-muted)',
            marginBottom: 8,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              fontWeight: 500,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-text-muted)',
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <span style={{ color: 'var(--color-text-primary)' }}>
            {builderName}
          </span>
          {when && (
            <>
              <span
                aria-hidden="true"
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: 'var(--color-text-secondary)',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {when}
              </span>
            </>
          )}
          {craft && (
            <>
              <span
                aria-hidden="true"
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: 'var(--color-text-secondary)',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {craft}
              </span>
            </>
          )}
        </div>

        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: '-0.005em',
            lineHeight: 1.15,
            color: 'var(--color-text-primary)',
          }}
        >
          {result.title}
        </h3>

        {note && (
          <p
            style={{
              margin: '10px 0 0',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              lineHeight: 1.55,
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
            }}
          >
            {note}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 24,
        }}
      >
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              marginBottom: 6,
            }}
          >
            STAGE
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.005em',
              lineHeight: 1,
            }}
          >
            {stage}
          </div>
          <span
            aria-hidden="true"
            style={{
              display: 'block',
              width: 24,
              height: 1,
              background: isExact
                ? 'var(--color-accent)'
                : 'var(--color-border)',
              margin: '8px 0 0 auto',
            }}
          />
          <div
            style={{
              marginTop: 8,
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.04em',
            }}
          >
            day {daysIn}
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
            transition: 'border-color var(--duration-fast) var(--ease-base)',
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6 L15 12 L9 18" />
          </svg>
        </div>
      </div>
    </a>
  )
}

function ModeToggle({
  mode,
  onSwitch,
}: {
  mode: Mode
  onSwitch: (m: Mode) => void
}) {
  const tabs: { id: Mode; label: string; hint: string }[] = [
    {
      id: 'conversational',
      label: 'Ask',
      hint: "describe what you're working on",
    },
    { id: 'faceted', label: 'Filter', hint: 'pick the shape of it' },
  ]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 36,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {tabs.map(({ id, label, hint }) => {
        const active = id === mode
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSwitch(id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: active
                ? '1px solid var(--color-accent)'
                : '1px solid transparent',
              padding: '0 0 12px',
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              cursor: 'pointer',
              position: 'relative',
              top: 1,
              transition: 'border-color var(--duration-fast) var(--ease-base)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                color: active
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
                transition: 'color var(--duration-fast) var(--ease-base)',
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontStyle: 'italic',
                color: active
                  ? 'var(--color-text-muted)'
                  : 'var(--color-text-secondary)',
                transition: 'color var(--duration-fast) var(--ease-base)',
              }}
            >
              {hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SearchPage() {
  const { mode, category, stage, since, q } = Route.useSearch()
  const navigate = useNavigate()
  const [animClass, setAnimClass] = useState('step-enter')
  const [inputValue, setInputValue] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  const categories = useQuery<{ category_id: number; name: string }[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/v1/categories',
      )
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      return data.category as { category_id: number; name: string }[]
    },
  })

  const categoryId = categories.data?.find(
    (c) => c.name === category,
  )?.category_id

  const params = new URLSearchParams()
  if (categoryId) {
    params.set('category_id', String(categoryId))
  }
  if (q) {
    params.set('q', q)
  }
  params.set('sort', 'recent')
  params.set('limit', '20')

  const switchMode = (m: Mode) => {
    setAnimClass(m === 'faceted' ? 'step-enter' : 'step-enter-back')
    navigate({
      to: '/search',
      search: () => ({ mode: m, category, stage, since, q }),
    })
  }

  function handleSubmit() {
    if (inputValue.trim() !== '') {
      setSubmittedQuery(inputValue.trim())
    }
  }

  const results = useQuery({
    queryKey: ['search', submittedQuery],
    queryFn: async () => {
      const res = await fetch(
        import.meta.env.VITE_API_URL +
          '/api/v1/search?q=' +
          submittedQuery +
          '&limit=10',
      )
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      return data.results
    },
    enabled: submittedQuery.trim().length > 0,
  })
  const posts = useQuery({
    queryKey: ['faceted-posts', category, stage, since, q],
    queryFn: async () => {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/v1/logs?' + params.toString(),
      )
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      return data.post
    },
    enabled: mode === 'faceted',
  })

  const onClearAll = () =>
    navigate({
      to: '/search',
      search: () => ({ mode, category: '', stage: '', since: '', q: '' }),
    })
  const onFilter = (key: FilterKey, value: string) =>
    navigate({
      to: '/search',
      search: () => ({ mode, category, stage, since, q, [key]: value }),
    })
  const onClearFilter = (key: FilterKey) =>
    navigate({
      to: '/search',
      search: () => ({ category, mode, stage, since, q, [key]: '' }),
    })

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        minHeight: '100vh',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        key={mode}
        className={
          'mx-auto max-w-[1320px] px-5 sm:px-10 lg:px-14 py-12 ' + animClass
        }
      >
        {mode === 'conversational' ? (
          <ConversationalMode
            mode={mode}
            onSwitch={switchMode}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
            results={results.data ?? []}
            isLoading={results.isLoading}
            submittedQuery={submittedQuery}
          />
        ) : (
          <FacetedMode
            mode={mode}
            onSwitch={switchMode}
            filters={{ category, stage, since, q }}
            categories={categories.data ?? []}
            posts={posts.data ?? []}
            isLoading={posts.isLoading}
            onFilter={onFilter}
            onClearFilter={onClearFilter}
            onClearAll={onClearAll}
          />
        )}
      </div>
    </div>
  )
}

const EXAMPLE_QUERIES = [
  'sourdough crumb is gummy at the base',
  'tube amp hums only on the lead channel',
  'mortise walls are tearing out',
]

function ConversationalMode({
  mode,
  onSwitch,
  inputValue,
  onInputChange,
  onSubmit,
  results,
  isLoading,
  submittedQuery,
}: ConvProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onSubmit()
  }

  return (
    <section>
      <ModeToggle mode={mode} onSwitch={onSwitch} />

      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          marginBottom: 16,
          marginTop: 48,
        }}
      >
        SEARCH &middot; CONVERSATIONAL
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(40px, 5vw, 72px)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          margin: 0,
          color: 'var(--color-text-primary)',
          maxWidth: 820,
        }}
      >
        What are you building right now?
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 17,
          fontStyle: 'italic',
          color: 'var(--color-text-muted)',
          margin: '18px 0 0',
          maxWidth: 560,
          lineHeight: 1.5,
        }}
      >
        Write it the way you&rsquo;d say it. We&rsquo;ll find builders at the
        same stage and situation &mdash; not the same words.
      </p>

      <div
        style={{
          marginTop: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '18px 20px',
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6" />
          <path d="M15.5 15.5 L20 20" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you are working on..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            letterSpacing: '0.02em',
            cursor: 'pointer',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          Find builders
        </button>
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}
        >
          OR ASK
        </span>
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onInputChange(q)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0 0 2px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
              borderBottom: '1px solid var(--color-border)',
              transition: 'color var(--duration-fast) var(--ease-base)',
            }}
          >
            &ldquo;{q}&rdquo;
          </button>
        ))}
      </div>

      {submittedQuery && (
        <section style={{ marginTop: 48 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
              }}
            >
              RESULTS
            </span>
            {!isLoading && results.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'var(--color-text-muted)',
                }}
              >
                {results.length} builder{results.length !== 1 ? 's' : ''},
                sorted by closeness
              </span>
            )}
          </div>

          {isLoading && (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontStyle: 'italic',
                color: 'var(--color-text-secondary)',
              }}
            >
              Searching...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div
              style={{
                padding: '48px 0',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontStyle: 'italic',
                color: 'var(--color-text-secondary)',
              }}
            >
              No builders found for that description.
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div style={{ border: '1px solid var(--color-border)' }}>
              {results.map((r: any, i: number) => (
                <MatchCard key={r.post_id ?? i} result={r} index={i} />
              ))}
            </div>
          )}
        </section>
      )}

      <footer
        style={{
          marginTop: 40,
          paddingTop: 32,
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LiveDot />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            matches refresh as they post
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--color-text-secondary)',
          }}
        >
          Not finding the right shape? Try Filter.
        </span>
      </footer>
    </section>
  )
}

const STAGE_OPTIONS = ['Early', 'Mid', 'Stuck', 'Nearly done']
const SINCE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
]

function FilterGroup({
  title,
  options,
  selectedValue,
  filterKey,
  onFilter,
}: {
  title: string
  options: { label: string; value: string }[]
  selectedValue: string
  filterKey: FilterKey
  onFilter: (key: FilterKey, value: string) => void
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {options.map((opt, i) => {
          const selected = opt.value === selectedValue
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilter(filterKey, selected ? '' : opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom:
                  i === options.length - 1
                    ? 'none'
                    : '1px solid var(--color-border)',
                background: 'transparent',
                border: 'none',
                borderBottomWidth: i === options.length - 1 ? 0 : 1,
                borderBottomStyle: 'solid',
                borderBottomColor: 'var(--color-border)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: selected
                      ? 'var(--color-accent)'
                      : 'transparent',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  {selected && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 3,
                        background: 'var(--color-bg)',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: selected
                      ? 'var(--color-text-primary)'
                      : 'var(--color-text-muted)',
                    transition: 'color var(--duration-fast) var(--ease-base)',
                  }}
                >
                  {opt.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FacetedLogRow({ post, index }: { post: any; index: number }) {
  const [hovered, setHovered] = useState(false)
  const initial = post.author?.username?.[0]?.toUpperCase() ?? '?'
  const builderName = post.author?.username ?? 'Builder ' + post.post_id
  const when = post.created_at ? timeAgo(post.created_at) : ''
  const note = extractText(post.content ?? '')
  const stage = post.stuck ? 'Stuck' : 'Active'
  const daysIn = post.created_at
    ? Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(post.created_at).getTime()) / 86400000,
        ),
      )
    : 1

  return (
    <a
      href={'/logs/' + post.post_id}
      aria-label={'Open ' + post.title}
      className="row-enter"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 120px 100px 48px',
        alignItems: 'center',
        gap: 20,
        padding: '22px 28px 22px 36px',
        borderBottom: '1px solid var(--color-border)',
        animationDelay: index * 50 + 'ms',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 14,
          bottom: 14,
          width: 2,
          background: 'var(--color-accent)',
          transformOrigin: 'top',
          transform: post.stuck || hovered ? 'scaleY(1)' : 'scaleY(0)',
          transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1)',
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 500,
            display: 'grid',
            placeItems: 'center',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          {initial}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginBottom: 4,
            }}
          >
            <span style={{ color: 'var(--color-text-primary)' }}>
              {builderName}
            </span>
            {when && (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: '50%',
                    background: 'var(--color-text-secondary)',
                    display: 'inline-block',
                    alignSelf: 'center',
                  }}
                />
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {when}
                </span>
              </>
            )}
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 19,
              fontWeight: 500,
              letterSpacing: '-0.005em',
              lineHeight: 1.2,
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {post.title}
          </h3>
          {note && (
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                lineHeight: 1.5,
                fontStyle: 'italic',
                color: 'var(--color-text-muted)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {note}
            </p>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: post.stuck
              ? 'var(--color-accent)'
              : 'var(--color-text-secondary)',
            marginBottom: 4,
          }}
        >
          STAGE
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.005em',
            lineHeight: 1,
          }}
        >
          {stage}
        </div>
        <span
          aria-hidden="true"
          style={{
            display: 'block',
            width: 20,
            height: 1,
            background: post.stuck
              ? 'var(--color-accent)'
              : 'var(--color-border)',
            margin: '6px auto 0',
          }}
        />
      </div>

      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            marginBottom: 4,
          }}
        >
          IN
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            color: 'var(--color-text-primary)',
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          {daysIn}d
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--color-border)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-text-muted)',
          justifySelf: 'end',
          transition: 'border-color var(--duration-fast) var(--ease-base)',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 6 L15 12 L9 18" />
        </svg>
      </div>
    </a>
  )
}

function FacetedMode({
  mode,
  onSwitch,
  filters,
  categories,
  posts,
  isLoading,
  onFilter,
  onClearFilter,
  onClearAll,
}: FacetProps) {
  const [inputQ, setInputQ] = useState(filters.q)

  function handleQKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onFilter('q', inputQ.trim())
  }

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.name,
  }))
  const activeFilters = [
    filters.category && {
      key: 'category' as FilterKey,
      kind: 'Category',
      label: filters.category,
    },
    filters.stage && {
      key: 'stage' as FilterKey,
      kind: 'Stage',
      label: filters.stage,
    },
    filters.since && {
      key: 'since' as FilterKey,
      kind: 'Active',
      label: filters.since,
    },
    filters.q && { key: 'q' as FilterKey, kind: 'Search', label: filters.q },
  ].filter(Boolean) as { key: FilterKey; kind: string; label: string }[]

  return (
    <section>
      <ModeToggle mode={mode} onSwitch={onSwitch} />

      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          marginBottom: 14,
          marginTop: 48,
        }}
      >
        SEARCH &middot; FACETED
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 4vw, 56px)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          margin: 0,
          color: 'var(--color-text-primary)',
        }}
      >
        Pick the shape of it.
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          fontStyle: 'italic',
          color: 'var(--color-text-muted)',
          margin: '14px 0 0',
          maxWidth: 500,
          lineHeight: 1.5,
        }}
      >
        Craft, stage, last active &mdash; narrow the road until you can see
        who&rsquo;s on it.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0,1fr)',
          gap: 36,
          alignItems: 'flex-start',
          marginTop: 40,
        }}
      >
        <aside>
          {categoryOptions.length > 0 && (
            <FilterGroup
              title="CATEGORY"
              options={categoryOptions}
              selectedValue={filters.category}
              filterKey="category"
              onFilter={onFilter}
            />
          )}
          <FilterGroup
            title="CURRENT STAGE"
            options={STAGE_OPTIONS.map((s) => ({
              label: s,
              value: s.toLowerCase(),
            }))}
            selectedValue={filters.stage}
            filterKey="stage"
            onFilter={onFilter}
          />
          <FilterGroup
            title="LAST ACTIVE"
            options={SINCE_OPTIONS}
            selectedValue={filters.since}
            filterKey="since"
            onFilter={onFilter}
          />
          <div
            style={{
              marginTop: 8,
              paddingTop: 20,
              borderTop: '1px solid var(--color-border)',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Stages are how the builder describes the work &mdash; not a status
            they earn.
          </div>
        </aside>

        <div
          style={{
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '14px 18px',
              background: 'var(--color-surface-raised)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="M15.5 15.5 L20 20" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={inputQ}
                onChange={(e) => setInputQ(e.target.value)}
                onKeyDown={handleQKeyDown}
                placeholder="Keyword filter..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            {!isLoading && posts.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <LiveDot />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {posts.length} match{posts.length !== 1 ? 'es' : ''}
                </span>
              </div>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                padding: '16px 24px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                }}
              >
                FILTERS
              </span>
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {f.kind}
                  </span>
                  <span>{f.label}</span>
                  <button
                    type="button"
                    onClick={() => onClearFilter(f.key)}
                    aria-label={'Remove ' + f.label + ' filter'}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: 'var(--color-text-secondary)',
                      fontSize: 14,
                      lineHeight: 1,
                      marginLeft: 2,
                    }}
                  >
                    &times;
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={onClearAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: 1,
                  marginLeft: 4,
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {isLoading && (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontStyle: 'italic',
                color: 'var(--color-text-secondary)',
              }}
            >
              Loading...
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontStyle: 'italic',
                color: 'var(--color-text-secondary)',
              }}
            >
              No logs match these filters.
            </div>
          )}

          {!isLoading &&
            posts.map((p: any, i: number) => (
              <FacetedLogRow key={p.post_id ?? i} post={p} index={i} />
            ))}

          {!isLoading && posts.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 28px',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              <span>{posts.length} shown</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
