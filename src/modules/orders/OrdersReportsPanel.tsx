// apps/cms/src/modules/orders/OrdersReportsPanel.tsx
//
// Reports tab embedded directly in the existing Orders CMS page (2026-07-26
// instruction: reports live inside each module's own page, not as a new
// top-level menu item — see OrdersPageView.tsx's tab wiring). Self-contained
// (owns its own react-query fetch + filter state) so it can be dropped into
// OrdersPageView without threading state through OrdersPageContainer.
//
// Five reports, matching order-reports.routes.ts on the backend exactly —
// see that file's header comment for which are [SIAP] vs out of scope.
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { Button, FormField, Select, useWebsiteStore, useToast, getErrorMessage } from '@litostudio/ui-cms'
import { ordersService } from '@/services/content.service'
import type { ReportResult } from '@/types/reports.types'

type ReportId = 'sales' | 'payments' | 'returns' | 'discounts' | 'warehouse'

const REPORT_OPTIONS: { value: ReportId; label: string }[] = [
  { value: 'sales', label: 'Penjualan (Harian/Bulanan)' },
  { value: 'payments', label: 'Rekonsiliasi Pembayaran' },
  { value: 'returns', label: 'Retur & Refund' },
  { value: 'discounts', label: 'Diskon & Promosi' },
  { value: 'warehouse', label: 'Gudang (Kemas/Kirim & Manifest)' },
]

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') return new Intl.NumberFormat('id-ID').format(value)
  return String(value)
}

function ReportTable({ data, isLoading }: { data?: ReportResult; isLoading: boolean }) {
  if (isLoading) {
    return <div className="cms-card p-8 text-center font-body text-sm text-[var(--text-muted)]">Memuat laporan…</div>
  }
  if (!data || data.rows.length === 0) {
    return <div className="cms-card p-8 text-center font-body text-sm text-[var(--text-muted)]">Tidak ada data untuk filter ini.</div>
  }

  return (
    <div className="cms-card overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--lito-border)]">
            {data.columns.map(c => (
              <th key={c.key} className="font-body text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)] px-3 py-2 whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className="border-b border-[rgba(217,210,199,0.3)] last:border-0">
              {data.columns.map(c => (
                <td key={c.key} className="font-body text-sm text-[var(--text-primary)] px-3 py-2 whitespace-nowrap">
                  {formatCell(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.summary && Object.keys(data.summary).length > 0 && (
        <div className="px-3 py-3 border-t border-[var(--lito-border)] flex gap-6 flex-wrap">
          {Object.entries(data.summary).map(([label, value]) => (
            <div key={label}>
              <div className="font-body text-[11px] text-[var(--text-muted)]">{label}</div>
              <div className="font-body text-sm font-medium text-[var(--text-primary)]">{String(value)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function OrdersReportsPanel() {
  const { activeSite } = useWebsiteStore()
  const toast = useToast()
  const [reportId, setReportId] = useState<ReportId>('sales')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day')
  const [warehouseView, setWarehouseView] = useState<'packing' | 'manifest'>('packing')
  const [downloading, setDownloading] = useState(false)

  const params = useMemo(() => {
    const p: Record<string, string> = {}
    if (activeSite?.id) p.site_id = activeSite.id
    if (fromDate) p.from_date = fromDate
    if (toDate) p.to_date = toDate
    if (reportId === 'sales') p.group_by = groupBy
    if (reportId === 'warehouse') p.view = warehouseView
    return p
  }, [activeSite?.id, fromDate, toDate, reportId, groupBy, warehouseView])

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders-report', reportId, params],
    queryFn: () => ordersService.getReport(reportId, params),
    enabled: !!activeSite,
    staleTime: 60 * 1000,
  })

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await ordersService.downloadReport(reportId, params, `laporan-orders-${reportId}.xlsx`)
    }
    catch (err) {
      toast.show({ message: 'Gagal mengunduh laporan', description: getErrorMessage(err), variant: 'error' })
    }
    finally {
      setDownloading(false)
    }
  }

  const showDateFilter = reportId !== 'warehouse'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          className="w-64"
          value={reportId}
          onChange={(v) => setReportId(v as ReportId)}
          options={REPORT_OPTIONS}
        />
        {reportId === 'sales' && (
          <Select
            className="w-36"
            value={groupBy}
            onChange={(v) => setGroupBy(v as 'day' | 'month')}
            options={[{ value: 'day', label: 'Per Hari' }, { value: 'month', label: 'Per Bulan' }]}
          />
        )}
        {reportId === 'warehouse' && (
          <Select
            className="w-56"
            value={warehouseView}
            onChange={(v) => setWarehouseView(v as 'packing' | 'manifest')}
            options={[{ value: 'packing', label: 'Daftar Kemas/Kirim' }, { value: 'manifest', label: 'Manifest Pengiriman' }]}
          />
        )}
        {showDateFilter && (
          <>
            <FormField label="Dari" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            <FormField label="Sampai" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </>
        )}
        <Button
          skin="cms" variant="secondary" size="sm"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={handleDownload} loading={downloading} disabled={!activeSite}
        >
          Unduh Excel
        </Button>
      </div>

      {error && <p className="font-body text-sm text-[var(--s-danger)]">Gagal memuat laporan.</p>}

      <ReportTable data={data} isLoading={isLoading} />
    </div>
  )
}
