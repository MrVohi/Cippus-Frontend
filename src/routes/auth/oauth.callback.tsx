import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { z } from 'zod'
import { useAuthStore } from '#/stores/useAuthStore'

export const Route = createFileRoute('/auth/oauth/callback')({
  validateSearch: z.object({ token: z.string().optional() }),
  component: OAuthCallbackPage,
})

function OAuthCallbackPage() {
  const { token } = Route.useSearch()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate({ to: '/auth/login' })
      return
    }

    async function finalize(tok: string) {
      try {
        useAuthStore.getState().setToken(tok)
        const res = await fetch(
          import.meta.env.VITE_API_URL + '/api/v1/users/me',
          {
            headers: { Authorization: `Bearer ${tok}` },
            credentials: 'include',
          },
        )
        const body = await res.json()
        useAuthStore.getState().setUser(body.user)
        navigate({ to: '/' })
      } catch {
        navigate({ to: '/auth/login' })
      }
    }

    finalize(token)
  }, [token, navigate])

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '2px solid var(--color-border)',
          borderTopColor: 'var(--color-accent)',
          display: 'inline-block',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--color-text-muted)',
          margin: 0,
        }}
      >
        Stepping onto the road…
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
