/**
 * PortfolioSection — visual replica of website PortfolioSection.vue
 * Dark (#131313) background, editorial grid layout:
 *   Desktop: 1 large primary card + 2 smaller cards side-by-side
 * Matches data-cms-section-type="portfolio" (was "gallery" before the naming fix).
 */

import type { Block } from '@/types/editor.types'
import type { PortfolioBlockData } from '@/types/editor.types'

const MOCK_ITEMS = [
  {
    id: '1',
    title: 'Wedding at Ubud',
    category: 'Wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    description: 'Intimate ceremony in the heart of Bali.',
  },
  {
    id: '2',
    title: 'Family Portrait',
    category: 'Portrait',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',
    description: 'Timeless family memories.',
  },
  {
    id: '3',
    title: 'Corporate Event',
    category: 'Commercial',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
    description: 'Annual conference photography.',
  },
]

export function PortfolioSection({ block }: { block: Block }) {
  const d = block.data as PortfolioBlockData
  const heading = d.heading ?? 'My Work'
  const items = d.items?.length
    ? d.items.map((it, i) => ({ id: String(i), ...it, image: it.image ?? '' }))
    : MOCK_ITEMS

  const [primary, ...rest] = items

  const headingLines = heading.includes('\n') ? heading.split('\n') : [heading, '']

  return (
    <section className="py-[80px] lg:py-[128px] bg-[#131313] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-[80px]">

        {/* Header */}
        <div className="flex items-end justify-between mb-[48px] gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-body text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--lito-gold,#D4A853)]">03</span>
              <span className="w-8 h-px bg-[var(--lito-gold,#D4A853)] opacity-50" />
              <span className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-[rgba(255,255,255,0.4)]">Selected Works</span>
            </div>
            <h2 className="font-display text-[clamp(40px,5vw,60px)] font-light leading-none tracking-[-0.02em] text-white m-0">
              {headingLines[0]}
              {headingLines[1] && <><br /><em>{headingLines[1]}</em></>}
            </h2>
          </div>
          <a href="#" onClick={e => e.preventDefault()} className="hidden lg:flex items-center gap-2 font-body text-sm text-[rgba(255,255,255,0.5)] no-underline">
            Lihat Semua →
          </a>
        </div>

        {/* Editorial grid: 1 primary large + rest side-by-side */}
        <div className="grid [grid-template-columns:5fr_3fr_3fr] gap-5">

          {/* Primary card */}
          {primary && (
            <div className="relative overflow-hidden rounded-sm group cursor-pointer min-h-[560px]">
              {primary.image ? (
                <img
                  src={primary.image}
                  alt={primary.title}
                  className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full min-h-[560px] bg-[#1e1e1e] flex items-center justify-center">
                  <span className="font-body text-xs text-[rgba(255,255,255,0.3)]">No image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                <p className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--lito-gold,#D4A853)] mb-2">{primary.category}</p>
                <h3 className="font-display text-[28px] font-normal text-white leading-[1.1]">{primary.title}</h3>
                {primary.description && (
                  <p className="font-body text-[13px] text-[rgba(255,255,255,0.6)] mt-2">{primary.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Secondary cards column */}
          <div className="col-span-2 grid grid-rows-2 gap-5">
            {rest.slice(0, 2).map(item => (
              <div key={item.id} className="relative overflow-hidden rounded-sm group cursor-pointer">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="w-full h-[220px] bg-[#1e1e1e] flex items-center justify-center">
                    <span className="font-body text-xs text-[rgba(255,255,255,0.3)]">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <p className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--lito-gold,#D4A853)] mb-1">{item.category}</p>
                  <h3 className="font-display text-[20px] font-normal text-white leading-[1.1]">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* More items below (if any) */}
        {items.length > 3 && (
          <div className={`mt-5 grid gap-5 ${d.columns === 4 ? 'grid-cols-4' : d.columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {items.slice(3).map(item => (
              <div key={item.id} className="relative overflow-hidden rounded-sm group cursor-pointer aspect-[3/4]">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover block" />
                ) : (
                  <div className="w-full h-full bg-[#1e1e1e]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7)_0%,transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="font-body text-[10px] font-semibold tracking-[0.15em] uppercase text-[var(--lito-gold,#D4A853)] mb-1">{item.category}</p>
                  <h3 className="font-display text-[18px] font-normal text-white leading-[1.1]">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
