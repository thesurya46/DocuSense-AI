interface PipelineArchitectureProps {
  activeStage?: string | null
}

interface StageBox {
  id: string
  label: string
  sub: string
  variant: 'index' | 'query'
}

const INDEX_STAGES: StageBox[] = [
  { id: 'documents', label: 'Documents', sub: 'PDFs, notes, docs', variant: 'index' },
  { id: 'chunking', label: 'Chunking', sub: 'Split passages', variant: 'index' },
  { id: 'vectordb', label: 'Vector DB', sub: 'Store embeddings', variant: 'index' },
]

const QUERY_STAGES: StageBox[] = [
  { id: 'user_query', label: 'User query', sub: 'Question asked', variant: 'query' },
  { id: 'embed_query', label: 'Embed query', sub: 'Same embedder', variant: 'query' },
  { id: 'retrieve', label: 'Retrieve', sub: 'Top-k chunks', variant: 'query' },
  { id: 'answer', label: 'Answer', sub: 'With citations', variant: 'query' },
]

// Color tokens matching the reference image
const INDEX_BG = '#3b3487'
const INDEX_BG_ACTIVE = '#5046c8'
const INDEX_BORDER = 'rgba(100, 90, 220, 0.55)'
const INDEX_TEXT = '#c4bfff'
const INDEX_SUB = 'rgba(196, 191, 255, 0.55)'

const QUERY_BG = '#1a4a45'
const QUERY_BG_ACTIVE = '#1d6b63'
const QUERY_BORDER = 'rgba(40, 160, 145, 0.55)'
const QUERY_TEXT = '#7ee8dc'
const QUERY_SUB = 'rgba(126, 232, 220, 0.55)'

const ARROW_COLOR = 'rgba(255,255,255,0.22)'
const ACTIVE_ARROW = 'rgba(255,255,255,0.55)'

function Arrow({ active }: { active?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 28,
          height: 1.5,
          background: active ? ACTIVE_ARROW : ARROW_COLOR,
          transition: 'background 0.3s',
        }}
      />
      <svg width="7" height="10" viewBox="0 0 7 10" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M0 1l6 4-6 4"
          stroke={active ? ACTIVE_ARROW : ARROW_COLOR}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  )
}

function VerticalConnector({ active }: { active?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        position: 'absolute',
        right: 0,
        top: '100%',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {/* vertical drop from Vector DB to Retrieve */}
      <svg width="160" height="56" viewBox="0 0 160 56" fill="none" style={{ overflow: 'visible' }}>
        <text x="148" y="24" fontSize="10" fill={active ? ACTIVE_ARROW : ARROW_COLOR} textAnchor="end" fontFamily="var(--font-mono)" letterSpacing="0.02em">
          similarity search
        </text>
        {/* line from right edge of Vector DB down then left to Retrieve */}
        <path
          d="M 158 4 L 158 48 L 2 48"
          stroke={active ? ACTIVE_ARROW : ARROW_COLOR}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={active ? '0' : '4 3'}
          style={{ transition: 'stroke 0.3s' }}
        />
        <path
          d="M 2 44 L -4 48 L 2 52"
          stroke={active ? ACTIVE_ARROW : ARROW_COLOR}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

function Box({ stage, active, pulse }: { stage: StageBox; active?: boolean; pulse?: boolean }) {
  const isIndex = stage.variant === 'index'
  const bg = isIndex ? (active ? INDEX_BG_ACTIVE : INDEX_BG) : (active ? QUERY_BG_ACTIVE : QUERY_BG)
  const border = isIndex ? INDEX_BORDER : QUERY_BORDER
  const textColor = isIndex ? INDEX_TEXT : QUERY_TEXT
  const subColor = isIndex ? INDEX_SUB : QUERY_SUB

  return (
    <div
      style={{
        background: bg,
        border: `1.5px solid ${active ? (isIndex ? 'rgba(130,115,255,0.9)' : 'rgba(60,200,185,0.9)') : border}`,
        borderRadius: 10,
        padding: '14px 20px',
        minWidth: 128,
        textAlign: 'center',
        transition: 'background 0.35s, border-color 0.35s, box-shadow 0.35s',
        boxShadow: active
          ? isIndex
            ? '0 0 18px rgba(100, 90, 220, 0.45)'
            : '0 0 18px rgba(40, 190, 170, 0.45)'
          : 'none',
        position: 'relative',
      }}
    >
      {pulse && active && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isIndex ? '#a89cff' : '#7ee8dc',
            animation: 'pulse-dot 0.7s ease-in-out infinite',
          }}
        />
      )}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: active ? '#fff' : textColor,
          marginBottom: 3,
          letterSpacing: '-0.01em',
          transition: 'color 0.3s',
        }}
      >
        {stage.label}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: active ? (isIndex ? '#c4bfff' : '#7ee8dc') : subColor,
          lineHeight: 1.3,
          transition: 'color 0.3s',
        }}
      >
        {stage.sub}
      </div>
    </div>
  )
}

export default function PipelineArchitecture({ activeStage }: PipelineArchitectureProps) {
  const isQueryActive = (id: string) =>
    activeStage === id ||
    (activeStage === 'embedding' && id === 'embed_query') ||
    (activeStage === 'searching' && id === 'retrieve') ||
    (activeStage === 'filtering' && id === 'retrieve') ||
    (activeStage === 'reranking' && id === 'retrieve') ||
    (activeStage === 'generating' && id === 'answer') ||
    (activeStage === 'done' && id === 'answer')

  const queryFlowActive = !!activeStage && activeStage !== 'idle'

  return (
    <div
      style={{
        background: '#0f1018',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '24px 28px',
        userSelect: 'none',
      }}
    >
      {/* Indexing row */}
      <div style={{ marginBottom: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.04em',
            display: 'block',
            marginBottom: 12,
          }}
        >
          Indexing (offline, done once)
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
          {INDEX_STAGES.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {i > 0 && <Arrow />}
              <Box stage={s} />
            </div>
          ))}

          {/* Connector label from Vector DB down to Retrieve */}
          <div style={{ position: 'relative', marginLeft: 0 }}>
            <VerticalConnector active={queryFlowActive} />
          </div>
        </div>
      </div>

      {/* Gap for the connector arc */}
      <div style={{ height: 64 }} />

      {/* Live query row */}
      <div>
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.04em',
            display: 'block',
            marginBottom: 12,
          }}
        >
          Live query
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {QUERY_STAGES.map((s, i) => {
            const active = isQueryActive(s.id)
            const prevActive =
              i > 0 &&
              (isQueryActive(QUERY_STAGES[i - 1].id) || (queryFlowActive && i <= QUERY_STAGES.findIndex((x) => isQueryActive(x.id))))
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {i > 0 && <Arrow active={prevActive} />}
                <Box stage={s} active={active} pulse />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
