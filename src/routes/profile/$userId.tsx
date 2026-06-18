import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '#/stores/useAuthStore'
import { fetchWithAuth } from '#/lib/api'

export interface UserProfile {
  id: number
  username: string
  bio: string
  role: string
  avatarUrl: string | null
  createdAt?: string
}

export interface PostSummary {
  post_id: number
  title: string
  content: string
  categories: { category_id: number; name: string }[]
  stuck: boolean
  created_at: string
  updated_at: string
}

const ROMAN_MONTHS = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
]

function toRomanYear(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const syms = [
    'M',
    'CM',
    'D',
    'CD',
    'C',
    'XC',
    'L',
    'XL',
    'X',
    'IX',
    'V',
    'IV',
    'I',
  ]
  let out = ''
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      out += syms[i]
      n -= vals[i]
    }
  }
  return out
}

function memberSinceLabel(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${ROMAN_MONTHS[d.getMonth()]} · ${toRomanYear(d.getFullYear())}`
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return m <= 1 ? 'just now' : `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function daysIn(iso: string): number {
  return Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 86400000),
  )
}

function extractText(content: string): string {
  try {
    const parsed = JSON.parse(content)
    const texts: string[] = []
    function walk(node: any) {
      if (node.type === 'text') texts.push(node.text ?? '')
      if (node.content) node.content.forEach(walk)
    }
    walk(parsed)
    return texts.join(' ')
  } catch {
    return content.replace(/<[^>]+>/g, ' ').trim()
  }
}

function Slug({
  children,
  color,
  style,
}: {
  children: React.ReactNode
  color?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: color ?? 'var(--color-text-muted)',
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function SectionLabel({
  children,
  count,
  right,
}: {
  children: React.ReactNode
  count?: number
  right?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 18,
        padding: '0 0 14px',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: 22,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <Slug>{children}</Slug>
        {count != null && (
          <span
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 11,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            {String(count).padStart(2, '0')}
          </span>
        )}
      </div>
      {right}
    </div>
  )
}

function Masthead({ user, isSelf }: { user: UserProfile; isSelf: boolean }) {
  const navigate = useNavigate()
  const initial = (user.username[0] ?? '?').toUpperCase()

  return (
    <section
      className="row-enter"
      style={{
        maxWidth: 1320,
        width: '100%',
        margin: '0 auto',
        padding:
          'clamp(32px, 5vw, 56px) clamp(24px, 5vw, 56px) clamp(24px, 4vw, 36px)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 36,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: 'clamp(72px, 10vw, 116px)',
          height: 'clamp(72px, 10vw, 116px)',
          borderRadius: '50%',
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.01em',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initial
        )}
      </div>

      <div style={{ flex: 1, paddingTop: 6, minWidth: 200 }}>
        <Slug style={{ display: 'block', marginBottom: 12 }}>BUILDER</Slug>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 64px)',
            fontWeight: 500,
            letterSpacing: '-0.015em',
            lineHeight: 1,
            margin: 0,
            color: 'var(--color-text-primary)',
          }}
        >
          {user.username}
        </h1>
        {user.bio && (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 18,
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
              margin: '14px 0 0',
              maxWidth: 580,
              lineHeight: 1.5,
            }}
          >
            {user.bio}
          </p>
        )}
        {user.createdAt && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              marginTop: 20,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
              }}
            >
              HERE SINCE {memberSinceLabel(user.createdAt)}
            </span>
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, paddingTop: 6 }}>
        {isSelf ? (
          <button
            onClick={() => navigate({ to: '/profile/edit' })}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              letterSpacing: '0.04em',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              lineHeight: 1,
              transition: 'border-color var(--duration-fast) var(--ease-base)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = 'var(--color-text-primary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = 'var(--color-border)')
            }
          >
            Edit profile
          </button>
        ) : (
          <Link
            to="/messages"
            style={{
              display: 'inline-block',
              background: 'var(--color-accent)',
              border: 'none',
              padding: '11px 22px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              letterSpacing: '0.04em',
              color: '#fff',
              textDecoration: 'none',
              cursor: 'pointer',
              lineHeight: 1,
              transition: 'background var(--duration-fast) var(--ease-base)',
            }}
          >
            Send a message
          </Link>
        )}
      </div>
    </section>
  )
}

function WorkshopRow({
  user,
  postsCount,
}: {
  user: UserProfile
  postsCount: number
}) {
  const subtitle =
    postsCount === 0
      ? 'The bench is empty.'
      : `${postsCount} open ${postsCount === 1 ? 'bench' : 'benches'}. Still here.`

  return (
    <div
      className="row-enter"
      style={{
        maxWidth: 1320,
        width: '100%',
        margin: '0 auto',
        padding:
          'clamp(20px, 4vw, 36px) clamp(24px, 5vw, 56px) clamp(16px, 3vw, 28px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 32,
        borderTop: '1px solid var(--color-border)',
        flexWrap: 'wrap',
        animationDelay: '60ms',
      }}
    >
      <div>
        <Slug style={{ display: 'block', marginBottom: 12 }}>THE WORKSHOP</Slug>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px, 4vw, 44px)',
            fontWeight: 500,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            margin: 0,
            color: 'var(--color-text-primary)',
          }}
        >
          {user.username}'s workshop
        </h2>
        <p
          style={{
            margin: '14px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.01em',
          }}
        >
          {subtitle}
        </p>
      </div>

      {postsCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingBottom: 8,
          }}
        >
          <span
            className="live-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              fontWeight: 500,
            }}
          >
            At the workbench
          </span>
        </div>
      )}
    </div>
  )
}

function BenchCard({ post, index }: { post: PostSummary; index: number }) {
  const text = extractText(post.content)
  const categoryName = post.categories[0]?.name?.toUpperCase() ?? 'BUILD'

  return (
    <Link
      to="/logs/$id"
      params={{ id: String(post.post_id) }}
      className="row-enter"
      style={{
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border)',
        padding: '28px 28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: 260,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color var(--duration-fast) var(--ease-base)',
        animationDelay: `${100 + index * 55}ms`,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = 'var(--color-accent)')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = 'var(--color-border)')
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Slug>{post.stuck ? 'STUCK' : 'IN PROGRESS'}</Slug>
        <Slug>{categoryName}</Slug>
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: '-0.005em',
          lineHeight: 1.1,
          margin: 0,
          color: 'var(--color-text-primary)',
        }}
      >
        {post.title}
      </h3>

      {text && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontStyle: 'italic',
            lineHeight: 1.55,
            color: 'var(--color-text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {text}
        </p>
      )}

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 10,
              marginBottom: 4,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
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
              lineHeight: 1,
            }}
          >
            {daysIn(post.created_at)}d in
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 10,
              marginBottom: 4,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
            }}
          >
            LAST
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: 13,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}
          >
            {relativeTime(post.updated_at)}
          </div>
        </div>
      </div>
    </Link>
  )
}

function OpenBenches({
  posts,
  isSelf,
}: {
  posts: PostSummary[]
  isSelf: boolean
}) {
  return (
    <section
      style={{
        maxWidth: 1320,
        width: '100%',
        margin: '0 auto',
        padding: '8px clamp(24px, 5vw, 56px) 48px',
      }}
    >
      <SectionLabel
        count={posts.length}
        right={
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
            }}
          >
            {isSelf
              ? 'Pick one up where you left it.'
              : "What they're working on right now."}
          </span>
        }
      >
        OPEN BENCHES
      </SectionLabel>

      {posts.length === 0 ? (
        <div
          style={{
            padding: '56px 0',
            textAlign: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
          }}
        >
          Nothing started yet. The bench is empty.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {posts.map((p, i) => (
            <BenchCard key={p.post_id} post={p} index={i} />
          ))}
        </div>
      )}
    </section>
  )
}

function HatchFill() {
  return (
    <svg
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, opacity: 0.4 }}
    >
      <defs>
        <pattern
          id="profile-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="var(--color-border)"
            strokeWidth="0.7"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#profile-hatch)" />
    </svg>
  )
}

function Playlists() {
  return (
    <section
      style={{
        maxWidth: 1320,
        width: '100%',
        margin: '0 auto',
        padding: '12px clamp(24px, 5vw, 56px) 64px',
      }}
    >
      <SectionLabel count={0}>PLAYLISTS</SectionLabel>

      <div
        style={{
          position: 'relative',
          border: '1px solid var(--color-border)',
          padding: '40px 28px',
          overflow: 'hidden',
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HatchFill />
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
          }}
        >
          No playlists yet. Coming soon.
        </span>
      </div>
    </section>
  )
}

function ProfileFooter() {
  return (
    <footer
      style={{
        maxWidth: 1320,
        width: '100%',
        margin: '0 auto',
        padding: '32px clamp(24px, 5vw, 56px) 64px',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontStyle: 'italic',
          color: 'var(--color-text-muted)',
        }}
      >
        A marker stone is carved by those who passed.
      </span>
      <span
        style={{
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'var(--color-text-muted)',
        }}
      >
        CIPPUS · {toRomanYear(new Date().getFullYear())}
      </span>
    </footer>
  )
}

function ProfileSkeleton() {
  return (
    <main style={{ flex: 1 }}>
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: 'clamp(32px, 5vw, 56px) clamp(24px, 5vw, 56px)',
          display: 'flex',
          gap: 36,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 116,
            height: 116,
            borderRadius: '50%',
            background: 'var(--color-surface-raised)',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            paddingTop: 6,
          }}
        >
          <div
            style={{
              height: 10,
              width: 52,
              background: 'var(--color-surface-raised)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              height: 48,
              width: '50%',
              background: 'var(--color-surface-raised)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              height: 14,
              width: '65%',
              background: 'var(--color-surface-raised)',
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/profile/$userId')({
  component: ProfilePage,
})

function ProfilePage() {
  const { userId } = Route.useParams()
  const authUser = useAuthStore((s) => s.user)
  const isSelf = authUser?.id === Number(userId)

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/v1/users/${userId}`, {
        method: 'GET',
      })
      const data = await res.json()
      return data.user as UserProfile
    },
  })

  const postQuery = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      const params = new URLSearchParams({ author_id: userId })
      const res = await fetchWithAuth(`/api/v1/logs?${params}`, {
        method: 'GET',
      })
      const data = await res.json()
      return (data.post ?? []) as PostSummary[]
    },
  })

  const user = userQuery.data
  const posts = postQuery.data ?? []

  if (!user) return <ProfileSkeleton />

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Masthead user={user} isSelf={isSelf} />
      <WorkshopRow user={user} postsCount={posts.length} />
      <OpenBenches posts={posts} isSelf={isSelf} />
      <Playlists />
      <ProfileFooter />
    </main>
  )
}
