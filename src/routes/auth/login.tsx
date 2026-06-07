import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { useAuthStore } from '#/stores/useAuthStore'
import { Label } from '#/components/ui/label'
import { Input } from '#/components/ui/input'
import { useState } from 'react'
import { CippusMark } from '#/components/CippusMark'

export const Route = createFileRoute('/auth/login')({ component: LoginPage })

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'A password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginFormData) {
    try {
      setLoginError(null)
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Login failed')
      const body = await res.json()
      useAuthStore.getState().setUser(body.user)
      useAuthStore.getState().setToken(body.accessToken)

      navigate({ to: '/' })
    } catch (error) {
      setLoginError('Invalid credentials')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(16px, 3vh, 48px) 24px',
        }}
      >
        <section
          aria-labelledby="login-heading"
          style={{
            width: '100%',
            maxWidth: 'clamp(320px, 22vw, 440px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h1 id="login-heading" style={{ position: 'absolute', left: -9999 }}>
            Log in to Cippus
          </h1>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(6px, 1.2vh, 18px)',
              marginBottom: 'clamp(16px, 2.5vh, 40px)',
            }}
          >
            <div
              className="[&>svg]:w-full [&>svg]:h-full"
              style={{
                width: 'clamp(60px, 9vh, 144px)',
                height: 'clamp(60px, 9vh, 144px)',
              }}
            >
              <CippusMark size={144} />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 'clamp(24px, 3vh, 48px)',
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: 'var(--color-text-primary)',
              }}
            >
              Cippus
            </div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: 'clamp(14px, 1.7vh, 27px)',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              Welcome back to the road.
            </p>
          </div>

          {loginError && (
            <p
              style={{
                margin: '0 0 16px',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--color-accent)',
                textAlign: 'center',
              }}
            >
              {loginError}
            </p>
          )}

          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(10px, 1.5vh, 24px)',
            }}
            onSubmit={handleSubmit(onSubmit)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Label htmlFor="email" className="label">
                EMAIL
              </Label>
              <Input
                id="email"
                placeholder="you@workshop"
                className="border-0 border-b border-(--color-border) rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...register('email')}
              />
              {errors.email && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'var(--color-accent)',
                    lineHeight: 1.45,
                  }}
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Label htmlFor="password" className="label">
                  PASSWORD
                </Label>
                <Link
                  to="/auth/password-reset"
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: 1,
                  }}
                >
                  Forgot it?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                className="border-0 border-b border-(--color-border) rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                {...register('password')}
              />
              {errors.password && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: 'var(--color-accent)',
                    lineHeight: 1.45,
                  }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full">
              Continue building
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = import.meta.env.VITE_API_URL + '/api/v1/auth/google/login'
              }}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                letterSpacing: '0.04em',
                fontWeight: 500,
                padding: '14px 18px',
                background: 'transparent',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }}>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div
            style={{
              marginTop: 'clamp(12px, 1.8vh, 40px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <span style={{ height: 1, flex: 1, maxWidth: 60, background: 'var(--color-border)' }} />
            <p
              style={{
                margin: 0,
                textAlign: 'center',
                fontSize: 14,
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)',
              }}
            >
              First time here?{' '}
              <Link
                to="/auth/register"
                style={{
                  color: 'var(--color-text-primary)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: 1,
                  marginLeft: 6,
                }}
              >
                Start a log
              </Link>
            </p>
            <span style={{ height: 1, flex: 1, maxWidth: 60, background: 'var(--color-border)' }} />
          </div>
        </section>
      </main>

      <footer
        style={{
          padding: '20px 24px 28px',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textAlign: 'center',
          opacity: 0.7,
        }}
      >
        <span>Cippus</span>
        <span style={{ display: 'inline-block', width: 3, height: 3, borderRadius: '50%', background: 'currentColor', verticalAlign: 'middle', margin: '0 12px' }} />
        <span>A road of makers</span>
      </footer>
    </div>
  )
}