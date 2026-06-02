import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CippusMark } from '#/components/CippusMark'
import { useQuery } from '@tanstack/react-query'
import { generateText } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

type ApiPost = {
  post_id: number
  title: string
  content: string
  image_url: string | null
  created_at: string
  author: { username: string }
  categories: { name: string }[]
  like_count?: number
  comment_count?: number
}

type LogEntry = {
  post_id: number
  kind: 'card' | 'note'
  title: string
  author: { username: string }
  categories: { name: string }[]
  created_at: string
  content: string
  image_url: string | null
  like_count: number
  comment_count: number
}

function safeExcerpt(raw: string): string {
  try {
    return generateText(JSON.parse(raw), [StarterKit]).slice(0, 120).trim()
  } catch {
    return raw.slice(0, 120)
  }
}

async function fetchPreviewLogs(): Promise<LogEntry[]> {
  const url =
    import.meta.env.VITE_API_URL + '/api/v1/logs/?limit=15&sort=recent'
  const res = await fetch(url)
  if (!res.ok) throw new Error()
  const data = await res.json()
  const posts: ApiPost[] = Array.isArray(data.post) ? data.post : []
  return posts.map((p) => ({
    post_id: p.post_id,
    kind: p.image_url ? 'card' : 'note',
    title: p.title,
    author: p.author,
    categories: p.categories ?? [],
    created_at: p.created_at,
    content: safeExcerpt(p.content),
    image_url: p.image_url,
    like_count: p.like_count ?? 0,
    comment_count: p.comment_count ?? 0,
  }))
}

function Artifact() {
  return (
    <div
      style={{
        height: 130,
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        position: 'relative',
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(135deg,
                    color-mix(in srgb, var(--color-border) 80%, transparent) 0 1px,
                    transparent 1px 11px)`,
          opacity: 0.8,
        }}
      />
    </div>
  )
}

function LogCard({ log }: { log: LogEntry }) {
  const initial =
    log.author.username.length > 0 ? log.author.username[0].toUpperCase() : '?'
  const category = log.categories[0]?.name ?? ''

  return (
    <article
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '22px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        breakInside: 'avoid',
        marginBottom: 20,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-display)',
              fontSize: 13,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--color-text-secondary)',
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {log.author.username}
          </span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: 'var(--color-text-muted)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {log.created_at}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          {category}
        </span>
      </header>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 24,
          lineHeight: 1.15,
          margin: 0,
          letterSpacing: '-0.005em',
          color: 'var(--color-text-primary)',
        }}
      >
        {log.title}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: 14.5,
          lineHeight: 1.55,
          color: 'var(--color-text-secondary)',
          fontStyle: 'italic',
        }}
      >
        {log.content}
      </p>

      {log.image_url && <Artifact />}

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: 4,
          borderTop: '1px solid var(--color-border)',
          marginTop: 2,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {log.like_count} likes · {log.comment_count} replies
        </span>
      </footer>
    </article>
  )
}

function NoteCard({ log }: { log: LogEntry }) {
  const category = log.categories[0]?.name ?? ''

  return (
    <article
      style={{
        background: 'transparent',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        breakInside: 'avoid',
        marginBottom: 20,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {log.author.username}
        </span>
        <span
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {log.created_at}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          {category}
        </span>
      </header>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 22,
          lineHeight: 1.2,
          margin: 0,
          color: 'var(--color-text-primary)',
        }}
      >
        {log.title}
      </h3>

      <p
        style={{
          margin: 0,
          fontSize: 14.5,
          lineHeight: 1.6,
          color: 'var(--color-text-secondary)',
          fontStyle: 'italic',
        }}
      >
        {log.content}
      </p>
    </article>
  )
}

function OnboardingPage() {
  const navigate = useNavigate()
  const { data: logs = [], isLoading } = useQuery<LogEntry[]>({
    queryKey: ['onboarding-logs'],
    queryFn: fetchPreviewLogs,
    staleTime: 60_000,
  })

  function handleStartLog() {
    navigate({ to: '/logs/new' })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <CippusMark size={18} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 16,
              color: 'var(--color-text-primary)',
            }}
          >
            Cippus
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Step out
        </button>
      </header>

      <section
        style={{
          padding: '64px 40px 36px',
          maxWidth: 1240,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            fontWeight: 500,
            marginBottom: 22,
          }}
        >
          Welcome
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400,
            fontSize: 64,
            lineHeight: 1.05,
            letterSpacing: '-0.012em',
            margin: 0,
            color: 'var(--color-text-primary)',
            maxWidth: 780,
          }}
        >
          What are you working on?
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            lineHeight: 1.55,
            color: 'var(--color-text-secondary)',
            marginTop: 22,
            marginBottom: 0,
            maxWidth: 620,
            fontStyle: 'italic',
          }}
        >
          Read a few logs first. People are mid-build, right now — the dust is
          fresh. Start your own when you're ready.
        </p>
      </section>

      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '12px 40px 220px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 22,
            marginBottom: 28,
            gap: 20,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}
          >
            Logs in progress — right now
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: '0.12em',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {isLoading ? '…' : `${logs.length} shown`}
          </span>
        </div>

        <div style={{ columnCount: 3, columnGap: 20 }}>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 160,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 20,
                    opacity: 0.4,
                  }}
                />
              ))
            : logs.map((log) =>
                log.kind === 'card' ? (
                  <LogCard key={log.post_id} log={log} />
                ) : (
                  <NoteCard key={log.post_id} log={log} />
                ),
              )}
        </div>

        <div
          style={{
            marginTop: 36,
            borderTop: '1px solid var(--color-border)',
            paddingTop: 22,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 18,
              color: 'var(--color-text-secondary)',
            }}
          >
            — and the rest of the road —
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '18px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 20,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.005em',
              }}
            >
              You're early. Start a log and others will follow.
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--color-text-secondary)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 2,
              }}
            >
              Keep reading
            </button>
            <button
              type="button"
              onClick={handleStartLog}
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text-on-accent)',
                border: '1px solid var(--color-accent)',
                padding: '14px 26px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              Start your first log
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
