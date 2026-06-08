self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Cippus', {
      body: data.body ?? '',
      icon: '/favicon.ico',
    }),
  )
})
