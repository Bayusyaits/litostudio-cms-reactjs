/**
 * SizingForm — "Tabel Ukuran" (size chart) table builder, product wizard's
 * Sizing step. 2026-08-24.
 *
 * Mirrors PricingForm.tsx's controlled values/onChange pattern (lifted into
 * ProductWizardPage.tsx's own state, saved as part of the same autosave/
 * doSave cycle as every other core field) rather than ProductPromotionsCard's
 * self-contained-with-its-own-save pattern — the size guide has no
 * independent backend endpoint of its own to save against (it's stored
 * inside `products.extra`, same jsonb bucket as pre_order/days_to_ship/
 * min_stock_alert), so there's nothing for it to save independently of the
 * rest of the product.
 *
 * "Default vs custom sizing": rather than auto-populating standard sizes
 * from the selected category (would need a second category→apparel-ness
 * classification this schema doesn't have — product_categories has no
 * "is_apparel" flag, and guessing off the category name would silently
 * misfire on any category whose name doesn't match), this offers a manual
 * "Isi ukuran standar" quick-fill the merchant applies when it's actually
 * relevant. Honest scope reduction over a heuristic that could quietly do
 * the wrong thing on categories this wasn't tested against.
 *
 * 2026-08-24 refactor (Shopee-style sizing-matrix bug fixes, user-requested):
 *   1. Max 6 columns / max 10 rows, both hard-enforced (not just UI hints) —
 *      addColumn/addRow/fillStandardSizes all clamp to the ceiling and the
 *      "+" controls disable with an explanatory note once hit, so there's no
 *      path (quick-fill included) that can silently exceed either limit.
 *   2. Auto-init-once: the FIRST time a merchant flips "Show a size chart"
 *      on for a genuinely empty table, one starter column + 5 standard-size
 *      rows (XS/S/M/L/XL) are seeded automatically — a real starting point
 *      instead of a blank table. Tracked via two refs (a "did this toggle
 *      actually flip on" edge detector + a "have we already auto-seeded
 *      once" latch) so this fires exactly once per mount: re-toggling off
 *      and back on in the same editing session, or unchecking after this
 *      already ran, never seeds again — only the explicit "+ Add row"/
 *      "+ Standard sizes"/"+ Add column" controls add anything after that.
 *      Loading an EXISTING product whose size guide already has data (the
 *      normal edit case) never triggers this either — the effect only fires
 *      on an off→on transition, not on mount-already-on.
 *   3. Row/column deletion already worked correctly (removeColumn keys off
 *      each column's stable `col.key`, not array position, so deleting one
 *      column can never corrupt another row's cell). Row deletion, though,
 *      rendered `<tr key={ri}>` off raw array index — a classic React
 *      footgun where deleting a row from the middle can misattribute
 *      in-progress input/focus state to the wrong row during reconciliation.
 *      Fixed with a small stable-id side table (rowIds, a ref parallel to
 *      the `rows` array, never touching the saved row data itself) so each
 *      row keeps its own identity across edits regardless of position.
 */
import { useEffect, useRef, useState } from 'react'

export interface SizeGuideColumn {
  key: string
  label: string
  unit?: string
}

export type SizeGuideRow = Record<string, string>

export interface SizingFormValues {
  hasSizeGuide: boolean
  columns: SizeGuideColumn[]
  rows: SizeGuideRow[]
}

interface SizingFormProps {
  values: SizingFormValues
  onChange: <K extends keyof SizingFormValues>(key: K, value: SizingFormValues[K]) => void
}

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
/** Auto-init seed set — deliberately a SUBSET of STANDARD_SIZES (no XXL/
 *  XXXL): matches the bug report's literal spec ("default sizes XS, S, M,
 *  L, XL"), a smaller, safer starting point a merchant trims or extends
 *  rather than a maximal one they have to prune. */
const AUTO_INIT_SIZES = ['XS', 'S', 'M', 'L', 'XL']

const MAX_COLUMNS = 6
const MAX_ROWS = 10

function slugifyKey(label: string, existing: SizeGuideColumn[]): string {
  const base = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'column'
  let key = base
  let n = 2
  const taken = new Set(existing.map((c) => c.key))
  while (taken.has(key)) {
    key = `${base}_${n}`
    n += 1
  }
  return key
}

export function SizingForm({ values, onChange }: SizingFormProps) {
  const { hasSizeGuide, columns, rows } = values
  const [newColumnLabel, setNewColumnLabel] = useState('')

  // ── Stable per-row identity for React's reconciler (see header comment
  // point 3) — a ref, not state: it's an internal rendering aid, never part
  // of the saved SizeGuideRow data, and mutating it shouldn't trigger a
  // re-render on its own (the `rows` prop change already does that). Grown
  // lazily to match `rows.length` on every render (covers rows added via
  // addRow/fillStandardSizes/auto-init alike, since they all only ever
  // APPEND); `removeRow` below is the one place that shrinks it, and it
  // splices out the SPECIFIC id at the deleted index rather than truncating
  // the end, which is what actually keeps every other row's identity intact
  // across a middle-of-the-list delete.
  const rowIdsRef = useRef<string[]>([])
  const rowIdCounterRef = useRef(0)
  while (rowIdsRef.current.length < rows.length) {
    rowIdCounterRef.current += 1
    rowIdsRef.current.push(`row-${rowIdCounterRef.current}`)
  }
  if (rowIdsRef.current.length > rows.length) {
    // Defensive only — every shrink path in this component (removeRow)
    // already splices the right element out; this just guards against rows
    // ever being replaced wholesale from outside (e.g. switching products).
    rowIdsRef.current.length = rows.length
  }

  // ── Auto-init-once (see header comment point 2) ───────────────────────
  const prevHasSizeGuideRef = useRef(hasSizeGuide)
  const autoInitDoneRef = useRef(false)
  useEffect(() => {
    const turnedOn = !prevHasSizeGuideRef.current && hasSizeGuide
    prevHasSizeGuideRef.current = hasSizeGuide
    if (!turnedOn || autoInitDoneRef.current) return
    // Only seed a genuinely blank table — flipping the checkbox on a
    // product that (unusually) already has columns/rows saved must never
    // clobber them.
    if (columns.length > 0 || rows.length > 0) {
      autoInitDoneRef.current = true
      return
    }
    autoInitDoneRef.current = true
    const sizeColumn: SizeGuideColumn = { key: 'size', label: 'INT', unit: '' }
    onChange('columns', [sizeColumn])
    onChange('rows', AUTO_INIT_SIZES.map((s): SizeGuideRow => ({ size: s })))
    // Keep the row-id side table in lockstep with this direct (non-addRow)
    // append — matches the render-time backfill above, spelled out
    // explicitly here since this effect runs after that backfill already
    // ran for the (empty) pre-seed render.
    for (let i = 0; i < AUTO_INIT_SIZES.length; i += 1) {
      rowIdCounterRef.current += 1
      rowIdsRef.current.push(`row-${rowIdCounterRef.current}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally
    // only re-checking on hasSizeGuide changes; columns/rows are read for
    // the empty-check, not to be reacted to.
  }, [hasSizeGuide])

  const atMaxColumns = columns.length >= MAX_COLUMNS
  const atMaxRows = rows.length >= MAX_ROWS

  function addColumn() {
    if (atMaxColumns) return
    const label = newColumnLabel.trim() || `Column ${columns.length + 1}`
    const key = slugifyKey(label, columns)
    onChange('columns', [...columns, { key, label, unit: '' }])
    onChange('rows', rows.map((r) => ({ ...r, [key]: '' })))
    setNewColumnLabel('')
  }

  function updateColumn(index: number, patch: Partial<SizeGuideColumn>) {
    onChange('columns', columns.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function removeColumn(index: number) {
    const col = columns[index]
    if (!col) return
    onChange('columns', columns.filter((_, i) => i !== index))
    onChange(
      'rows',
      rows.map((r) => {
        const { [col.key]: _dropped, ...rest } = r
        return rest
      }),
    )
  }

  function addRow() {
    if (atMaxRows) return
    const blank: SizeGuideRow = Object.fromEntries(columns.map((c) => [c.key, '']))
    onChange('rows', [...rows, blank])
  }

  function removeRow(index: number) {
    onChange('rows', rows.filter((_, i) => i !== index))
    // Splice the SAME index out of the id side-table — the fix described in
    // the header comment's point 3. Removing anything other than this exact
    // index (e.g. always popping the last id) would silently reassign every
    // row after the deleted one to the wrong stable identity.
    rowIdsRef.current.splice(index, 1)
  }

  function updateCell(rowIndex: number, key: string, value: string) {
    onChange('rows', rows.map((r, i) => (i === rowIndex ? { ...r, [key]: value } : r)))
  }

  // Quick-fill: appends any standard size not already present as a value in
  // the first column (the conventional "size/INT" column). Creates that
  // first column too if the table is currently empty, so this button works
  // as a one-click starting point on a brand-new size guide. Clamped to
  // MAX_ROWS same as every other row-adding path — a table already close to
  // the ceiling gets filled only up to it, not blown past it.
  function fillStandardSizes() {
    const sizeColumn = columns[0] ?? { key: 'size', label: 'INT', unit: '' }
    const nextColumns = columns.length ? columns : [sizeColumn]
    const existingSizes = new Set(rows.map((r) => r[sizeColumn.key]))
    const room = Math.max(0, MAX_ROWS - rows.length)
    const newRows = STANDARD_SIZES
      .filter((s) => !existingSizes.has(s))
      .slice(0, room)
      .map((s) => {
        const blank: SizeGuideRow = Object.fromEntries(nextColumns.map((c) => [c.key, '']))
        blank[sizeColumn.key] = s
        return blank
      })
    if (newRows.length === 0) return
    onChange('columns', nextColumns)
    onChange('rows', [...rows, ...newRows])
  }

  return (
    <div className="cms-card p-5 space-y-4">
      <div>
        <h3 className="font-body text-sm font-semibold text-[var(--text-primary)]">Sizing</h3>
        <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">
          Build a size chart shoppers see on this product's page (Shopee/Shopify-style "Tabel Ukuran").
        </p>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hasSizeGuide}
          onChange={(e) => onChange('hasSizeGuide', e.target.checked)}
        />
        <span className="font-body text-sm">Show a size chart on this product's page</span>
      </label>

      {hasSizeGuide && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fillStandardSizes}
              disabled={atMaxRows}
              className="font-body text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--lito-border)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              + Standard sizes (XS–XXXL)
            </button>
            <input
              type="text"
              value={newColumnLabel}
              onChange={(e) => setNewColumnLabel(e.target.value)}
              placeholder={atMaxColumns ? `Max ${MAX_COLUMNS} columns reached` : 'Measurement name, e.g. Chest Width'}
              disabled={atMaxColumns}
              className="cms-input flex-1 min-w-[180px] disabled:opacity-40 disabled:cursor-not-allowed"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColumn() } }}
            />
            <button
              type="button"
              onClick={addColumn}
              disabled={atMaxColumns}
              className="font-body text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--lito-border)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              + Add column
            </button>
          </div>
          {atMaxColumns && (
            <p className="font-body text-xs text-[var(--text-faint)] -mt-2">
              Maximum of {MAX_COLUMNS} measurement columns reached — remove one to add another.
            </p>
          )}

          {columns.length === 0 ? (
            <p className="font-body text-xs text-[var(--text-faint)]">
              Add at least one column (e.g. "INT" for the size label) to start building the table.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--lito-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-subtle)]">
                    <th className="w-8" />
                    {columns.map((col, i) => (
                      <th key={col.key} className="p-2 min-w-[140px] align-top">
                        <input
                          type="text"
                          value={col.label}
                          onChange={(e) => updateColumn(i, { label: e.target.value })}
                          placeholder="Label"
                          className="cms-input w-full mb-1 text-xs font-semibold"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={col.unit ?? ''}
                            onChange={(e) => updateColumn(i, { unit: e.target.value })}
                            placeholder="unit (cm, kg)"
                            className="cms-input w-full text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeColumn(i)}
                            aria-label={`Remove column ${col.label}`}
                            className="font-body text-xs text-[var(--s-danger)] px-1.5 shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={rowIdsRef.current[ri] ?? `row-fallback-${ri}`} className="border-t border-[var(--lito-border)]">
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(ri)}
                          aria-label={`Remove row ${ri + 1}`}
                          className="font-body text-xs text-[var(--s-danger)] px-1"
                        >
                          ✕
                        </button>
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="p-2">
                          <input
                            type="text"
                            value={row[col.key] ?? ''}
                            onChange={(e) => updateCell(ri, col.key, e.target.value)}
                            className="cms-input w-full text-sm"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-3 text-center font-body text-xs text-[var(--text-faint)]">
                        No rows yet — add one below, or use "Standard sizes" above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {columns.length > 0 && (
            <>
              <button
                type="button"
                onClick={addRow}
                disabled={atMaxRows}
                className="font-body text-xs font-semibold px-3 py-1.5 rounded-md border border-[var(--lito-border)] hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                + Add row
              </button>
              {atMaxRows && (
                <p className="font-body text-xs text-[var(--text-faint)]">
                  Maximum of {MAX_ROWS} size rows reached — remove one to add another.
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
