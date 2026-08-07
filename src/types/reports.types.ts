// apps/cms/src/types/reports.types.ts
// Shared shape for every report endpoint added 2026-07-26 (Products + Orders
// modules — see order-reports.routes.ts / product-reports.routes.ts on the
// backend). One generic type so ReportViewer (components/organisms) can
// render any of them without a per-report component.
export interface ReportColumn {
  key: string
  label: string
}

export interface ReportResult {
  columns: ReportColumn[]
  rows: Array<Record<string, unknown>>
  summary?: Record<string, unknown>
}
