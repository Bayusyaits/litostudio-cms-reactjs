/**
 * AboutSection — visual replica of website AboutSection.vue
 * 2-col: image left with floating "since" card, text right with stats.
 *
 * Description field is richtext (CKEditor HTML). Rendered via dangerouslySetInnerHTML
 * so bold/italic display correctly without showing raw tags.
 */

import type { Block } from '@/types/editor.types'
import type { TextBlockData } from '@/types/editor.types'

// Scoped styles for the richtext description area
const richtextStyle = `
  .about-description p  { margin: 0 0 0.75em; }
  .about-description p:last-child { margin-bottom: 0; }
  .about-description strong, .about-description b { font-weight: 600; }
  .about-description em, .about-description i { font-style: italic; }
`

const MOCK_STATS = [
  { value: '200+', label: 'Sessions' },
  { value: '8+', label: 'Years' },
  { value: '15+', label: 'Cities' },
]

export function AboutSection({ block }: { block: Block }) {
  const d = block.data as TextBlockData & Record<string, unknown>

  // Helper: return value only if non-empty string, else undefined
  const opt = (v: unknown): string | undefined => {
    const s = v as string | undefined
    return s && s.trim() !== '' ? s : undefined
  }

  // Core fields — title always falls back to a default; all others are optional
  const title    = opt(d.heading) ?? opt(d.title) ?? 'Tentang\nKami'
  const subtitle = opt(d.description) ?? opt(d.subtitle)
  const ctaLabel = opt(d.ctaText)
  const ctaUrl   = opt(d.ctaUrl)
  const image    = opt(d.image)

  // Floating card — optional
  const since  = opt(d.since)
  const cities = opt(d.cities)
  const showSinceCard = !!(since || cities)

  // Stats — prefer individual manifest fields; fall back to legacy stats array.
  // A stat is shown only when it has a non-empty value.
  const legacyStats = (d.stats as typeof MOCK_STATS | undefined) ?? []
  const stats = [
    { value: opt(d.sessionsValue) ?? opt(legacyStats[0]?.value), label: opt(d.sessionsLabel) ?? opt(legacyStats[0]?.label) },
    { value: opt(d.yearsValue)    ?? opt(legacyStats[1]?.value), label: opt(d.yearsLabel)    ?? opt(legacyStats[1]?.label) },
    { value: opt(d.citiesCount)   ?? opt(legacyStats[2]?.value), label: opt(d.citiesLabel)   ?? opt(legacyStats[2]?.label) },
  ].filter(s => s.value)   // hide any stat with no value
  const showStats = stats.length > 0

  const titleLines = title.split('\n')
  // Use 2-col layout only when there is an image; otherwise single-col
  const gridCols = image ? '1fr 1fr' : '1fr'

  return (
    <section style={{ padding: '120px 0', background: 'var(--cms-card-bg, var(--lito-cream, #F7F4EE))', overflow: 'hidden' }}>
      <style>{richtextStyle}</style>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 80, alignItems: 'center' }}>

          {/* Left: image + floating card — only when image is set */}
          {image && (
            <div style={{ position: 'relative' }}>
              <div style={{ aspectRatio: '3/4', overflow: 'hidden', borderRadius: 2, maxWidth: 460 }}>
                <img src={image} alt="About" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Floating "since" card — only when since or cities is set */}
              {showSinceCard && (
                <div style={{
                  position: 'absolute', bottom: -24, right: -32,
                  background: 'var(--cms-card-bg, #F7F4EE)',
                  border: '1px solid var(--lito-border, #D9D2C7)',
                  padding: 20, width: 176, borderRadius: 2,
                  boxShadow: '0 12px 40px rgba(17,17,17,0.12)',
                }}>
                  {since && (
                    <>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted, #9E9E9E)', marginBottom: 4 }}>Since</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 300, lineHeight: 1, color: 'var(--text-primary, #111)', marginBottom: cities ? 8 : 0 }}>{since}</p>
                    </>
                  )}
                  {cities && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted, #9E9E9E)', lineHeight: 1.5 }}>{cities}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right: text + stats */}
          <div>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--lito-gold, #D4A853)' }}>02</span>
              <span style={{ width: 32, height: 1, background: 'var(--lito-gold, #D4A853)', opacity: 0.5 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted, #9E9E9E)' }}>Our Story</span>
            </div>

            {/* Heading */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,4vw,56px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text-primary, #111111)', marginBottom: subtitle ? 32 : 40 }}>
              {titleLines[0]}
              {titleLines[1] && <><br /><em>{titleLines[1]}</em></>}
            </h2>

            {/* Description — only when set */}
            {subtitle && (
              <div
                className="about-description"
                dangerouslySetInnerHTML={{ __html: subtitle }}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75,
                  color: 'var(--text-muted, #6B6560)', marginBottom: 40,
                }}
              />
            )}

            {/* Stats row — only when at least one stat has a value */}
            {showStats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
                gap: 24, marginBottom: 40, paddingBottom: 40,
                borderBottom: '1px solid var(--lito-border, #D9D2C7)',
              }}>
                {stats.map((s, i) => (
                  <div key={i}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--text-primary, #111)', marginBottom: 4 }}>{s.value}</p>
                    {s.label && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted, #9E9E9E)' }}>{s.label}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CTA — only when label or url is set */}
            {(ctaLabel || ctaUrl) && (
              <a
                href={ctaUrl ?? '#'}
                onClick={e => e.preventDefault()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary, #111)', textDecoration: 'none' }}
              >
                {ctaLabel ?? ctaUrl} →
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
