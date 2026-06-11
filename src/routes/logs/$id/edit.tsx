import {
  createFileRoute,
  redirect,
  Link,
  useNavigate,
} from '@tanstack/react-router'
import StarterKit from '@tiptap/starter-kit'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { useEditor, EditorContent } from '@tiptap/react'
import { useQuery } from '@tanstack/react-query'
import { useState, useRef, useCallback, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { fetchWithAuth } from '#/lib/api'
import { useAuthStore } from '#/stores/useAuthStore'

export const Route = createFileRoute('/logs/$id/edit')({
  beforeLoad: () => {
    const user = useAuthStore.getState().user
    if (user == null) {
      throw redirect({ to: '/auth/login' })
    }
  },
  component: RouteComponent,
})

const schema = z.object({
  title: z.string().min(3, 'Please enter a title'),
  content: z.string().min(10, 'Cannot post an empty log'),
  categoryIds: z
    .array(z.number())
    .min(1, 'Please select at least one category'),
  imageFile: z.custom<File | null>(
    (v) => v === null || (typeof File !== 'undefined' && v instanceof File),
  ),
  stuck: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type Category = { category_id: number; name: string }

async function fetchCategories(): Promise<Category[]> {
  const url = import.meta.env.VITE_API_URL + '/api/v1/categories'
  const res = await fetch(url)
  if (!res.ok) throw new Error()
  const data = await res.json()
  return Array.isArray(data.category) ? data.category : []
}

const TOOLBAR_BUTTONS = [
  {
    label: 'B',
    title: 'Bold',
    style: { fontWeight: 600 },
    action: (e: ReturnType<typeof useEditor>) =>
      e.chain().focus().toggleBold().run(),
    isActive: (e: ReturnType<typeof useEditor>) => e.isActive('bold'),
  },
  {
    label: 'I',
    title: 'Italic',
    style: { fontStyle: 'italic' as const },
    action: (e: ReturnType<typeof useEditor>) =>
      e.chain().focus().toggleItalic().run(),
    isActive: (e: ReturnType<typeof useEditor>) => e.isActive('italic'),
  },
  {
    label: 'H2',
    title: 'Heading',
    style: { fontWeight: 500 },
    action: (e: ReturnType<typeof useEditor>) =>
      e.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e: ReturnType<typeof useEditor>) =>
      e.isActive('heading', { level: 2 }),
  },
  {
    label: '≡',
    title: 'List',
    style: {},
    action: (e: ReturnType<typeof useEditor>) =>
      e.chain().focus().toggleBulletList().run(),
    isActive: (e: ReturnType<typeof useEditor>) => e.isActive('bulletList'),
  },
] as const

async function fetchPost(id: string) {
  const url = import.meta.env.VITE_API_URL + '/api/v1/logs/' + id
  const response = await fetch(url)
  if (!response.ok) throw new Error()
  return response.json()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function RouteComponent() {
  const id = Route.useParams().id
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formInitialized = useRef(false)
  const editorInitialized = useRef(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

  const { data: categoriesData = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
  const categories = categoriesData

  const post = data?.post

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      content: '',
      categoryIds: [],
      imageFile: null,
      stuck: false,
    },
  })

  const {
    formState: { errors, isSubmitting },
    watch,
  } = form
  const watchedTitle = watch('title')
  const watchedCategoryIds = watch('categoryIds')
  const watchedStuck = watch('stuck')

  const editor = useEditor({
    editable: true,
    extensions: [StarterKit],
    onUpdate: ({ editor: ed }) => {
      form.setValue('content', JSON.stringify(ed.getJSON()), {
        shouldValidate: true,
      })
    },
  })

  useEffect(() => {
    if (!post || formInitialized.current) return
    form.reset({
      title: post.title,
      content: post.content,
      categoryIds: post.categories.map((c: Category) => c.category_id),
      imageFile: null,
      stuck: post.stuck ?? false,
    })
    setExistingImageUrl(post.image_url ?? null)
    formInitialized.current = true
  }, [post])

  useEffect(() => {
    if (!post || editorInitialized.current) return
    editor.commands.setContent(JSON.parse(post.content))
    editorInitialized.current = true
  }, [editor, post])

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null
      form.setValue('imageFile', file)
      if (file) {
        setImagePreview(URL.createObjectURL(file))
        setExistingImageUrl(null)
      } else {
        setImagePreview(null)
      }
    },
    [form],
  )

  const removeImage = useCallback(() => {
    form.setValue('imageFile', null)
    setImagePreview(null)
    setExistingImageUrl(null)
    setImageRemoved(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [form])

  const toggleCategory = useCallback(
    (catId: number) => {
      const current = form.getValues('categoryIds')
      const next = current.includes(catId)
        ? current.filter((c) => c !== catId)
        : [...current, catId]
      form.setValue('categoryIds', next, { shouldValidate: true })
    },
    [form],
  )

  const handleAiImprove = useCallback(async () => {
    const text = editor.getText()
    if (!text.trim()) return
    setAiLoading(true)
    setAiSuggestion(null)
    try {
      const res = await fetchWithAuth('/api/v1/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setAiSuggestion(json.improved ?? json.text ?? '')
    } catch {
      setAiSuggestion(null)
    } finally {
      setAiLoading(false)
    }
  }, [editor])

  const applyAiSuggestion = useCallback(() => {
    if (!aiSuggestion) return
    editor.commands.setContent(aiSuggestion)
    form.setValue('content', aiSuggestion, { shouldValidate: true })
    setAiSuggestion(null)
  }, [aiSuggestion, editor, form])

  async function onSubmit(values: FormValues) {
    flushSync(() => setUploading(true))
    setSubmitError(null)
    const fd = new FormData()
    fd.append('title', values.title)
    fd.append('content', values.content)
    values.categoryIds.forEach((catId) =>
      fd.append('category_ids', String(catId)),
    )
    if (values.imageFile) fd.append('image', values.imageFile)
    if (imageRemoved) fd.append('remove_image', 'true')
    fd.append('stuck', String(values.stuck))

    try {
      const res = await fetchWithAuth('/api/v1/logs/' + id, {
        method: 'PATCH',
        body: fd,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSubmitError(err.error ?? 'Something went wrong.')
        setUploading(false)
        return
      }
      const json = await res.json()
      navigate({
        to: '/logs/$id',
        params: { id: String(json.post?.post_id ?? json.id) },
      })
    } catch {
      setSubmitError('Could not reach the server. Try again.')
      setUploading(false)
    }
  }

  const previewText = editor.getText().slice(0, 180)
  const selectedCategoryNames = categories
    .filter((c) => watchedCategoryIds.includes(c.category_id))
    .map((c) => c.name)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center">
        <p className="font-body text-sm italic text-(--color-text-muted)">
          Loading…
        </p>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center">
        <p className="font-body text-sm italic text-(--color-text-muted)">
          Something went wrong. Try again later.
        </p>
      </div>
    )
  }

  if (user?.id !== post.author_id) {
    navigate({ to: '/logs/$id', params: { id } })
    return null
  }

  const activeImage = imagePreview ?? existingImageUrl

  return (
    <div className="min-h-screen flex flex-col bg-(--color-bg)">
      {uploading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'color-mix(in oklab, var(--color-bg) 88%, transparent)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                animation: 'cip-live 1.2s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.005em',
              }}
            >
              Saving changes…
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
              margin: 0,
            }}
          >
            Regenerating embedding and running moderation check.
          </p>
        </div>
      )}
      <div
        className="row-enter max-w-[1240px] mx-auto w-full px-4 sm:px-8 lg:px-14 pt-10 pb-8"
        style={{ animationDelay: '0ms' }}
      >
        <Link
          to="/logs/$id"
          params={{ id }}
          className="inline-flex items-center gap-2 font-body text-[12px] tracking-[0.16em] uppercase text-(--color-text-muted) no-underline mb-6 hover:text-(--color-text-primary) transition-colors duration-[180ms]"
        >
          <span aria-hidden>←</span>
          Back to log
        </Link>
        <h1 className="font-display text-[48px] sm:text-[64px] font-medium tracking-[-0.012em] leading-none m-0 text-(--color-text-primary)">
          Edit log
        </h1>
        <p className="font-body text-[15px] italic text-(--color-text-muted) mt-3 mb-0">
          Last updated {formatDate(post.updated_at)}
        </p>
      </div>

      <div
        className="row-enter border-t border-(--color-border)"
        style={{ animationDelay: '60ms' }}
      />

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="row-enter flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 lg:px-14 py-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10 lg:gap-16 items-start"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex flex-col gap-7 min-w-0">
          <div>
            <input
              type="text"
              placeholder="What are you building?"
              {...form.register('title')}
              className="w-full bg-transparent border-0 border-b border-(--color-border) font-display text-[32px] sm:text-[40px] font-medium tracking-[-0.01em] text-(--color-text-primary) placeholder:text-(--color-text-placeholder) focus:outline-none focus:border-(--color-accent) pb-2 transition-colors duration-[180ms]"
            />
            {errors.title && (
              <p className="font-body text-[12px] text-(--color-accent) mt-1.5 mb-0">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-0">
            <div className="border border-(--color-border)">
              <div className="flex items-center gap-1 px-3 py-2 border-b border-(--color-border)">
                {TOOLBAR_BUTTONS.map(
                  ({ label, title, style, action, isActive }) => (
                    <button
                      key={label}
                      type="button"
                      title={title}
                      onClick={() => action(editor)}
                      className="font-body text-[13px] px-2.5 py-1 border-none bg-transparent cursor-pointer transition-colors duration-[150ms] rounded-[var(--radius-sm)]"
                      style={{
                        color: isActive(editor)
                          ? 'var(--color-accent)'
                          : 'var(--color-text-muted)',
                        background: isActive(editor)
                          ? 'var(--color-accent-subtle)'
                          : 'transparent',
                        ...style,
                      }}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>

              <div
                className="prose-cippus min-h-[280px] px-4 py-3 cursor-text"
                onClick={() => editor.commands.focus()}
              >
                <EditorContent editor={editor} />
              </div>
            </div>

            {errors.content && (
              <p className="font-body text-[12px] text-(--color-accent) mt-1.5 mb-0">
                {errors.content.message}
              </p>
            )}
          </div>

          {aiSuggestion && (
            <div
              className="border border-(--color-accent) p-5 flex flex-col gap-4"
              style={{
                background: 'var(--color-accent-subtle)',
                animation:
                  'row-enter var(--duration-base) var(--ease-out) both',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full bg-(--color-accent) shrink-0"
                  style={{ animation: 'cip-live 2.4s ease-in-out infinite' }}
                />
                <span className="label text-(--color-accent) tracking-[0.18em]">
                  AI SUGGESTION
                </span>
              </div>
              <p className="font-body text-[15px] leading-relaxed text-(--color-text-primary) m-0 whitespace-pre-wrap">
                {aiSuggestion}
              </p>
              <div className="flex items-center gap-5 pt-1">
                <button
                  type="button"
                  onClick={applyAiSuggestion}
                  className="font-body text-[13px] text-(--color-accent) border-0 border-b border-(--color-accent) pb-px bg-transparent cursor-pointer tracking-[0.02em] hover:opacity-75 transition-opacity duration-[180ms]"
                >
                  Use this →
                </button>
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  className="font-body text-[13px] text-(--color-text-muted) bg-transparent border-none cursor-pointer tracking-[0.02em] hover:text-(--color-text-primary) transition-colors duration-[180ms]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAiImprove}
              disabled={aiLoading}
              className="inline-flex items-center gap-2.5 font-body text-[13px] tracking-[0.02em] text-(--color-text-muted) bg-transparent border border-(--color-border) px-4 py-2.5 cursor-pointer hover:text-(--color-text-primary) hover:border-(--color-text-secondary) transition-colors duration-[180ms] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {aiLoading ? (
                <>
                  <span
                    aria-hidden
                    className="w-1.5 h-1.5 rounded-full bg-(--color-accent)"
                    style={{ animation: 'cip-live 1.2s ease-in-out infinite' }}
                  />
                  Improving…
                </>
              ) : (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                  </svg>
                  Improve with AI
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
          <div>
            <div className="label text-(--color-text-muted) mb-2.5">
              PREVIEW
            </div>
            <div className="border border-(--color-border) p-5 flex flex-col gap-3 min-h-[160px]">
              {watchedTitle ? (
                <h3 className="font-display text-[22px] font-medium tracking-[-0.005em] leading-snug text-(--color-text-primary) m-0 text-pretty">
                  {watchedTitle}
                </h3>
              ) : (
                <h3 className="font-display text-[22px] font-medium tracking-[-0.005em] leading-snug text-(--color-text-placeholder) m-0 italic">
                  Your title
                </h3>
              )}

              {previewText ? (
                <p className="font-body text-[14px] italic leading-relaxed text-(--color-text-muted) m-0 line-clamp-4">
                  {previewText}
                  {previewText.length >= 180 ? '…' : ''}
                </p>
              ) : (
                <p className="font-body text-[13px] italic text-(--color-text-placeholder) m-0">
                  Your log will appear here as you write.
                </p>
              )}

              {selectedCategoryNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCategoryNames.map((name) => (
                    <span
                      key={name}
                      className="font-body text-[11px] tracking-[0.1em] uppercase text-(--color-text-muted) border border-(--color-border) px-2 py-0.5"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}

              {activeImage && (
                <div className="relative mt-1 border border-(--color-border) overflow-hidden">
                  <img
                    src={activeImage}
                    alt="Upload preview"
                    className="w-full h-[100px] object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="label text-(--color-text-muted) mb-2.5">STATUS</div>
            <button
              type="button"
              onClick={() =>
                form.setValue('stuck', !watchedStuck, {
                  shouldValidate: true,
                })
              }
              className="w-full font-body text-[13px] tracking-[0.04em] px-4 py-2.5 border cursor-pointer transition-colors duration-[180ms]"
              style={{
                color: watchedStuck
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
                borderColor: watchedStuck
                  ? 'var(--color-accent)'
                  : 'var(--color-border)',
                background: watchedStuck
                  ? 'var(--color-accent-subtle)'
                  : 'transparent',
                textAlign: 'left',
              }}
            >
              {watchedStuck ? '● Stuck on this' : '○ Building fine'}
            </button>
            <p className="font-body text-[12px] italic text-(--color-text-placeholder) mt-2 mb-0">
              {watchedStuck
                ? 'Matches will be surfaced to help you unblock.'
                : 'Toggle if you hit a wall and want help finding matches.'}
            </p>
          </div>

          <div>
            <div className="label text-(--color-text-muted) mb-2.5">
              CATEGORIES
            </div>
            {categories.length === 0 ? (
              <p className="font-body text-[13px] italic text-(--color-text-placeholder)">
                Loading…
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-0 gap-y-0 border border-(--color-border)">
                {categories.map((cat, i) => {
                  const active = watchedCategoryIds.includes(cat.category_id)
                  return (
                    <button
                      key={cat.category_id}
                      type="button"
                      onClick={() => toggleCategory(cat.category_id)}
                      className={[
                        'font-body text-[12px] tracking-[0.1em] uppercase px-3 py-2 border-0 cursor-pointer transition-colors duration-[180ms]',
                        i % 2 === 0 ? 'border-r border-r-(--color-border)' : '',
                        i < categories.length - 2
                          ? 'border-b border-b-(--color-border)'
                          : '',
                      ].join(' ')}
                      style={{
                        color: active
                          ? 'var(--color-accent)'
                          : 'var(--color-text-muted)',
                        background: active
                          ? 'var(--color-accent-subtle)'
                          : 'transparent',
                        width: '50%',
                      }}
                    >
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            )}
            {errors.categoryIds && (
              <p className="font-body text-[12px] text-(--color-accent) mt-1.5 mb-0">
                {errors.categoryIds.message}
              </p>
            )}
          </div>

          <div>
            <div className="label text-(--color-text-muted) mb-2.5">IMAGE</div>

            {activeImage ? (
              <div className="flex flex-col gap-2">
                <div className="relative border border-(--color-border) overflow-hidden">
                  <img
                    src={activeImage}
                    alt="Log image"
                    className="w-full h-[140px] object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="font-body text-[12px] tracking-[0.04em] text-(--color-text-muted) bg-transparent border-none cursor-pointer self-start hover:text-(--color-accent) transition-colors duration-[180ms] p-0"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-between border border-(--color-border) border-dashed px-4 py-3 cursor-pointer hover:border-(--color-text-muted) transition-colors duration-[180ms] group">
                <span className="font-body text-[13px] italic text-(--color-text-muted) group-hover:text-(--color-text-primary) transition-colors duration-[180ms]">
                  Choose file
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="text-(--color-text-muted) group-hover:text-(--color-text-primary) transition-colors duration-[180ms]"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {submitError && (
              <p className="font-body text-[12px] text-(--color-accent) m-0">
                {submitError}
              </p>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-body text-[14px] tracking-[0.02em] text-(--color-text-on-accent) bg-(--color-accent) border-none px-5 py-3.5 cursor-pointer hover:bg-(--color-accent-hover) transition-colors duration-[180ms] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>

            <Link
              to="/logs/$id"
              params={{ id }}
              className="font-body text-[13px] text-center text-(--color-text-muted) no-underline hover:text-(--color-text-primary) transition-colors duration-[180ms]"
            >
              Cancel
            </Link>
          </div>
        </aside>
      </form>
    </div>
  )
}
