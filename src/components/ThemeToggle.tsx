import { useThemeStore } from '#/stores/useThemeStore'

const SunIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)

const MoonIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        background: isDark ? 'var(--color-surface-raised)' : 'transparent',
        cursor: 'pointer',
        padding: 3,
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        transition:
          'background var(--duration-base) var(--ease-base), border-color var(--duration-base) var(--ease-base)',
      }}
    >
      {/* sliding thumb */}
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: isDark
            ? 'var(--color-accent)'
            : 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDark ? '#fff' : 'var(--color-bg)',
          position: 'relative',
          flexShrink: 0,
          /* travel = track(44) - pad(3*2) - thumb(16) = 22px */
          transform: isDark ? 'translateX(22px)' : 'translateX(0)',
          transition:
            'transform var(--duration-base) var(--ease-spring), background var(--duration-base) var(--ease-base)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            display: 'flex',
            opacity: isDark ? 0 : 1,
            transition: 'opacity var(--duration-fast) var(--ease-base)',
          }}
        >
          <SunIcon />
        </span>
        <span
          style={{
            position: 'absolute',
            display: 'flex',
            opacity: isDark ? 1 : 0,
            transition: 'opacity var(--duration-fast) var(--ease-base)',
          }}
        >
          <MoonIcon />
        </span>
      </span>
    </button>
  )
}
