const s = { fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: 'var(--color-text-primary)', margin: '24px 0 8px', fontWeight: 500 }

export function PrivacyContent() {
    return (
        <>
            <p style={{ margin: '0 0 16px' }}>What you write here is for other builders. Your logs, your photos, your replies are public to anyone who finds the road.</p>
            <h3 style={s}>What we keep</h3>
            <p style={{ margin: '0 0 12px' }}>Your email, the things you post, and the rough shape of how you use the site. We use the shape to surface match moments.</p>
            <h3 style={s}>What we do not do</h3>
            <p style={{ margin: '0 0 12px' }}>We do not sell anything to advertisers. We do not train outside models on your work.</p>
            <h3 style={s}>Leaving</h3>
            <p style={{ margin: '0 0 12px' }}>You can take your logs with you any time. Email stones@cippus.co and we will send you a copy of everything.</p>
            <p style={{ margin: '24px 0 0', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>Last carved - April 2026.</p>
        </>
    )
}
