import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { generateText } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { useAuthStore } from '#/stores/useAuthStore'

export const Route = createFileRoute('/')({
  component: Landing,
})

const NODES = [
  { x: 6, y: 12, r: 1.4 },
  { x: 13, y: 22, r: 2.1 },
  { x: 22, y: 8, r: 1.0 },
  { x: 28, y: 18, r: 2.6 },
  { x: 35, y: 30, r: 1.6 },
  { x: 41, y: 14, r: 1.3 },
  { x: 47, y: 25, r: 1.0 },
  { x: 53, y: 9, r: 1.5 },
  { x: 60, y: 18, r: 1.9 },
  { x: 68, y: 30, r: 1.2 },
  { x: 74, y: 12, r: 2.4 },
  { x: 82, y: 22, r: 1.4 },
  { x: 91, y: 16, r: 1.7 },
  { x: 96, y: 30, r: 1.1 },
  { x: 9, y: 48, r: 1.2 },
  { x: 18, y: 58, r: 2.0 },
  { x: 26, y: 70, r: 1.4 },
  { x: 33, y: 54, r: 1.0 },
  { x: 42, y: 68, r: 1.8 },
  { x: 50, y: 80, r: 1.2 },
  { x: 57, y: 60, r: 1.5 },
  { x: 64, y: 76, r: 2.3 },
  { x: 72, y: 64, r: 1.0 },
  { x: 78, y: 82, r: 1.6 },
  { x: 84, y: 70, r: 1.3 },
  { x: 90, y: 58, r: 1.9 },
  { x: 95, y: 80, r: 1.2 },
  { x: 4, y: 84, r: 1.4 },
]

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [3, 5],
  [5, 6],
  [5, 7],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [10, 12],
  [12, 13],
  [1, 15],
  [14, 15],
  [15, 16],
  [16, 17],
  [17, 18],
  [18, 19],
  [18, 20],
  [20, 21],
  [21, 22],
  [21, 23],
  [23, 24],
  [24, 25],
  [25, 26],
  [4, 18],
  [8, 20],
  [11, 25],
  [6, 17],
  [27, 16],
]

const MATCH_PAIRS = [
  { a: 4, b: 20, delay: 0 },
  { a: 9, b: 17, delay: 3 },
  { a: 6, b: 20, delay: 6 },
  { a: 4, b: 9, delay: 9 },
]

function ConstellationBg() {
  return (
    <svg
      viewBox="0 0 100 90"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <g>
        {EDGES.map(([a, b], i) => {
          const A = NODES[a],
            B = NODES[b]
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              stroke="rgba(140, 128, 116, 0.28)"
              strokeWidth={0.12}
            />
          )
        })}
        {MATCH_PAIRS.map(({ a, b, delay }, i) => {
          const A = NODES[a],
            B = NODES[b]
          return (
            <line
              key={i}
              x1={A.x}
              y1={A.y}
              x2={B.x}
              y2={B.y}
              pathLength="1"
              stroke="var(--color-accent)"
              strokeWidth={0.22}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                opacity: 0,
                animation: `emberLineDraw 12s ease-in-out ${delay}s infinite`,
              }}
            />
          )
        })}
      </g>
      <g>
        {NODES.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={n.r * 0.25}
            fill="rgba(196, 180, 154, 0.55)"
          />
        ))}
        {MATCH_PAIRS.map(({ a, b, delay }, i) => {
          const A = NODES[a],
            B = NODES[b]
          return (
            <g key={i}>
              <circle
                cx={A.x}
                cy={A.y}
                r={A.r * 0.4}
                fill="var(--color-accent)"
                style={{
                  opacity: 0,
                  animation: `emberNodePulse 12s ease-in-out ${delay}s infinite`,
                }}
              />
              <circle
                cx={B.x}
                cy={B.y}
                r={B.r * 0.4}
                fill="var(--color-accent)"
                style={{
                  opacity: 0,
                  animation: `emberNodePulse 12s ease-in-out ${delay + 0.6}s infinite`,
                }}
              />
            </g>
          )
        })}
      </g>
    </svg>
  )
}

function SectionLabel({
  children,
  count,
  live = false,
}: {
  children: React.ReactNode
  count?: string
  live?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 14,
        marginBottom: 28,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--color-text-primary)',
          fontWeight: 500,
        }}
      >
        {children}
      </span>
      {count && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          {live && (
            <span
              className="live-dot"
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                marginRight: 8,
                verticalAlign: 'middle',
              }}
            />
          )}
          {count}
        </span>
      )}
    </div>
  )
}

function YouPane() {
  return (
    <div>
      <SectionLabel>You</SectionLabel>

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 44,
          lineHeight: 1.15,
          margin: 0,
          color: 'var(--color-text-primary)',
          fontWeight: 400,
          letterSpacing: '-0.005em',
        }}
      >
        What are you
        <br />
        working on?
      </p>

      <div
        style={{
          marginTop: 32,
          border: '1px solid var(--color-border)',
          padding: '20px 22px',
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
            fontSize: 17,
            lineHeight: 1.5,
          }}
        >
          Started a chair last winter. Stalled at the seat mortises&hellip;
        </span>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            A few lines is enough
          </span>
          <Link
            to="/logs/new"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-primary)',
              borderBottom: '1px solid var(--color-text-primary)',
              paddingBottom: 1,
              textDecoration: 'none',
            }}
          >
            Start a log &rarr;
          </Link>
        </div>
      </div>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'var(--color-text-secondary)',
          marginTop: 22,
          lineHeight: 1.6,
        }}
      >
        You&rsquo;re early. Start a log and others will follow.
      </p>
    </div>
  )
}

type LogEntry = {
  post_id: number
  title: string
  content: string
  created_at: string
  author: { username: string }
  categories: { name: string }[]
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function safeExcerpt(content: string): string {
  try {
    return generateText(JSON.parse(content), [StarterKit]).slice(0, 140).trim()
  } catch {
    return content.slice(0, 140)
  }
}

async function fetchRecentLogs(): Promise<LogEntry[]> {
  const url = import.meta.env.VITE_API_URL + '/api/v1/logs?limit=6&sort=recent'
  const res = await fetch(url)
  if (!res.ok) throw new Error()
  const data = await res.json()
  return Array.isArray(data.post) ? data.post : []
}

function LogRow({ log, index }: { log: LogEntry; index: number }) {
  const category = log.categories[0]?.name ?? ''
  const excerpt = safeExcerpt(log.content)

  return (
    <div
      className="row-enter"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 18,
        padding: '20px 0',
        borderBottom: '1px solid var(--color-border)',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {category && (
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {category}
          </div>
        )}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 19,
            color: 'var(--color-text-primary)',
            fontWeight: 500,
            marginBottom: 10,
            lineHeight: 1.15,
          }}
        >
          {log.title}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 15.5,
            lineHeight: 1.55,
            color: 'var(--color-text-secondary)',
            margin: 0,
            fontStyle: 'italic',
          }}
        >
          {excerpt}
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 12,
          minWidth: 110,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          {timeAgo(log.created_at)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-muted)',
          }}
        >
          {log.author.username}
        </span>
      </div>
    </div>
  )
}

function CategoriesSection() {
  const { data: categories = [] } = useQuery<
    { category_id: number; name: string }[]
  >({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/v1/categories',
      )
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data.category) ? data.category : []
    },
    staleTime: 5 * 60_000,
  })

  if (categories.length === 0) return null

  return (
    <section
      style={{
        borderTop: '1px solid var(--color-border)',
        padding: '48px 56px',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div
          className="label"
          style={{
            color: 'var(--color-text-muted)',
            marginBottom: 24,
            letterSpacing: '0.18em',
          }}
        >
          BROWSE BY CRAFT
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0' }}>
          {categories.map((cat, i) => (
            <Link
              key={cat.category_id}
              to="/category/$id"
              params={{ id: cat.name.toLowerCase() }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 2.5vw, 34px)',
                fontWeight: 500,
                letterSpacing: '-0.005em',
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                padding: '6px 0',
                marginRight: i < categories.length - 1 ? 28 : 0,
                transition: 'color 180ms',
                lineHeight: 1.3,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'var(--color-accent)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--color-text-muted)')
              }
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorldPane() {
  const { data: logs = [], isLoading } = useQuery<LogEntry[]>({
    queryKey: ['landing-logs'],
    queryFn: fetchRecentLogs,
    staleTime: 60_000,
  })

  return (
    <div>
      <SectionLabel
        count={logs.length > 0 ? `${logs.length} recent logs` : undefined}
        live
      >
        World
      </SectionLabel>
      <div>
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  padding: '20px 0',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    height: 11,
                    width: '40%',
                    background: 'var(--color-border)',
                    borderRadius: 2,
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    height: 19,
                    width: '75%',
                    background: 'var(--color-border)',
                    borderRadius: 2,
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    height: 15,
                    width: '90%',
                    background: 'var(--color-border)',
                    borderRadius: 2,
                    opacity: 0.4,
                  }}
                />
              </div>
            ))
          : logs.map((log, i) => (
              <LogRow key={log.post_id} log={log} index={i} />
            ))}
      </div>
      <div style={{ marginTop: 24 }}>
        <Link
          to="/logs"
          search={{ sort: 'recent' }}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-text-primary)',
            borderBottom: '1px solid var(--color-text-primary)',
            paddingBottom: 1,
            textDecoration: 'none',
          }}
        >
          Browse all logs &rarr;
        </Link>
      </div>
    </div>
  )
}

function Landing() {
  const user = useAuthStore((s) => s.user)
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 830,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <ConstellationBg />
      </div>

      <header className="landing-header">
        <span
          className="wordmark"
          style={{ fontSize: 20, letterSpacing: '0.18em' }}
        >
          Cippus
        </span>
        <nav style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
          <Link
            to="/logs"
            search={{ sort: 'recent' }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Browse
          </Link>
          {user ? (
            <Link
              to="/logs/new"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Start a log
            </Link>
          ) : (
            <Link
              to="/auth/login"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <section className="landing-hero">
        <div
          style={{ textAlign: 'center', maxWidth: 780, position: 'relative' }}
        >
          <h1
            className="wordmark landing-hero-title"
            style={{
              margin: 0,
              fontWeight: 500,
              letterSpacing: '0.005em',
              lineHeight: 1,
            }}
          >
            Cippus
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 22,
              lineHeight: 1.4,
              color: 'var(--color-text-secondary)',
              marginTop: 36,
              marginBottom: 48,
              fontStyle: 'italic',
              fontWeight: 300,
            }}
          >
            A forum for builders mid-build. Show what you&rsquo;re making
            &mdash; others at your stage will find you.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 14,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link to="/logs/new">
              <button
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  letterSpacing: '0.04em',
                  fontWeight: 500,
                  padding: '14px 28px',
                  background: 'var(--color-accent)',
                  color: 'var(--color-text-on-accent)',
                  border: '1px solid transparent',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                Start building
              </button>
            </Link>
            <Link to="/logs" search={{ sort: 'recent' }}>
              <button
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  letterSpacing: '0.04em',
                  fontWeight: 400,
                  padding: '14px 28px',
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 2,
                  cursor: 'pointer',
                }}
              >
                Browse logs
              </button>
            </Link>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <button
            className="scroll-btn"
            onClick={() =>
              document
                .getElementById('feed')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            aria-label="Scroll to feed"
          >
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 1.5 L6 6.5 L11 1.5" />
            </svg>
          </button>
        </div>
      </section>

      <CategoriesSection />

      <section id="feed" className="landing-section">
        <div className="landing-grid">
          <YouPane />
          <WorldPane />
        </div>
      </section>

      <footer className="landing-footer">
        <span
          className="wordmark"
          style={{ fontSize: 16, letterSpacing: '0.18em' }}
        >
          Cippus
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Carved by those who passed &middot; found by those still on the way
        </span>
      </footer>
    </div>
  )
}
