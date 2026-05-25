import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { useState } from 'react'
import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'
import { CippusLogoHorizontal } from '#/components/CippusMark'

export const Route = createFileRoute('/auth/password-reset')({
  component: PasswordReset,
  validateSearch: (search) => ({
    token: search.token as string | undefined,
  }),
})

const requestSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})
type RequestFormData = z.infer<typeof requestSchema>

const confirmSchema = z
  .object({
    password: z
      .string()
      .min(8, 'A password of at least 8 characters is required'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type ConfirmFormData = z.infer<typeof confirmSchema>

function PasswordReset() {
  const { token } = Route.useSearch()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: '100vh',
      }}
    >
      <header
        style={{
          padding: '28px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <CippusLogoHorizontal height={20} />
        </Link>
        <Link
          to="/auth/register"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          Need an account?
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px 80px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {token ? <ConfirmForm token={token} /> : <RequestForm />}
        </div>
      </main>

      <footer
        style={{
          padding: '24px 40px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
        }}
      >
        <span>Cippus</span>
        <span>For builders, mid-build.</span>
      </footer>
    </div>
  )
}

function RequestForm() {
  const [sent, setSent] = useState(false)
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: RequestFormData) {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/v1/auth/password-reset/request',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        },
      )
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  if (sent) {
    return (
      <>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>Reset</span>
          <span
            style={{
              width: 24,
              height: 1,
              background: 'var(--color-border)',
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--color-accent)' }}>Sent</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 40,
            lineHeight: 1.1,
            color: 'var(--color-text-primary)',
            margin: '0 0 18px',
            letterSpacing: '-0.005em',
          }}
        >
          Check your inbox.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 18,
            lineHeight: 1.55,
            color: 'var(--color-text-secondary)',
            margin: '0 0 44px',
            maxWidth: 400,
          }}
        >
          If that address is with us, a reset link is on its way.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingBottom: 12,
            borderBottom: '1px solid var(--color-border-subtle)',
            marginBottom: 40,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            Link sent. It expires in 30 minutes.
          </span>
        </div>

        <Link to="/auth/login" className="btn-ghost">
          Back to log in
        </Link>
      </>
    )
  }

  return (
    <>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span>Reset</span>
        <span
          style={{
            width: 24,
            height: 1,
            background: 'var(--color-border)',
            display: 'inline-block',
          }}
        />
        <span style={{ opacity: 0.7 }}>Step 1 of 2</span>
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1.1,
          color: 'var(--color-text-primary)',
          margin: '0 0 14px',
          letterSpacing: '-0.005em',
        }}
      >
        Reset your password
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 17,
          lineHeight: 1.55,
          color: 'var(--color-text-secondary)',
          margin: '0 0 44px',
          maxWidth: 380,
        }}
      >
        Enter the email you signed up with. We'll send a link to set a new one.
      </p>

      {error && (
        <p
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-accent)',
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Label htmlFor="email" className="label">
          Email
        </Label>
        <div
          style={{
            borderBottom: `1px solid ${focused ? 'var(--color-text-secondary)' : 'var(--color-border)'}`,
            paddingBottom: 12,
            marginTop: 8,
            marginBottom: 40,
            transition: 'border-color 160ms ease',
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        >
          <Input
            id="email"
            type="email"
            placeholder="you@workshop.example"
            className="border-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ fontSize: 18, caretColor: 'var(--color-accent)' }}
            {...register('email')}
          />
          {errors.email && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: 'var(--color-accent)',
              }}
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button type="submit" className="btn-primary">
            Send reset link
          </button>
          <Link
            to="/auth/login"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            Back to{' '}
            <span
              style={{
                color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 1,
              }}
            >
              log in
            </span>
          </Link>
        </div>
      </form>
    </>
  )
}

function ConfirmForm({ token }: { token: string }) {
  const navigate = useNavigate()
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  async function onSubmit(data: ConfirmFormData) {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/v1/auth/password-reset/confirm',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword: data.password }),
        },
      )
      if (!res.ok) throw new Error()
      navigate({ to: '/auth/login' })
    } catch {
      setConfirmError('Could not reset password. The link may have expired.')
    }
  }

  return (
    <>
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span>Reset</span>
        <span
          style={{
            width: 24,
            height: 1,
            background: 'var(--color-border)',
            display: 'inline-block',
          }}
        />
        <span style={{ opacity: 0.7 }}>Step 2 of 2</span>
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 40,
          lineHeight: 1.1,
          color: 'var(--color-text-primary)',
          margin: '0 0 14px',
          letterSpacing: '-0.005em',
        }}
      >
        Set a new password
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 17,
          lineHeight: 1.55,
          color: 'var(--color-text-secondary)',
          margin: '0 0 44px',
          maxWidth: 380,
        }}
      >
        Choose something strong. You won't need to remember it often.
      </p>

      {confirmError && (
        <p
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-accent)',
          }}
        >
          {confirmError}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: 32 }}>
          <Label htmlFor="password" className="label">
            New password
          </Label>
          <div
            style={{
              borderBottom: `1px solid ${focusedField === 'password' ? 'var(--color-text-secondary)' : 'var(--color-border)'}`,
              paddingBottom: 12,
              marginTop: 8,
              transition: 'border-color 160ms ease',
            }}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          >
            <Input
              id="password"
              type="password"
              className="border-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ fontSize: 18 }}
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: 'var(--color-accent)',
              }}
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 40 }}>
          <Label htmlFor="confirmPassword" className="label">
            Confirm password
          </Label>
          <div
            style={{
              borderBottom: `1px solid ${focusedField === 'confirmPassword' ? 'var(--color-text-secondary)' : 'var(--color-border)'}`,
              paddingBottom: 12,
              marginTop: 8,
              transition: 'border-color 160ms ease',
            }}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
          >
            <Input
              id="confirmPassword"
              type="password"
              className="border-0 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ fontSize: 18 }}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: 'var(--color-accent)',
              }}
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary">
          Set new password
        </button>
      </form>
    </>
  )
}
