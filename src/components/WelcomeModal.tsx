interface WelcomeModalProps {
  onDismiss: () => void
  onNavigate: (page: 'documents' | 'settings') => void
}

const STEPS = [
  {
    num: '01',
    title: 'Configure your API key',
    body: 'Add your OpenAI API key in Settings. Your key is never stored on external servers.',
    action: 'Open Settings',
    page: 'settings' as const,
    color: 'var(--color-purple)',
    colorDim: 'var(--color-purple-dim)',
  },
  {
    num: '02',
    title: 'Upload your documents',
    body: 'Drag and drop PDFs, DOCX, TXT, or Markdown files. The system chunks, embeds, and indexes them automatically.',
    action: 'Upload Documents',
    page: 'documents' as const,
    color: 'var(--color-cyan)',
    colorDim: 'var(--color-cyan-dim)',
  },
  {
    num: '03',
    title: 'Ask grounded questions',
    body: 'Every answer includes [Source N] citations mapped to exact passages. Click any citation to verify the evidence.',
    action: null,
    page: null,
    color: 'var(--color-success)',
    colorDim: 'var(--color-success-dim)',
  },
]

export default function WelcomeModal({ onDismiss, onNavigate }: WelcomeModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', zIndex: 400 }}
        onClick={onDismiss}
      />

      {/* Modal */}
      <div
        className="animate-scale-in"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: 560,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-float)',
          zIndex: 410,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '28px 28px 0',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--color-cyan-dim)',
              border: '1px solid var(--color-cyan)33',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="2" width="8" height="8" rx="2" stroke="var(--color-cyan)" strokeWidth="1.6" />
              <rect x="12" y="2" width="8" height="8" rx="2" stroke="var(--color-cyan)" strokeWidth="1.6" />
              <rect x="2" y="12" width="8" height="8" rx="2" stroke="var(--color-cyan)" strokeWidth="1.6" />
              <circle cx="16" cy="16" r="4" stroke="var(--color-cyan)" strokeWidth="1.6" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>
            Welcome to RAG Intel
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', lineHeight: 1.6, margin: 0 }}>
            A production-ready Retrieval-Augmented Generation system. Every answer is grounded in your documents — never hallucinated.
          </p>
        </div>

        {/* Steps */}
        <div style={{ padding: '24px 28px' }}>
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              style={{
                display: 'flex',
                gap: 16,
                marginBottom: i < STEPS.length - 1 ? 20 : 0,
                position: 'relative',
              }}
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 19,
                    top: 40,
                    width: 1.5,
                    height: 28,
                    background: 'var(--color-border-strong)',
                  }}
                />
              )}

              {/* Step number */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: step.colorDim,
                  border: `1px solid ${step.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: step.color,
                  flexShrink: 0,
                }}
              >
                {step.num}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 3 }}>
                  {step.title}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-3)', lineHeight: 1.55 }}>{step.body}</div>
                {step.action && step.page && (
                  <button
                    onClick={() => { onNavigate(step.page!); onDismiss() }}
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: step.color,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    {step.action} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 11.5, color: 'var(--color-text-3)' }}>
            5 demo documents pre-loaded · Try the suggested questions in Chat
          </div>
          <button
            onClick={onDismiss}
            style={{
              padding: '9px 20px',
              borderRadius: 7,
              border: 'none',
              background: 'var(--color-cyan)',
              color: '#070809',
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
            }}
          >
            Get started
          </button>
        </div>
      </div>
    </>
  )
}
