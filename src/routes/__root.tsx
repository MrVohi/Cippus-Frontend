import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthStore } from '#/stores/useAuthStore'
import { useAuthStore } from '#/stores/useAuthStore'
import { useWsStore } from '#/stores/useWsStore'
import { useNotificationStore } from '#/stores/useNotificationStore'
import type { AppNotification } from '#/stores/useNotificationStore'
import { fetchWithAuth } from '#/lib/api'
import { useEffect, useState } from 'react'

interface MyRouterContext {
  queryClient: QueryClient
  getAuth: () => AuthStore
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

function notifLabel(type: string, actorID: number): string {
  switch (type) {
    case 'reply':
      return `Builder ${actorID} replied to your entry.`
    case 'like':
      return `Builder ${actorID} liked your content.`
    case 'mention':
      return `Builder ${actorID} mentioned you.`
    case 'dm':
      return `Builder ${actorID} sent you a message.`
    case 'post_flagged':
      return 'Your post was flagged for review.'
    case 'post_approved':
      return 'Your post was approved.'
    default:
      return `New notification from Builder ${actorID}.`
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return m <= 1 ? 'just now' : `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d`
  return `${Math.floor(d / 7)}w`
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const notifications = useNotificationStore((s) => s.notifications)

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          top: 'var(--navbar-height)',
          background: 'rgba(10, 8, 6, 0.45)',
          zIndex: 40,
        }}
      />
      {/* Panel */}
      <aside
        className="step-in"
        style={{
          position: 'fixed',
          top: 'var(--navbar-height)',
          right: 0,
          bottom: 0,
          width: 408,
          background: 'var(--color-bg)',
          borderLeft: '1px solid var(--color-border)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-primary)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 22px 14px',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 500,
              fontSize: 26,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.005em',
            }}
          >
            Notifications
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Mark all as read
            </button>
            <button
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 5l14 14M19 5L5 19"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        {notifications.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0 36px',
              textAlign: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: 'var(--color-text-primary)',
                letterSpacing: '0.005em',
                marginTop: 6,
              }}
            >
              Nothing yet.
            </div>
            <div
              style={{
                fontSize: 14,
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
              }}
            >
              Keep building.
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifications.map((n, i) => (
              <div
                key={n.ID}
                className="row-enter"
                style={{
                  animationDelay: `${i * 30}ms`,
                  position: 'relative',
                  display: 'flex',
                  gap: 14,
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--color-border)',
                  background:
                    n.ReadAt === null
                      ? 'var(--color-surface-raised)'
                      : 'transparent',
                  borderLeft:
                    n.Type === 'mention'
                      ? '3px solid var(--color-accent)'
                      : '3px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {notifLabel(n.Type, n.ActorID)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                      marginTop: 2,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {relativeTime(n.CreatedAt)}
                  </div>
                </div>
              </div>
            ))}
            <div
              style={{
                padding: '18px 22px 28px',
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
              }}
            >
              That's everything from the last 30 days.
            </div>
          </div>
        )}
      </aside>
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const { location } = useRouterState()
  const isLanding = location.pathname === '/'

  const queryClient = useQueryClient()
  const { socket, setSocket, setStatus } = useWsStore()
  const { setNotifications, incrementUnread, resetUnread } =
    useNotificationStore()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    async function hydrate() {
      const currentUser = useAuthStore.getState().user

      if (currentUser != null) {
        return
      }

      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + '/api/v1/auth/refresh',
          { method: 'POST', credentials: 'include' },
        )

        if (response.ok) {
          const data = await response.json()
          useAuthStore.getState().setUser(data.user)
          useAuthStore.getState().setToken(data.accessToken)
        }
      } catch (error) {}
    }
    hydrate()
  }, [])

  const { data: notificationsData } = useQuery<AppNotification[]>({
    queryKey: ['notifications'],
    queryFn: () =>
      fetchWithAuth('/api/v1/notifications', { method: 'GET' }).then((r) =>
        r.json(),
      ),
    enabled: user !== null,
    retry: false,
  })

  useEffect(() => {
    if (notificationsData) setNotifications(notificationsData)
  }, [notificationsData])

  useEffect(() => {
    if (!token) return
    if (socket && socket.readyState === WebSocket.OPEN) return

    const wsBase = import.meta.env.VITE_API_URL.replace(/^http/, 'ws')
    const ws = new WebSocket(`${wsBase}/api/v1/ws?token=${token}`)
    setSocket(ws)
    setStatus('connecting')

    ws.onopen = () => setStatus('open')
    ws.onclose = () => setStatus('closed')

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if ('Type' in payload) {
        incrementUnread()
        const current = useNotificationStore.getState().notifications
        setNotifications([payload as AppNotification, ...current])
      } else {
        queryClient.setQueryData(
          ['thread', payload.SenderID],
          (old: AppNotification[] | undefined) =>
            old ? [...old, payload] : [payload],
        )
      }
    }

    return () => ws.close()
  }, [token])

  useEffect(() => {
    if (user === null) return
    if (!('serviceWorker' in navigator)) return
    if (!('PushManager' in window)) return

    async function registerPush() {
      const registration = await navigator.serviceWorker.register('/sw.js')

      // already subscribed — nothing to do
      const existing = await registration.pushManager.getSubscription()
      if (existing) return

      const res = await fetchWithAuth('/api/v1/push/vapid-public-key', {
        method: 'GET',
      })
      const { publicKey } = await res.json()

      const applicationServerKey = urlBase64ToUint8Array(publicKey)
        .buffer as ArrayBuffer

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      const { endpoint, keys } = subscription.toJSON()
      await fetchWithAuth('/api/v1/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          p256dh: keys!.p256dh,
          auth: keys!.auth,
        }),
      })
    }

    registerPush().catch(() => {})
  }, [user])

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen flex flex-col">
        {!isLanding && (
          <nav className="flex justify-between items-center px-6 py-1 bg-(--color-nav-bg) border-b border-(--color-nav-border)">
            <div className="flex items-center gap-4">
              <Link className="flex items-center gap-4" to="/">
                <p>logo</p>
                <p className="font-display font-semibold">Cippus</p>
              </Link>
              <div className="text-(--color-text-muted) flex gap-8 ml-5">
                <Link to="/">Home</Link>
                <Link to="/logs" search={{ sort: 'recent' }}>
                  Logs
                </Link>
                <span>Profile</span>
                <span>Search</span>
              </div>
            </div>

          {user ? (
            <div>
              <span>avatar</span>
              <Link to="/logs"> · START LOG</Link> // file logs/start-log
              <Link to="/messages/messages" className="btn-ghost">
                {' '}
                · NEW MESSAGE
              </Link>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <span> · ADMIN</span>
              )}
            </div>
          ) : (
            <Link to="/auth/login" className="btn-ghost">
              LOG IN
            </Link>
          )}
        </nav>
            {user ? (
              <div>
                <span>avatar</span>
                <Link to="/logs/new"> · START LOG</Link>
                <Link to="/messages"> · NEW MESSAGE</Link>
                <button
                  type="button"
                  onClick={() => {
                    setPanelOpen((o) => !o)
                    resetUnread()
                  }}
                  style={{ position: 'relative' }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 16h12l-1.5-2V10a4.5 4.5 0 1 0-9 0v4L6 16Z M10 19a2 2 0 0 0 4 0"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'var(--color-accent)',
                      }}
                    />
                  )}
                </button>
                {panelOpen && (
                  <NotificationPanel onClose={() => setPanelOpen(false)} />
                )}
                {(user.role === 'admin' || user.role === 'moderator') && (
                  <span> · ADMIN</span>
                )}
              </div>
            ) : (
              <Link to="/auth/login" className="btn-ghost">
                LOG IN
              </Link>
            )}
          </nav>
        )}
        {children}
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
