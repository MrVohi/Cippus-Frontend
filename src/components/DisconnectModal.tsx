import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '#/stores/useAuthStore'
import { fetchWithAuth } from '#/lib/api'

interface Props {
  onClose: () => void
}

export function DisconnectModal({ onClose }: Props) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSignOut() {
    try {
      await fetchWithAuth('/api/v1/auth/logout', { method: 'POST' })
    } catch {}
    logout()
    onClose()
    navigate({ to: '/' })
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(10, 8, 6, 0.5)',
          zIndex: 100,
          animation: 'modal-scrim-in var(--duration-fast) var(--ease-out) both',
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account options"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 101,
          width: 'min(320px, calc(100vw - 32px))',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          animation: 'modal-in var(--duration-base) var(--ease-spring) both',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 500,
            color: 'var(--color-text-primary)',
          }}
        >
          {initial}
        </div>

        {/* User info */}
        <div
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '-0.005em',
              color: 'var(--color-text-primary)',
            }}
          >
            {user?.username}
          </div>
          <div className="label">{user?.role}</div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 1,
            background: 'var(--color-border)',
          }}
        />

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
          }}
        >
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '11px 0',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition:
                'background var(--duration-fast) var(--ease-base), transform var(--duration-fast) var(--ease-base)',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                'var(--color-accent-hover)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                'var(--color-accent)'
            }}
          >
            Sign out
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              cursor: 'pointer',
              transition:
                'border-color var(--duration-fast) var(--ease-base), color var(--duration-fast) var(--ease-base)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'var(--color-text-secondary)'
              el.style.color = 'var(--color-text-primary)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.borderColor = 'var(--color-border)'
              el.style.color = 'var(--color-text-muted)'
            }}
          >
            Stay signed in
          </button>
        </div>
      </div>
    </>
  )
}
