import { Link } from '@tanstack/react-router'

export interface LogRowProps {
  id: number
  builder: string
  builderInitial: string
  avatarUrl: string | null
  imageUrl?: string | null
  when: string
  title: string
  excerpt: string
  category: string
  daysIn: number
  isStuck?: boolean
  isMatch?: boolean
}

export function LogRow({
  id,
  builder,
  builderInitial,
  avatarUrl,
  imageUrl,
  when,
  title,
  excerpt,
  category,
  daysIn,
  isStuck = false,
  isMatch = false,
}: LogRowProps) {
  return (
    <Link
      to="/logs/$id"
      params={{ id: String(id) }}
      className="relative block px-4 sm:px-8 lg:px-14 py-[26px] bg-(--color-bg) border-b border-(--color-border) no-underline group"
      aria-label={`Open ${title}`}
    >
      <span
        aria-hidden
        className={`absolute left-0 top-[14px] bottom-[14px] w-0.5 bg-(--color-accent) origin-top transition-transform duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${isMatch ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-100'}`}
      />

      <div className="grid items-center gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)]">
        <div className="flex gap-[18px] items-start min-w-0">
          <div className="w-[38px] h-[38px] rounded-full bg-(--color-surface-raised) border border-(--color-border) grid place-items-center font-display text-[17px] font-medium text-(--color-text-muted) shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={builder}
                className="w-full h-full object-cover"
              />
            ) : (
              builderInitial
            )}
          </div>

          <div className="min-w-0 flex-1 flex gap-4 items-start">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-[10px] font-body text-[13px] text-(--color-text-muted) mb-[6px]">
                <span className="text-(--color-text-primary)">{builder}</span>
                <span
                  aria-hidden
                  className="w-[3px] h-[3px] rounded-full bg-(--color-text-placeholder) inline-block self-center"
                />
                <span className="text-(--color-text-placeholder)">{when}</span>
                {isStuck && (
                  <>
                    <span
                      aria-hidden
                      className="w-[3px] h-[3px] rounded-full bg-(--color-accent) inline-block self-center"
                    />
                    <span className="label text-(--color-accent)">STUCK</span>
                  </>
                )}
              </div>

              <h3 className="m-0 font-display text-2xl font-medium tracking-[-0.005em] leading-snug text-(--color-text-primary) group-hover:text-(--color-accent) transition-colors duration-[180ms]">
                {title}
              </h3>

              <p className="mt-2 mb-0 font-body text-[14px] leading-relaxed text-(--color-text-muted) italic line-clamp-2 text-pretty">
                {excerpt}
              </p>
            </div>

            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                aria-hidden
                className="hidden sm:block w-[80px] h-[58px] object-cover border border-(--color-border) shrink-0 mt-0.5"
              />
            )}
          </div>
        </div>

        <div className="hidden lg:block text-center">
          <span className="font-body text-[11px] tracking-[0.22em] uppercase text-(--color-text-muted) font-medium">
            {category}
          </span>
          <span
            aria-hidden
            className="block w-7 h-px mt-2 mx-auto"
            style={{
              background: isMatch
                ? 'var(--color-accent)'
                : 'var(--color-border)',
            }}
          />
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-7">
          <span className="font-body text-[11px] tracking-[0.22em] uppercase text-(--color-text-muted) font-medium lg:hidden">
            {category}
          </span>

          <div className="flex items-center gap-7">
            <div className="text-right">
              <div className="label text-(--color-text-placeholder) text-[10px] mb-1">
                IN
              </div>
              <div className="font-[JetBrains_Mono,ui-monospace,monospace] text-[14px] tracking-[0.02em] text-(--color-text-primary) leading-none">
                {daysIn}d
              </div>
            </div>

            <span
              aria-hidden
              className="hidden lg:block w-px h-9 bg-(--color-border)"
            />

            <div
              aria-hidden
              className="w-8 h-8 rounded-full border border-(--color-border) grid place-items-center text-(--color-text-muted) shrink-0 group-hover:border-(--color-text-secondary) transition-[border-color] duration-[180ms]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 6 L15 12 L9 18" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
