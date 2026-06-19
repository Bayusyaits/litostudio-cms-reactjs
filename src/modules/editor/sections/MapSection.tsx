/**
 * MapSection — visual canvas renderer for the Lito Studio map / location section.
 *
 * Mirrors website MapSection.vue:
 *  - Section header: eyebrow + title + subtitle (Cormorant Garamond)
 *  - Location cards row: icon · city · description (gold accent)
 *  - Map embed area (iframe src from block data, or placeholder)
 *  - Lito cream/ink/gold palette via CSS variables
 */

import type { Block, MapBlockData } from '@/types/editor.types'
import { useEditorStore } from '@/stores/editor.store'
import { MapPin } from 'lucide-react'

const DEFAULT_LOCATIONS = [
  { city: 'Jakarta', description: 'Ibu kota & pusat komersial' },
  { city: 'Yogyakarta', description: 'Budaya & warisan tradisional' },
  { city: 'Jawa Tengah', description: 'Komunitas lokal & alam' },
]

export function MapSection({ block }: { block: Block }) {
  const d = block.data as MapBlockData & Record<string, unknown>
  const { selectedBlockId } = useEditorStore()
  const isSelected = selectedBlockId === block.id

  const eyebrow   = (d.eyebrow   as string | undefined) ?? 'Lokasi Kami'
  const title     = (d.title     as string | undefined) ?? 'Hadir di Berbagai\nPenjuru Nusantara'
  const subtitle  = (d.subtitle  as string | undefined) ?? 'Kami melayani sesi foto dan video di berbagai kota di Indonesia, dengan spesialisasi di Jakarta, Yogyakarta, dan Jawa Tengah.'
  const locations = (d.locations as typeof DEFAULT_LOCATIONS | undefined) ?? DEFAULT_LOCATIONS
  const mapSrc    = d.src ?? ''
  const mapHeight = d.height ?? 400

  const titleLines = title.split('\n')

  return (
    <section
      style={{
        padding: '100px 0 0',
        background: 'var(--cms-card-bg, var(--lito-cream, #F7F4EE))',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 80px 60px' }}>

        {/* Header */}
        <div style={{ maxWidth: 640, marginBottom: 56 }}>
          <span style={{
            display: 'block',
            fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--lito-gold, #D4A853)',
            marginBottom: 16,
          }}>
            {eyebrow}
          </span>

          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(36px, 4vw, 52px)',
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            color: 'var(--lito-ink, #111111)',
            margin: 0,
            marginBottom: 20,
          }}>
            {titleLines.map((line, i) =>
              i === 1
                ? <><br key={i} /><em key={`em-${i}`} style={{ fontStyle: 'italic' }}>{line}</em></>
                : <span key={i}>{line}</span>
            )}
          </h2>

          <p style={{
            fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
            fontSize: 15,
            lineHeight: 1.65,
            color: 'rgba(17,17,17,0.6)',
            margin: 0,
          }}>
            {subtitle}
          </p>
        </div>

        {/* Location cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${locations.length}, 1fr)`,
          gap: 24,
          marginBottom: 48,
        }}>
          {locations.map((loc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '20px 24px',
                background: 'rgba(17,17,17,0.04)',
                borderRadius: 2,
                borderLeft: '2px solid var(--lito-gold, #D4A853)',
              }}
            >
              <MapPin
                size={16}
                style={{
                  color: 'var(--lito-gold, #D4A853)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div>
                <div style={{
                  fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--lito-ink, #111111)',
                  marginBottom: 4,
                }}>
                  {loc.city}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'rgba(17,17,17,0.55)',
                }}>
                  {loc.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map embed — full width, flush to section bottom */}
      <div style={{ position: 'relative', width: '100%' }}>
        {mapSrc ? (
          <iframe
            src={mapSrc}
            width="100%"
            height={mapHeight}
            loading="lazy"
            style={{ display: 'block', border: 0, filter: 'grayscale(20%)' }}
            title="Lokasi Lito Studio"
          />
        ) : (
          <div
            style={{
              height: mapHeight,
              background: 'rgba(17,17,17,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              borderTop: '1px solid rgba(17,17,17,0.08)',
            }}
          >
            <MapPin
              size={28}
              style={{ color: 'var(--lito-gold, #D4A853)', opacity: 0.6 }}
            />
            <p style={{
              fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)',
              fontSize: 13,
              color: 'rgba(17,17,17,0.4)',
              margin: 0,
            }}>
              {isSelected
                ? 'Tambahkan Google Maps embed URL di sidebar kanan'
                : 'Embed peta belum dikonfigurasi'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
