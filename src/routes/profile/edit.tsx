import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '#/stores/useAuthStore'
import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { fetchWithAuth } from '#/lib/api'

const CRAFTS = [
  'Iron',
  'Wood',
  'Stone',
  'Bread',
  'Ceramics',
  'Electronics',
  'Textiles',
  'Leather',
  'Glass',
  'Brewing',
  'Coffee',
  'Letterpress',
  'Restore',
  'Optics',
]
const BIO_MAX = 140

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/profile/edit')({
  beforeLoad: ({ context }) => {
    const { user } = context.getAuth()
    if (!user) throw redirect({ to: '/auth/login' })
  },
  component: ProfileEditPage,
})

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Slug({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

function FieldLabel({
  children,
  right,
}: {
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 14,
      }}
    >
      <Slug>{children}</Slug>
      {right && <div>{right}</div>}
    </div>
  )
}

// ─── Stone Input ──────────────────────────────────────────────────────────────

function StoneInput({
  value,
  onChange,
  placeholder,
  maxLength,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      style={{
        borderBottom: `1px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
        paddingBottom: 10,
        transition: 'border-color 160ms ease',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 3vw, 32px)',
          fontWeight: 500,
          letterSpacing: '-0.005em',
          color: 'var(--color-text-primary)',
          padding: 0,
          caretColor: 'var(--color-accent)',
        }}
      />
    </div>
  )
}

// ─── Bio Input ────────────────────────────────────────────────────────────────

function BioInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  maxLength: number
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      style={{
        borderBottom: `1px solid ${focused ? 'var(--color-accent)' : 'var(--color-border)'}`,
        paddingBottom: 10,
        transition: 'border-color 160ms ease',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 18,
          color: 'var(--color-text-primary)',
          padding: 0,
          caretColor: 'var(--color-accent)',
        }}
      />
    </div>
  )
}

// ─── Avatar Edit ──────────────────────────────────────────────────────────────

function AvatarEdit({
  initial,
  preview,
  onFileChange,
}: {
  initial: string
  preview: string | null
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
      <button
        type="button"
        aria-label="Change avatar"
        onClick={() => fileRef.current?.click()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          width: 'clamp(110px, 16vw, 156px)',
          height: 'clamp(110px, 16vw, 156px)',
          borderRadius: '50%',
          background: 'var(--color-surface-raised)',
          border: `1px solid ${hovered ? 'var(--color-accent)' : 'var(--color-border)'}`,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
          transition: 'border-color 160ms ease',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(48px, 8vw, 78px)',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1,
                color: 'var(--color-text-primary)',
              }}
            >
              {initial}
            </span>
          )}
        </div>

        {/* Change pill */}
        <span
          style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-accent)',
            color: 'var(--color-accent)',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            padding: '5px 12px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          Change
        </span>
      </button>
    </>
  )
}

// ─── Craft Chip ───────────────────────────────────────────────────────────────

function CraftChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? 'var(--color-surface-raised)' : 'transparent',
        border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
        color: selected ? 'var(--color-accent)' : 'var(--color-text-muted)',
        padding: '10px 18px 11px',
        borderRadius: 999,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition:
          'border-color 160ms ease, color 160ms ease, background 160ms ease',
      }}
    >
      {selected && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ProfileEditPage() {
  const authUser = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const patchMeMutation = useMutation({
    mutationFn: async ({
      username,
      bio,
    }: {
      username: string
      bio: string
    }) => {
      return fetchWithAuth('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio }),
      })
    },
  })

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('avatar', file)
      return fetchWithAuth('/api/v1/users/me/avatar', {
        method: 'PATCH',
        body: form,
      })
    },
  })
  const [name, setName] = useState(authUser?.username ?? '')
  const [bio, setBio] = useState(authUser?.bio ?? '')
  const [crafts, setCrafts] = useState<string[]>([])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    authUser?.avatarUrl ?? null,
  )
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const initial = (authUser?.username?.[0] ?? '?').toUpperCase()
  const overHalf = bio.length / BIO_MAX > 0.66

  const changes = [
    name !== (authUser?.username ?? '') ? 1 : 0,
    bio !== (authUser?.bio ?? '') ? 1 : 0,
    pendingFile ? 1 : 0,
    crafts.length > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  function toggleCraft(c: string) {
    setCrafts((curr) =>
      curr.includes(c) ? curr.filter((x) => x !== c) : [...curr, c],
    )
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!authUser) return
    await patchMeMutation.mutateAsync({ username: name, bio })
    let newAvatarUrl: string | null = authUser.avatarUrl
    if (pendingFile) {
      const avatarResponse = await avatarMutation.mutateAsync(pendingFile)
      const avatarData = await avatarResponse.json()
      newAvatarUrl = avatarData.avatarUrl
    }
    setUser({
      ...authUser,
      username: name,
      bio: bio,
      avatarUrl: newAvatarUrl,
    })
    navigate({
      to: '/profile/$userId',
      params: { userId: String(authUser?.id) },
    })
  }

  function handleCancel() {
    navigate({
      to: '/profile/$userId',
      params: { userId: String(authUser?.id) },
    })
  }

  return (
    <main
      className="row-enter"
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {/* Editing header */}
      <section
        style={{
          maxWidth: 1320,
          width: '100%',
          margin: '0 auto',
          padding: 'clamp(32px, 5vw, 48px) clamp(24px, 5vw, 56px) 28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              padding: 0,
              transition: 'color var(--duration-fast) var(--ease-base)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'var(--color-text-primary)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--color-text-muted)')
            }
          >
            ← {authUser?.username}'s workshop
          </button>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
            ·
          </span>
          <Slug>EDITING</Slug>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 500,
            letterSpacing: '-0.015em',
            lineHeight: 1,
            margin: 0,
            color: 'var(--color-text-primary)',
          }}
        >
          Your stone
        </h1>
        <p
          style={{
            margin: '14px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontStyle: 'italic',
            color: 'var(--color-text-muted)',
            maxWidth: 620,
            lineHeight: 1.5,
          }}
        >
          Mark it as you like. What's carved is what others find.
        </p>
      </section>

      {/* Edit card */}
      <section
        style={{
          maxWidth: 1080,
          width: '100%',
          margin: '0 auto',
          padding: '0 clamp(24px, 5vw, 56px) 32px',
        }}
      >
        <div
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            padding: 'clamp(28px, 5vw, 64px) clamp(20px, 5vw, 72px)',
            display: 'flex',
            gap: 'clamp(32px, 5vw, 56px)',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* Left — avatar + handle */}
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 28,
              paddingTop: 8,
            }}
          >
            <AvatarEdit
              initial={initial}
              preview={avatarPreview}
              onFileChange={handleAvatarChange}
            />
            {authUser?.username && (
              <div style={{ textAlign: 'center', paddingTop: 10 }}>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  @{authUser.username}
                </span>
              </div>
            )}
          </div>

          {/* Right — form */}
          <div
            style={{
              flex: 1,
              minWidth: 240,
              display: 'flex',
              flexDirection: 'column',
              gap: 38,
            }}
          >
            {/* Name */}
            <div>
              <FieldLabel>NAME</FieldLabel>
              <StoneInput
                value={name}
                onChange={setName}
                placeholder="What others will call you"
                maxLength={60}
                autoFocus
              />
            </div>

            {/* Bio */}
            <div>
              <FieldLabel
                right={
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      color: overHalf
                        ? 'var(--color-accent)'
                        : 'var(--color-text-muted)',
                      transition: 'color 160ms ease',
                    }}
                  >
                    {String(bio.length).padStart(3, '0')} / {BIO_MAX}
                  </span>
                }
              >
                BIO · ONE LINE
              </FieldLabel>
              <BioInput
                value={bio}
                onChange={setBio}
                placeholder="What you're working on. Keep it sharp."
                maxLength={BIO_MAX}
              />
              <p
                style={{
                  margin: '12px 0 0',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                }}
              >
                One line is plenty. Others read this first.
              </p>
            </div>

            {/* Crafts — visual only, no mutation until model supports it */}
            <div>
              <FieldLabel
                right={
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {String(crafts.length).padStart(2, '0')} CHOSEN
                  </span>
                }
              >
                CRAFTS · WHAT YOU MAKE
              </FieldLabel>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  paddingTop: 4,
                }}
              >
                {CRAFTS.map((c) => (
                  <CraftChip
                    key={c}
                    label={c}
                    selected={crafts.includes(c)}
                    onClick={() => toggleCraft(c)}
                  />
                ))}
              </div>
              <p
                style={{
                  margin: '14px 0 0',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Pick what you actually work in. You'll see those builders first.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '32px 0 0',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--color-border)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              letterSpacing: '0.02em',
              padding: '0 0 3px',
              transition:
                'color var(--duration-fast) var(--ease-base), border-color var(--duration-fast) var(--ease-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text-primary)'
              e.currentTarget.style.borderColor = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)'
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {changes > 0 && (
              <span
                style={{
                  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  color: 'var(--color-text-muted)',
                }}
              >
                UNSAVED · {changes} {changes === 1 ? 'CHANGE' : 'CHANGES'}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                padding: '14px 28px',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                lineHeight: 1,
                transition:
                  'background var(--duration-fast) var(--ease-base), transform var(--duration-fast) var(--ease-base)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-accent-hover)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-accent)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Save changes
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          maxWidth: 1320,
          width: '100%',
          margin: '32px auto 0',
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
          CIPPUS · MMXXVI
        </span>
      </footer>
    </main>
  )
}
