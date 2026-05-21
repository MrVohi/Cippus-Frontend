type CippusMarkProps = { size?: number }

export function CippusMark({ size = 96 }: CippusMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="4 52 182 312"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="Cippus mark"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <path
        d="M60 320 L42 190 L47 110 L153 110 L158 190 L140 320 Z"
        fill="var(--shadow-stone)"
      />
      <path
        d="M47 110 Q100 98 153 110"
        stroke="var(--shadow-stone)"
        strokeWidth="2"
        fill="none"
      />

      <line
        x1="28"
        y1="352"
        x2="78"
        y2="268"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="78"
        y1="268"
        x2="90"
        y2="188"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="90"
        y1="188"
        x2="136"
        y2="152"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="136"
        y1="152"
        x2="174"
        y2="72"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="90"
        y1="188"
        x2="14"
        y2="172"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="136"
        y1="152"
        x2="112"
        y2="62"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="78"
        y1="268"
        x2="158"
        y2="314"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <circle cx="28" cy="352" r="3.5" fill="var(--color-accent)" />
      <circle cx="78" cy="268" r="5.5" fill="var(--color-accent)" />
      <circle cx="90" cy="188" r="7" fill="var(--color-accent)" />
      <circle cx="136" cy="152" r="5" fill="var(--color-accent)" />
      <circle cx="174" cy="72" r="3.5" fill="var(--color-accent)" />
      <circle cx="14" cy="172" r="4" fill="var(--color-accent)" />
      <circle cx="112" cy="62" r="3.5" fill="var(--color-accent)" />
      <circle cx="158" cy="314" r="3.5" fill="var(--color-accent)" />
    </svg>
  )
}

export function CippusLogoHorizontal({ height = 20 }: { height?: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: height * 0.4,
      }}
    >
      <CippusMark size={height * 1.4} />
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: height,
          letterSpacing: '0.02em',
          color: 'var(--color-text-primary)',
          lineHeight: 1,
        }}
      >
        Cippus
      </span>
    </div>
  )
}
