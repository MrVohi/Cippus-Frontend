import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '#/stores/useAuthStore'
import { generateText } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function getExcerpt(content: string): string {
  try {
    return generateText(JSON.parse(content), [StarterKit]).slice(0, 120).trim()
  } catch {
    return content.slice(0, 120)
  }
}

async function fetchUserPosts(userID: number, token: string) {
  const res = await fetch(
    import.meta.env.VITE_API_URL + '/api/v1/users/' + userID + '/posts',
    { headers: { Authorization: 'Bearer ' + token } }
  )
  if (!res.ok) throw new Error()
  return res.json()
}

function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  const { data, isLoading } = useQuery({
    queryKey: ['user-posts', user?.id],
    queryFn: () => fetchUserPosts(user!.id, token!),
    enabled: !!user && !!token,
  })

  const posts = data?.post ?? []

  if (!user) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center">
        <p className="font-body text-sm italic text-(--color-text-muted)">
          You need to be logged in to view your profile.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      <section className="max-w-[1240px] mx-auto w-full px-4 sm:px-8 lg:px-14 pt-11 pb-9">
        <div className="label text-(--color-text-muted) mb-3">PROFILE</div>
        <h1 className="font-display text-[48px] font-medium tracking-tight m-0 text-(--color-text-primary)">
          @{user.username}
        </h1>
      </section>

      <div className="border-t border-(--color-border)" />

      <main className="max-w-[1240px] w-full mx-auto px-4 sm:px-8 lg:px-14 py-12">
        <div className="label text-(--color-text-muted) mb-6">MY LOGS</div>

        {isLoading ? (
          <p className="font-body text-sm italic text-(--color-text-muted)">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="font-body text-[14px] italic text-(--color-text-placeholder)">
            No logs yet.{' '}
            <Link to="/logs/new" className="text-(--color-text-primary) border-b border-(--color-text-primary)">
              Start one →
            </Link>
          </p>
        ) : (
          <div className="flex flex-col">
            {posts.map((post: any) => (
              <Link
                key={post.post_id}
                to="/logs/$id"
                params={{ id: String(post.post_id) }}
                className="no-underline border-b border-(--color-border) py-5 flex flex-col gap-1 hover:bg-(--color-surface-raised) transition-colors duration-[180ms] px-2"
              >
                <div className="font-display text-[20px] font-medium text-(--color-text-primary)">
                  {post.title}
                </div>
                <p className="font-body text-[13px] italic text-(--color-text-muted) m-0">
                  {getExcerpt(post.content)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
