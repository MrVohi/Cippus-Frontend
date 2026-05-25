const s = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: 'var(--color-text-primary)',
  margin: '24px 0 8px',
  fontWeight: 500,
}

export function TermsContent() {
  return (
    <>
      <p style={{ margin: '0 0 16px' }}>
        Cippus is a forum for documenting work in progress. Use it like a
        workshop you share with strangers: leave it tidier than you found it.
      </p>
      <h3 style={s}>What you bring</h3>
      <p style={{ margin: '0 0 12px' }}>
        Work that is yours. Words you are willing to stand behind. Help, when
        you have it.
      </p>
      <h3 style={s}>What stays out</h3>
      <p style={{ margin: '0 0 12px' }}>
        Selling, scraping, harassing, impersonating, anything illegal. Logs that
        exist only to advertise.
      </p>
      <h3 style={s}>What we can do</h3>
      <p style={{ margin: '0 0 12px' }}>
        Take down posts that break the above. Close accounts that keep doing it.
        Change these terms - we will tell you when we do.
      </p>
      <p
        style={{
          margin: '24px 0 0',
          fontStyle: 'italic',
          color: 'var(--color-text-muted)',
        }}
      >
        Placeholder - final version pending.
      </p>
    </>
  )
}
