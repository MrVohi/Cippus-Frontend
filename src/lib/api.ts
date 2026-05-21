import { useAuthStore } from '#/stores/useAuthStore'

export async function fetchWithAuth(url: string, options: RequestInit) {
  const token = useAuthStore.getState().token
  const BASE_URL = import.meta.env.VITE_API_URL

  const response = await fetch(BASE_URL + url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: 'Bearer ' + token,
    },
  })

  if (response.status != 401) {
    return response
  }

  const refreshResponse = await fetch(BASE_URL + '/api/v1/auth/refresh', {
    method: 'POST',
  })

  if (!refreshResponse.ok) {
    useAuthStore.getState().logout()
    throw Error('Expired session.')
  }

  const newToken = (await refreshResponse.json()).accessToken
  useAuthStore.getState().setToken(newToken)

  return await fetch(BASE_URL + url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: 'Bearer ' + newToken,
    },
  })
}
