import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/logs/$id')({
  component: () => <Outlet />,
})
