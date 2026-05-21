import { useAuthStore } from '#/stores/useAuthStore'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { CippusMark } from '#/components/CippusMark'
import { PrivacyContent } from '#/content/privacy'
import { TermsContent } from '#/content/terms'

export const Route = createFileRoute('/auth/setup')({
  component: RouteComponent,
})

function Field({
  id,
  label,
  placeholder,
  helper,
  multiline,
  value,
  onChange,
}: {
  id: string
  label: string
  placeholder?: string
  helper?: string
  multiline?: boolean
  value?: string
  onChange?: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: multiline ? 'flex-start' : 'baseline',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {multiline ? (
          <textarea
            id={id}
            rows={2}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: 'var(--color-text-primary)',
              background: 'transparent',
              border: 'none',
              padding: '10px 2px 12px',
              outline: 'none',
              flex: 1,
              width: '100%',
              resize: 'none',
              lineHeight: 1.45,
            }}
          />
        ) : (
          <input
            id={id}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              color: 'var(--color-text-primary)',
              background: 'transparent',
              border: 'none',
              padding: '10px 2px 12px',
              outline: 'none',
              flex: 1,
              width: '100%',
            }}
          />
        )}
      </div>
      {helper && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
            lineHeight: 1.45,
          }}
        >
          {helper}
        </p>
      )}
    </div>
  )
}

function ToggleRow({
  title,
  body,
  on,
  locked,
  onToggle,
}: {
  title: string
  body: string
  on?: boolean
  locked?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: '20px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-muted)',
            lineHeight: 1.45,
          }}
        >
          {body}
        </div>
      </div>
      {locked ? (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            marginTop: 4,
            whiteSpace: 'nowrap',
          }}
        >
          Always on
        </span>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={onToggle}
          style={{
            width: 38,
            height: 22,
            flexShrink: 0,
            marginTop: 2,
            borderRadius: 999,
            border: `1px solid ${on ? 'var(--color-accent)' : 'var(--color-border)'}`,
            background: on ? 'var(--color-accent)' : 'transparent',
            padding: 0,
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 160ms ease, border-color 160ms ease',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: on ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: on
                ? 'var(--color-text-on-accent)'
                : 'var(--color-text-secondary)',
              transition: 'left 200ms ease',
            }}
          />
        </button>
      )}
    </div>
  )
}

function StepIntro({
  eyebrow,
  title,
  supporting,
}: {
  eyebrow: string
  title: string
  supporting: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginBottom: 28,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          fontWeight: 500,
        }}
      >
        {eyebrow}
      </span>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 32,
          lineHeight: 1.12,
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: '4px 0 0',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 17,
          lineHeight: 1.4,
          color: 'var(--color-text-secondary)',
        }}
      >
        {supporting}
      </p>
    </div>
  )
}

function RouteComponent() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState<'forward' | 'back'>('forward')
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState(
    useAuthStore.getState().user?.username ?? '',
  )
  const [bio, setBio] = useState(useAuthStore.getState().user?.bio ?? '')
  const [notifReplies, setNotifReplies] = useState(true)
  const [notifFollows, setNotifFollows] = useState(true)
  const [notifWeekly, setNotifWeekly] = useState(false)
  const [notifNews, setNotifNews] = useState(false)

  function goBack() {
    setDir('back')
    setStep((s) => Math.max(1, s - 1))
  }

  function goForward() {
    setDir('forward')
    setStep((s) => Math.min(5, s + 1))
  }

  async function handleContinue() {
    setError(null)
    if (step === 1) {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/v1/users/me',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + useAuthStore.getState().token,
          },
          body: JSON.stringify({ username, bio }),
          credentials: 'include',
        },
      )
      if (!res.ok) {
        setError('Could not save settings. Please try again.')
        return
      }
    }
    goForward()
  }

  const animClass = dir === 'forward' ? 'step-enter' : 'step-enter-back'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: '#DDD2BE',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
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
      </div>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
        }}
      >
        <div
          style={{
            width: 460,
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 56px - 64px)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <header
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              padding: '20px 22px 18px',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            <div style={{ justifySelf: 'start' }}>
              {step !== 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Back"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 6,
                    marginLeft: -6,
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M11 3 L5 9 L11 15"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
            <div
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={5}
              aria-label={`Step ${step} of 5`}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  style={{
                    width: i === step ? 8 : 6,
                    height: i === step ? 8 : 6,
                    borderRadius: '50%',
                    background:
                      i === step
                        ? 'var(--color-accent)'
                        : i < step
                          ? 'var(--color-text-secondary)'
                          : 'var(--color-border)',
                    transition: 'background 200ms ease',
                  }}
                />
              ))}
            </div>
            <div style={{ justifySelf: 'end' }}>
              {(step === 1 || step === 2) && (
                <button
                  type="button"
                  onClick={goForward}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 0',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Skip
                </button>
              )}
            </div>
          </header>

          <div
            key={step}
            className={animClass}
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: step === 3 || step === 4 ? 0 : '28px 24px 0',
              overflow: 'hidden',
            }}
          >
            {step === 1 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 28,
                  overflowY: 'auto',
                  paddingBottom: 24,
                }}
              >
                <StepIntro
                  eyebrow="Step 1 - Settings"
                  title="A bit about you, if you'd like."
                  supporting="All of this is optional. You can change it any time."
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div
                    style={{
                      width: 72,
                      height: 84,
                      background: 'var(--color-border)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      clipPath:
                        'polygon(20% 0, 80% 0, 92% 8%, 100% 18%, 100% 100%, 0 100%, 0 18%, 8% 8%)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 38,
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1,
                      }}
                    >
                      {username.length > 0 ? username[0].toUpperCase() : '?'}
                    </span>
                  </div>
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    <button
                      type="button"
                      disabled
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'not-allowed',
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                        color: 'var(--color-text-muted)',
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: 2,
                        alignSelf: 'flex-start',
                        opacity: 0.4,
                      }}
                    >
                      Add a photo
                    </button>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 12,
                        color: 'var(--color-text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      Available soon.
                    </span>
                  </div>
                </div>
                <Field
                  id="username"
                  label="Display name"
                  placeholder="What others should call you"
                  value={username}
                  onChange={setUsername}
                />
                <Field
                  id="bio"
                  label="Short bio"
                  placeholder="What you make, in a line or two"
                  helper="Shown at the top of your logs."
                  multiline
                  value={bio}
                  onChange={setBio}
                />
                {error && (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--color-accent)',
                    }}
                  >
                    {error}
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  paddingBottom: 24,
                }}
              >
                <StepIntro
                  eyebrow="Step 2 - Notifications"
                  title="What do you want to hear about?"
                  supporting="Match moments stay on - that's the whole point of the road."
                />
                <ToggleRow
                  title="Match moments"
                  body="When someone hits exactly what you're working through."
                  locked
                />
                <ToggleRow
                  title="Replies on your logs"
                  body="When another builder leaves a note on something you wrote."
                  on={notifReplies}
                  onToggle={() => setNotifReplies((v) => !v)}
                />
                <ToggleRow
                  title="New logs from people you follow"
                  body="A quiet ping. Nothing breaking."
                  on={notifFollows}
                  onToggle={() => setNotifFollows((v) => !v)}
                />
                <ToggleRow
                  title="Weekly road"
                  body="Sunday digest of what's moved on the builds you're watching."
                  on={notifWeekly}
                  onToggle={() => setNotifWeekly((v) => !v)}
                />
                <ToggleRow
                  title="Workshop news"
                  body="Rare. Only when something about Cippus itself changes."
                  on={notifNews}
                  onToggle={() => setNotifNews((v) => !v)}
                />
              </div>
            )}

            {(step === 3 || step === 4) && (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ padding: '28px 24px 18px' }}>
                  <StepIntro
                    eyebrow={
                      step === 3
                        ? 'Step 3 - House rules'
                        : 'Step 4 - Terms of use'
                    }
                    title={
                      step === 3
                        ? 'How we handle what you write.'
                        : 'What we ask of each other.'
                    }
                    supporting={
                      step === 3
                        ? 'Plain language. The legal version is linked at the end.'
                        : 'A workshop only works if everyone leaves it usable.'
                    }
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      overflow: 'auto',
                      padding: '20px 24px 32px',
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {step === 3 ? <PrivacyContent /> : <TermsContent />}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 36,
                      pointerEvents: 'none',
                      background:
                        'linear-gradient(to bottom, transparent, var(--color-bg))',
                    }}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 24,
                  padding: '32px 28px',
                }}
              >
                <CippusMark size={88} />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxWidth: 280,
                  }}
                >
                  <h1
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                      fontSize: 32,
                      letterSpacing: '-0.005em',
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.1,
                    }}
                  >
                    That is the shape of it.
                  </h1>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: 17,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.4,
                    }}
                  >
                    Now - what are you working on?
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '20px 24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={
                step === 5
                  ? () => navigate({ to: '/onboarding' })
                  : handleContinue
              }
              style={{
                width: '100%',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: 15,
                letterSpacing: '0.05em',
                color: 'var(--color-text-on-accent)',
                background: 'var(--color-accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '16px 18px',
                cursor: 'pointer',
                textAlign: 'center',
                lineHeight: 1,
              }}
            >
              {step === 5 ? 'Open the road' : 'Continue'}
            </button>
            {(step === 3 || step === 4) && (
              <p
                style={{
                  margin: 0,
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                {step === 3
                  ? 'Tap to accept or scroll to read'
                  : 'Placeholder copy - final terms pending'}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
