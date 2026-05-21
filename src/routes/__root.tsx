import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { AuthStore } from '#/stores/useAuthStore'
import { useAuthStore } from '#/stores/useAuthStore'
import { useEffect } from 'react'

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

function RootDocument({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)

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

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen flex flex-col">
        <nav className="flex justify-between items-center px-6 py-1 bg-(--color-nav-bg) border-b border-(--color-nav-border)">
          <div className="flex items-center gap-4">
            <Link className="flex items-center gap-4" to="/">
              <p>logo</p>
              <p className="font-display font-semibold">Cippus</p>
            </Link>
            <div className="text-(--color-text-muted) flex gap-8 ml-5">
              <Link to="/">Home</Link>
              <Link to="/logs">Logs</Link>
              <span>Profile</span>
              <Link to="/search">Search</Link>
            </div>
          </div>

          {user ? (
            <div>
              <span>avatar</span>
              <Link to="/logs/new"> · START LOG</Link>
              <Link to="/messages"> · NEW MESSAGE</Link>
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
        {children}
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
        <Scripts />
      </body>
    </html>
  )
}
