import { Link } from '@tanstack/react-router'

export interface LogRowProps {
  id: number
  builder: string
  builderInitial: string
  avatarUrl: string | null
  when: string
  title: string
  excerpt: string
  category: string
  isStuck?: boolean
  isMatch?: boolean
}

export function LogRow({
  id,
  builder,
  builderInitial,
  avatarUrl,
  when,
  title,
  excerpt,
  category,
  isStuck = false,
  isMatch = false,
}: LogRowProps) {
  return (
    <article className="relative px-4 sm:px-8 lg:px-14 py-5 lg:py-[26px] bg-(--color-bg) border-b border-(--color-border) grid items-center gap-4 lg:gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)]">
      {isMatch && (
        <span
          aria-hidden
          className="absolute left-0 top-[14px] bottom-[14px] w-0.5 bg-(--color-accent)"
        />
      )}

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

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-[10px] font-body text-[13px] text-(--color-text-muted) mb-[6px]">
            <span className="text-(--color-text-primary)">{builder}</span>
            <span
              aria-hidden
              className="w-[3px] h-[3px] rounded-full bg-(--color-text-placeholder) inline-block self-center"
            />
            <span className="text-(--color-text-placeholder)">{when}</span>
          </div>

          <h3 className="m-0 font-display text-xl lg:text-2xl font-medium tracking-tight leading-snug text-(--color-text-primary)">
            {title}
          </h3>

          <p className="mt-2 mb-0 font-body text-sm leading-normal text-(--color-text-muted) italic line-clamp-2 text-pretty">
            {excerpt}
          </p>
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
            background: isMatch ? 'var(--color-accent)' : 'var(--color-border)',
          }}
        />
      </div>

      <div className="flex items-center justify-between lg:justify-end gap-4 lg:gap-7">
        <span className="font-body text-[11px] tracking-[0.22em] uppercase text-(--color-text-muted) font-medium lg:hidden">
          {category}
        </span>

        <div className="flex items-center gap-4 lg:gap-7">
          {isStuck && (
            <span className="label text-(--color-accent) border border-(--color-accent) rounded-full px-2 py-0.5">
              STUCK
            </span>
          )}

          <Link
            to="/logs/$id"
            params={{ id: String(id) }}
            aria-label={`Open ${title}`}
            className="w-8 h-8 rounded-full border border-(--color-border) grid place-items-center text-(--color-text-muted) no-underline shrink-0 hover:border-(--color-text-secondary) transition-[border-color] duration-[180ms]"
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
          </Link>
        </div>
      </div>
    </article>
  )
}
