import { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '#/stores/useAuthStore'

export function getContext() {
  const queryClient = new QueryClient()

  const getAuth = () => useAuthStore.getState()

  return {
    queryClient,
    getAuth,
  }
}
export default function TanstackQueryProvider() {}
