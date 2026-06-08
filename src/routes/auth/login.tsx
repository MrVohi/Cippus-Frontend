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
               
                  href="/auth/password-reset"
                <Link
                  to="/auth/password-reset"
                  search={{ token: undefined }}

                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: 1,
                  }}
                >
                  Forgot it?
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
            <span
              style={{
                height: 1,
                flex: 1,
                maxWidth: 60,
                background: 'var(--color-border)',
              }}
            />
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
            <span
              style={{
                height: 1,
                flex: 1,
                maxWidth: 60,
                background: 'var(--color-border)',
              }}
            />
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
        <span
          style={{
            display: 'inline-block',
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: 'currentColor',
            verticalAlign: 'middle',
            margin: '0 12px',
          }}
        />
        <span>A road of makers</span>
      </footer>
    </div>
  )
}
