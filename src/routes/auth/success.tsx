import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '#/stores/useAuthStore'

export const Route = createFileRoute('/auth/success')({
  component: AuthSuccess,
})

function AuthSuccess() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    console.log('mounted, search:', window.location.search)
    
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    
    console.log('token:', token)

    if (!token) {
      window.location.replace('http://localhost:3000/auth/login')
      return
    }

    useAuthStore.getState().setToken(token)
    window.location.replace('http://localhost:3000/')
  }, [mounted])
  return <p>Connexion en cours...</p>
}
