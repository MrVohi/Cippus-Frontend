import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CippusMark } from '#/components/CippusMark'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

type LogEntry = {
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

// Static data — shape matches future GET /api/v1/posts response.
// To Swap for useQuery when Logs backend is done.
const LOGS: LogEntry[] = [
  {
    kind: 'card',
    title: 'Forge bracket — fourth attempt',
    author: { username: 'Mara K.' },
    categories: [{ name: 'forge' }],
    created_at: '14 min ago',
    content: 'Quench cracked again. Walking outside before I look at it.',
    image_url: 'artifact',
    like_count: 12,
    comment_count: 3,
  },
  {
    kind: 'note',
    title: 'Cedar canoe — laying strips on the mold',
    author: { username: 'Diego R.' },
    categories: [{ name: 'wood' }],
    created_at: '36 min ago',
    content:
      'Mid-strip. Epoxy curing slower than the book said. Letting it be.',
    image_url: null,
    like_count: 8,
    comment_count: 2,
  },
  {
    kind: 'card',
    title: 'Wheel-throwing — same egg shape, again',
    author: { username: 'Aiko T.' },
    categories: [{ name: 'ceramics' }],
    created_at: '1 hr ago',
    content: 'The clay finds the same fault every time. Centering, again.',
    image_url: 'artifact',
    like_count: 21,
    comment_count: 7,
  },
  {
    kind: 'card',
    title: 'Restoring a 1958 Atlas lathe',
    author: { username: 'Jonas B.' },
    categories: [{ name: 'restoration' }],
    created_at: '2 hr ago',
    content:
      'Saddle off. Bedways pitted worse than I thought. Stripping the apron next.',
    image_url: 'artifact',
    like_count: 41,
    comment_count: 11,
  },
  {
    kind: 'note',
    title: 'Coptic stitch, goat leather',
    author: { username: 'Lin Q.' },
    categories: [{ name: 'bookbinding' }],
    created_at: '3 hr ago',
    content:
      'Got the spacing right on the third signature. The first two are coming out.',
    image_url: null,
    like_count: 5,
    comment_count: 1,
  },
  {
    kind: 'card',
    title: 'First ribbon kiln firing',
    author: { username: 'Eve M.' },
    categories: [{ name: 'glass' }],
    created_at: '4 hr ago',
    content:
      'Slumped — but not where I drew the line. Need to read the witness cones.',
    image_url: 'artifact',
    like_count: 9,
    comment_count: 4,
  },
  {
    kind: 'note',
    title: 'Tatami room — a small one',
    author: { username: 'Halid N.' },
    categories: [{ name: 'carpentry' }],
    created_at: '5 hr ago',
    content:
      'Framing is true on three walls. Fourth is the chimney side. Waiting on the mason.',
    image_url: null,
    like_count: 14,
    comment_count: 3,
  },
  {
    kind: 'card',
    title: 'Kitchen knife from spring steel',
    author: { username: 'Tomás A.' },
    categories: [{ name: 'knives' }],
    created_at: '6 hr ago',
    content:
      'Blade is ground, edge is set. Handle scales next — stabilised maple if it arrives.',
    image_url: 'artifact',
    like_count: 33,
    comment_count: 9,
  },
  {
    kind: 'note',
    title: "Beeswax candles — wick won't stay centered",
    author: { username: 'Ruth E.' },
    categories: [{ name: 'candlemaking' }],
    created_at: '7 hr ago',
    content:
      'Tried four mold types. The taper still pulls right. Suspecting the wick prime.',
    image_url: null,
    like_count: 6,
    comment_count: 5,
  },
  {
    kind: 'card',
    title: 'Shaving horse from green oak',
    author: { username: 'Sven O.' },
    categories: [{ name: 'green wood' }],
    created_at: 'yesterday',
    content:
      'Mortises chopped. Bench top split along the heart while drying — keeping it.',
    image_url: 'artifact',
    like_count: 18,
    comment_count: 6,
  },
  {
    kind: 'note',
    title: 'Indigo vat — third reduction',
    author: { username: 'Priya S.' },
    categories: [{ name: 'dye' }],
    created_at: 'yesterday',
    content:
      'Surface flower is finally bronze. Smells right. Test strip overnight.',
    image_url: null,
    like_count: 11,
    comment_count: 2,
  },
  {
    kind: 'card',
    title: 'Solid-state amp — the hum is back',
    author: { username: 'Marco C.' },
    categories: [{ name: 'electronics' }],
    created_at: '2 days ago',
    content:
      'Re-grounded the chassis, swapped the filter cap. Still there at idle. Going to scope the rail.',
    image_url: 'artifact',
    like_count: 27,
    comment_count: 14,
  },
  {
    kind: 'note',
    title: 'Singer 99K — foot pedal back together',
    author: { username: 'Hana W.' },
    categories: [{ name: 'repair' }],
    created_at: '2 days ago',
    content:
      'Carbon stack was the issue, as everyone said. Sews straight now. Smells of old motor oil.',
    image_url: null,
    like_count: 19,
    comment_count: 8,
  },
  {
    kind: 'card',
    title: 'Saddlebag — bridle leather, hand-stitched',
    author: { username: 'Idris K.' },
    categories: [{ name: 'leather' }],
    created_at: '3 days ago',
    content:
      'Edges burnished. Saddle stitch is even — finally. Buckles next week.',
    image_url: 'artifact',
    like_count: 14,
    comment_count: 3,
  },
  {
    kind: 'note',
    title: 'Dry stone wall — corner stone in',
    author: { username: 'Beth O.' },
    categories: [{ name: 'stone' }],
    created_at: '6 days ago',
    content:
      'Found the cornerstone in a hedge. Heavier than it looks. Pinning the first course tomorrow.',
    image_url: null,
    like_count: 22,
    comment_count: 5,
  },
]

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
            {LOGS.length} shown
          </span>
        </div>

        <div style={{ columnCount: 3, columnGap: 20 }}>
          {LOGS.map((log, i) =>
            log.kind === 'card' ? (
              <LogCard key={i} log={log} />
            ) : (
              <NoteCard key={i} log={log} />
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
