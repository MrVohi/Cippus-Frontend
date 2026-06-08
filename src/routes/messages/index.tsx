import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { fetchWithAuth } from '#/lib/api'
import { useAuthStore } from '#/stores/useAuthStore'

export const Route = createFileRoute('/messages/')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user == null) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: MessagesPage,
})

type Message = {
  ID: number
  SenderID: number
  ReceiverID: number
  Content: string
  ReadAt: string | null
  CreatedAt: string
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

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Avatar({ initial, size = 36 }: { initial: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--bg-sunken)',
        border: '1px solid var(--rule)',
        fontFamily: 'var(--font-display)',
        fontSize: size * 0.42,
        fontWeight: 500,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--fg-muted)',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  )
}

function MessagesPage() {
  const queryClient = useQueryClient()
  const myID = useAuthStore((s) => s.user?.id) ?? 0
  const [selectedUserID, setSelectedUserID] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const threadEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [] } = useQuery<Message[]>({
    queryKey: ['conversations'],
    queryFn: () =>
      fetchWithAuth('/api/v1/messages', { method: 'GET' })
        .then((r) => r.json())
        .then((d) => d ?? []),
  })

  const { data: thread = [] } = useQuery<Message[]>({
    queryKey: ['thread', selectedUserID],
    queryFn: () =>
      fetchWithAuth(`/api/v1/messages/${selectedUserID}`, {
        method: 'GET',
      }).then((r) => r.json()),
    enabled: selectedUserID !== null,
  })

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      fetchWithAuth('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverID: selectedUserID, content: text }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['thread', selectedUserID] }),
  })

  useEffect(() => {
    if (!thread.length) return
    thread
      .filter((m) => m.ReadAt === null && m.ReceiverID === myID)
      .forEach((m) => {
        fetchWithAuth(`/api/v1/messages/${m.ID}/read`, { method: 'PUT' })
      })
  }, [thread, myID])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  function handleSend() {
    const text = content.trim()
    if (!text || selectedUserID === null) return
    sendMutation.mutate(text)
    setContent('')
  }

  function otherID(m: Message) {
    return m.SenderID === myID ? m.ReceiverID : m.SenderID
  }

  const unreadCount = conversations.filter(
    (m) => m.ReadAt === null && m.ReceiverID === myID,
  ).length

  const threadOpen = selectedUserID !== null

  return (
    <main className="row-enter max-w-[1320px] mx-auto w-full px-4 sm:px-8 lg:px-14 pb-14 flex flex-col flex-1">
      <section
        className={`pt-14 pb-7 ${threadOpen ? 'hidden lg:block' : 'block'}`}
      >
        <div className="label mb-4">MESSAGES</div>
        <div className="flex items-end justify-between gap-10 flex-wrap">
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 56px)',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1,
                margin: 0,
                color: 'var(--fg)',
              }}
            >
              Builders talking to builders.
            </h1>
            <p
              className="hidden sm:block"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                fontStyle: 'italic',
                color: 'var(--fg-muted)',
                margin: '14px 0 0',
                maxWidth: 560,
                lineHeight: 1.5,
              }}
            >
              Plain text. No reactions, no read receipts. Say what you mean and
              get back to the bench.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="label" style={{ color: 'var(--fg-faint)' }}>
              UNREAD
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: 14,
                color: 'var(--accent)',
                letterSpacing: '0.02em',
              }}
            >
              {String(unreadCount).padStart(2, '0')}
            </span>
            <span
              aria-hidden="true"
              style={{
                width: 1,
                height: 16,
                background: 'var(--rule)',
                margin: '0 8px',
              }}
            />
            <button
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--fg)',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--fg)',
                paddingBottom: 2,
                cursor: 'pointer',
              }}
            >
              New message →
            </button>
          </div>
        </div>
      </section>

      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: 'var(--msg-cols, 1fr)',
          border: '1px solid var(--rule)',
          background: 'var(--bg)',
          minHeight: 520,
          overflow: 'hidden',
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            .msg-pane { --msg-cols: 360px minmax(0, 1fr) !important; }
          }
        `}</style>

        <aside
          className={`flex flex-col min-h-0 ${threadOpen ? 'hidden lg:flex' : 'flex'} msg-pane`}
          style={{
            borderRight: '1px solid var(--rule)',
            background: 'var(--bg)',
          }}
        >
          <div
            className="flex items-center gap-2.5 px-4 py-3.5"
            style={{ borderBottom: '1px solid var(--rule)' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              style={{ color: 'var(--fg-faint)', flexShrink: 0 }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="M15.5 15.5 L20 20" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Find a builder…"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--fg)',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                flex: 1,
              }}
            />
            <span
              className="label"
              style={{ color: 'var(--fg-faint)', fontSize: 10 }}
            >
              {conversations.length} OPEN
            </span>
          </div>

          <div className="overflow-y-auto flex-1">
            {conversations.map((c, i) => {
              const other = otherID(c)
              const isActive = selectedUserID === other
              const isUnread = c.ReadAt === null && c.ReceiverID === myID
              return (
                <button
                  key={c.ID}
                  onClick={() => setSelectedUserID(other)}
                  className="row-enter w-full text-left cursor-pointer"
                  style={{
                    animationDelay: `${i * 40}ms`,
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: '36px minmax(0, 1fr) auto',
                    columnGap: 14,
                    padding: '16px 18px 16px 20px',
                    borderBottom: '1px solid var(--rule)',
                    background: isActive ? 'var(--bg-raised)' : 'transparent',
                    border: 'none',
                    color: 'inherit',
                    transition: 'background 150ms ease',
                  }}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: 'var(--accent)',
                      }}
                    />
                  )}
                  <Avatar initial={String(other).charAt(0)} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 17,
                        fontWeight: 500,
                        color:
                          isUnread || isActive
                            ? 'var(--fg)'
                            : 'var(--fg-muted)',
                        letterSpacing: '-0.005em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: 5,
                      }}
                    >
                      Builder {other}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        color: isUnread ? 'var(--fg)' : 'var(--fg-muted)',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {c.Content}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2.5 pt-0.5 shrink-0">
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                        fontSize: 11,
                        color: isUnread ? 'var(--fg)' : 'var(--fg-faint)',
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {relativeTime(c.CreatedAt)}
                    </span>
                    {isUnread && (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section
          className={`flex flex-col min-w-0 ${threadOpen ? 'flex' : 'hidden lg:flex'} step-in`}
          style={{ background: 'var(--bg)' }}
        >
          {selectedUserID === null ? (
            <div
              className="flex-1 flex items-center justify-center"
              style={{
                color: 'var(--fg-faint)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontStyle: 'italic',
              }}
            >
              Select a conversation to start reading.
            </div>
          ) : (
            <>
              <header
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 40px minmax(0,1fr) auto',
                  alignItems: 'center',
                  columnGap: 14,
                  padding: '18px 28px',
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                <button
                  onClick={() => setSelectedUserID(null)}
                  className="lg:hidden"
                  aria-label="Back to conversations"
                  style={{
                    width: 28,
                    height: 28,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--fg-muted)',
                    padding: 0,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 6 L9 12 L15 18" />
                  </svg>
                </button>

                <Avatar initial={String(selectedUserID).charAt(0)} size={40} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 22,
                      fontWeight: 500,
                      color: 'var(--fg)',
                      letterSpacing: '-0.005em',
                      lineHeight: 1.1,
                    }}
                  >
                    Builder {selectedUserID}
                  </div>
                </div>
                <a
                  href="#"
                  className="hidden sm:inline"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'var(--fg)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--fg)',
                    paddingBottom: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  View their log →
                </a>
              </header>

              <div
                className="flex-1 overflow-y-auto"
                style={{ padding: '8px 28px 0' }}
              >
                {thread.map((m) => {
                  const outgoing = m.SenderID === myID
                  return (
                    <div
                      key={m.ID}
                      className="row-enter"
                      style={{
                        display: 'flex',
                        justifyContent: outgoing ? 'flex-end' : 'flex-start',
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: outgoing ? 'flex-end' : 'flex-start',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            padding: '14px 18px',
                            background: outgoing
                              ? 'var(--bg-sunken)'
                              : 'var(--bg-raised)',
                            border: '1px solid var(--rule)',
                            borderRadius: 'var(--radius-lg)',
                            fontFamily: 'var(--font-body)',
                            fontSize: 15,
                            lineHeight: 1.55,
                            color: 'var(--fg)',
                          }}
                        >
                          {m.Content}
                        </div>
                        <span
                          style={{
                            fontFamily:
                              'JetBrains Mono, ui-monospace, monospace',
                            fontSize: 10,
                            color: 'var(--fg-faint)',
                            letterSpacing: '0.04em',
                            padding: '0 4px',
                          }}
                        >
                          {clockTime(m.CreatedAt)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={threadEndRef} />
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--rule)',
                  padding: '16px 28px 20px',
                  background: 'var(--bg)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 16,
                    padding: '14px 18px',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Say what you mean. Plain text only."
                    rows={1}
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-body)',
                      fontSize: 15,
                      color: 'var(--fg)',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      lineHeight: 1.5,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!content.trim() || sendMutation.isPending}
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--pale-stone)',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      letterSpacing: '0.02em',
                      cursor: content.trim() ? 'pointer' : 'not-allowed',
                      opacity: content.trim() ? 1 : 0.5,
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'opacity 150ms ease',
                    }}
                  >
                    Send
                  </button>
                </div>
                <div
                  className="hidden sm:flex items-center justify-between mt-2.5"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--fg-faint)',
                  }}
                >
                  <span>No reactions · no media · no read receipts</span>
                  <span>Return to send · Shift + return for a new line</span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
