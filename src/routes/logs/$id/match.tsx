import { useAuthStore } from '#/stores/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/logs/$id/match')({
  component: RouteComponent,
})

async function fetchSourcePost(id: string) {
  const url = import.meta.env.VITE_API_URL + '/api/v1/logs/' + id
  const response = await fetch(url)
  if (!response.ok) throw new Error()
  const data = await response.json()
  return data.post
}

async function fetchSimilar(id: string) {
  const url = import.meta.env.VITE_API_URL + '/api/v1/logs/' + id + '/similar'
  const response = await fetch(url)
  if (response.status === 404) return []
  if (!response.ok) throw new Error()
  const data = await response.json()
  return data.results ?? []
}

function extractText(content: string, limit = 280): string {
  if (content.startsWith('{')) {
    try {
      const texts: string[] = []
      function walk(node: any) {
        if (node.type === 'text' && node.text) texts.push(node.text)
        if (node.content) node.content.forEach(walk)
      }
      walk(JSON.parse(content))
      return texts.join(' ').trim().slice(0, limit)
    } catch {
      return content.slice(0, limit)
    }
  }
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

function closenessFor(score: number): string {
  if (score < 0.15) return 'EXACT MATCH'
  if (score < 0.3) return 'SAME STAGE'
  return 'SAME CRAFT'
}

// ─── Constellation ───────────────────────────────────────────────────────────

const VW = 600
const VH = 600
const CX = VW / 2
const CY = VH / 2
const RADIUS = 200

function starPos(index: number, total: number) {
  const angle = ((2 * Math.PI) / total) * index - Math.PI / 2
  return {
    x: CX + Math.cos(angle) * RADIUS,
    y: CY + Math.sin(angle) * RADIUS,
  }
}

function Constellation({
  postId,
  results,
  activeIndex,
  onActivate,
}: {
  postId: string
  results: any[]
  activeIndex: number | null
  onActivate: (i: number | null) => void
}) {
  const navigate = useNavigate()
  const [centerReady, setCenterReady] = useState(false)
  const [revealedLines, setRevealedLines] = useState<Set<number>>(new Set())
  const [revealedStars, setRevealedStars] = useState<Set<number>>(new Set())

  useEffect(() => {
    setCenterReady(false)
    setRevealedLines(new Set())
    setRevealedStars(new Set())

    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setCenterReady(true), 150))

    results.forEach((_, i) => {
      timers.push(
        setTimeout(
          () => {
            setRevealedLines((prev) => new Set([...prev, i]))
          },
          480 + i * 190,
        ),
      )
      timers.push(
        setTimeout(
          () => {
            setRevealedStars((prev) => new Set([...prev, i]))
          },
          480 + i * 190 + 460,
        ),
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [postId])

  const positions = results.map((_, i) => starPos(i, results.length))

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      height="100%"
      style={{ display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <filter id="glow-c" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-s" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle
            cx="14"
            cy="14"
            r="0.7"
            fill="var(--color-text-muted)"
            opacity="0.15"
          />
        </pattern>
      </defs>

      {/* Background dot grid */}
      <rect width={VW} height={VH} fill="url(#dots)" />

      {/* Lines: center → each star */}
      {positions.map((pos, i) => {
        const len = Math.hypot(pos.x - CX, pos.y - CY)
        const revealed = revealedLines.has(i)
        const active = activeIndex === i
        return (
          <line
            key={`line-${i}`}
            x1={CX}
            y1={CY}
            x2={pos.x}
            y2={pos.y}
            stroke="var(--color-accent)"
            strokeWidth={active ? 1.5 : 0.8}
            strokeDasharray={len}
            style={{
              strokeDashoffset: revealed ? 0 : len,
              strokeOpacity: active ? 0.55 : 0.2,
              transition: [
                'stroke-dashoffset 480ms cubic-bezier(0.4,0,0.2,1)',
                'stroke-opacity 200ms ease',
                'stroke-width 150ms ease',
              ].join(', '),
            }}
          />
        )
      })}

      {/* Center star (your log) */}
      <g
        style={{
          transform: `scale(${centerReady ? 1 : 0})`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: 'transform 400ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <circle
          cx={CX}
          cy={CY}
          r={8}
          fill="var(--color-accent)"
          filter="url(#glow-c)"
        />
      </g>
      {centerReady && (
        <text
          x={CX}
          y={CY + 22}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize={10}
          fontFamily="var(--font-body)"
          letterSpacing="0.06em"
          style={{ opacity: 1, pointerEvents: 'none' }}
        >
          your log
        </text>
      )}

      {/* Match stars */}
      {positions.map((pos, i) => {
        const result = results[i]
        const revealed = revealedStars.has(i)
        const active = activeIndex === i
        const matchId = String(result.post_id ?? result.id ?? '')
        const username = result.author?.username ?? 'Builder'
        const score = result.score ?? result.distance ?? 0.5
        const closeness = closenessFor(score)

        // Label direction: away from center
        const dx = pos.x - CX
        const dy = pos.y - CY
        const norm = Math.hypot(dx, dy)
        const ldx = (dx / norm) * 20
        const ldy = (dy / norm) * 20
        const anchor = dx > 15 ? 'start' : dx < -15 ? 'end' : 'middle'

        return (
          <g
            key={`star-${i}`}
            transform={`translate(${pos.x} ${pos.y})`}
            style={{ cursor: revealed ? 'pointer' : 'default' }}
            onClick={() => {
              if (!revealed) return
              if (active) {
                navigate({ to: '/logs/$id/', params: { id: matchId } })
              } else {
                onActivate(i)
              }
            }}
            onMouseEnter={() => revealed && onActivate(i)}
            onMouseLeave={() => onActivate(null)}
          >
            {/* Hit area */}
            <circle cx={0} cy={0} r={22} fill="transparent" />

            {/* Glow ring (active only) */}
            <circle
              cx={0}
              cy={0}
              r={12}
              fill="var(--color-accent)"
              style={{
                opacity: active && revealed ? 0.14 : 0,
                transition: 'opacity 200ms ease',
              }}
            />

            {/* Star dot — spring reveal via scale */}
            <g
              style={{
                transform: `scale(${revealed ? 1 : 0})`,
                transformOrigin: '0px 0px',
                transition: 'transform 360ms cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <circle
                cx={0}
                cy={0}
                r={active ? 6 : 4}
                fill={
                  active ? 'var(--color-accent)' : 'var(--color-text-muted)'
                }
                filter={active ? 'url(#glow-s)' : undefined}
                style={{ transition: 'r 200ms ease, fill 150ms ease' }}
              />
            </g>

            {/* Username label */}
            {revealed && (
              <text
                x={ldx}
                y={ldy + (dy >= 0 ? 12 : -3)}
                textAnchor={anchor}
                fill={
                  active
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)'
                }
                fontSize={10}
                fontFamily="var(--font-body)"
                letterSpacing="0.04em"
                style={{
                  transition: 'fill 150ms ease',
                  pointerEvents: 'none',
                }}
              >
                {username}
              </text>
            )}

            {/* Closeness badge (active only) */}
            {active && revealed && (
              <text
                x={ldx}
                y={ldy + (dy >= 0 ? 23 : -14)}
                textAnchor={anchor}
                fill="var(--color-accent)"
                fontSize={9}
                fontFamily="var(--font-body)"
                letterSpacing="0.08em"
                style={{ pointerEvents: 'none' }}
              >
                {closeness}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Left panel components ────────────────────────────────────────────────────

function YourEntry({ post, userInitial }: { post: any; userInitial: string }) {
  const category = post.categories?.[0]?.name ?? ''
  const stage = post.stuck ? 'STUCK' : category.toUpperCase() || 'ACTIVE'

  return (
    <article>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-text-muted)',
          }}
        >
          {userInitial}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-primary)',
            }}
          >
            Your log
          </span>
          {category && (
            <span
              className="label"
              style={{ color: 'var(--color-text-secondary)', fontSize: 10 }}
            >
              {category.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <span className="label" style={{ color: 'var(--color-text-muted)' }}>
          {timeAgo(post.created_at)}
        </span>
        <span
          style={{
            width: 1,
            height: 10,
            background: 'var(--color-border)',
            display: 'inline-block',
          }}
        />
        <span className="label" style={{ color: 'var(--color-text-muted)' }}>
          {stage}
        </span>
      </div>

      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
          color: 'var(--color-text-primary)',
        }}
      >
        {post.title}
      </h2>

      {post.content && (
        <p
          style={{
            margin: '14px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--color-text-secondary)',
          }}
        >
          {extractText(post.content, 250)}
        </p>
      )}
    </article>
  )
}

function MatchDetail({ result }: { result: any }) {
  const matchId = String(result.post_id ?? result.id ?? '')
  const username = result.author?.username ?? 'Builder'
  const score = result.score ?? result.distance ?? 0.5
  const closeness = closenessFor(score)
  const category = result.categories?.[0]?.name ?? ''

  return (
    <div
      className="row-enter"
      style={{
        background:
          'color-mix(in oklab, var(--color-accent) 5%, var(--color-surface))',
        border: '1px solid var(--color-border)',
        padding: '20px 22px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            {username[0]?.toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--color-text-primary)',
              }}
            >
              {username}
            </span>
            {category && (
              <span
                className="label"
                style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}
              >
                {category.toUpperCase()} · PASSED THROUGH
              </span>
            )}
          </div>
        </div>
        <span
          className="label"
          style={{
            fontSize: 9,
            letterSpacing: '0.1em',
            color:
              closeness === 'EXACT MATCH'
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)',
          }}
        >
          {closeness}
        </span>
      </div>

      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: '-0.005em',
          lineHeight: 1.2,
          color: 'var(--color-text-primary)',
        }}
      >
        {result.title}
      </h3>

      {result.content && (
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--color-text-secondary)',
          }}
        >
          {extractText(result.content, 150)}
        </p>
      )}

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: 18,
          alignItems: 'center',
        }}
      >
        {matchId && (
          <Link
            to="/logs/$id/"
            params={{ id: matchId }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--color-text-primary)',
              paddingBottom: 2,
            }}
          >
            View full log
          </Link>
        )}
        {result.author?.id && (
          <Link
            to="/messages/$userId"
            params={{ userId: String(result.author.id) }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
            }}
          >
            Send a message
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Route ────────────────────────────────────────────────────────────────────

function RouteComponent() {
  const { id } = Route.useParams()
  const user = useAuthStore((s) => s.user)
  const userInitial = user?.username?.[0]?.toUpperCase() ?? '?'
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const sourceQuery = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchSourcePost(id),
  })

  const similarQuery = useQuery({
    queryKey: ['similar', id],
    queryFn: () => fetchSimilar(id),
  })

  const isLoading = sourceQuery.isLoading || similarQuery.isLoading
  const isError = sourceQuery.isError

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center">
        <p className="font-body text-sm italic text-(--color-text-muted)">
          Finding matches…
        </p>
      </div>
    )
  }

  if (isError || !sourceQuery.data) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center">
        <p className="font-body text-sm italic text-(--color-text-muted)">
          Something went wrong. Try again later.
        </p>
      </div>
    )
  }

  const post = sourceQuery.data
  const results: any[] = similarQuery.data ?? []

  return (
    <div className="flex flex-col bg-(--color-bg) h-screen overflow-hidden">
      {/* Back link */}
      <div
        style={{ borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-14 py-5">
          <Link
            to="/logs/$id/"
            params={{ id }}
            className="font-body text-[13px] text-(--color-text-muted) no-underline hover:text-(--color-text-primary) transition-colors duration-[180ms]"
          >
            ← Back to log
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: your log + active match detail */}
        <div
          className="hidden lg:flex lg:flex-col w-[360px] flex-shrink-0 overflow-y-auto border-r px-9 pt-11 pb-10 gap-10"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="row-enter">
            <YourEntry post={post} userInitial={userInitial} />
          </div>

          {activeIndex !== null && results[activeIndex] && (
            <MatchDetail result={results[activeIndex]} />
          )}
        </div>

        {/* Constellation area */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {results.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontStyle: 'italic',
                color: 'var(--color-text-placeholder)',
              }}
            >
              The road is quiet for now. Check back when more builders are
              active.
            </p>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                maxWidth: 640,
                padding: '24px',
              }}
            >
              <Constellation
                postId={id}
                results={results}
                activeIndex={activeIndex}
                onActivate={setActiveIndex}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
