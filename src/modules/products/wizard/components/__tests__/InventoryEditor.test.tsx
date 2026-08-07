import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { InventoryEditor } from '@/modules/products/wizard/components/InventoryEditor'

function renderInventoryEditor(props?: Partial<ComponentProps<typeof InventoryEditor>>) {
  return render(
    <InventoryEditor
      productId="product-123"
      hasVariants={false}
      sortOrder="0"
      onSortOrderChange={vi.fn()}
      quantity="10"
      onQuantityChange={vi.fn()}
      trackStock={true}
      onTrackStockChange={vi.fn()}
      minStock="2"
      onMinStockChange={vi.fn()}
      {...props}
    />,
  )
}

describe('InventoryEditor', () => {
  it('shows save-basic-info helper on first load before product is saved', () => {
    renderInventoryEditor({ productId: null, hasVariants: true })

    expect(
      screen.getByText("Save the product's basic info first, then set its stock here."),
    ).toBeInTheDocument()
    expect(screen.queryByText(/This product has variants/i)).not.toBeInTheDocument()
  })

  it('still renders inventory form for products that already have variants', () => {
    renderInventoryEditor({ productId: 'product-123', hasVariants: true })

    expect(screen.getByText('Inventory')).toBeInTheDocument()
    expect(screen.getByLabelText(/Order/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument()
    expect(screen.getByText(/Variant stock is managed in the Variants step/i)).toBeInTheDocument()
  })

  it('shows required asterisk markers for mandatory stock fields', () => {
    renderInventoryEditor()

    expect(screen.getByText(/Order/i)).toBeInTheDocument()
    expect(screen.getByText(/Quantity/i)).toBeInTheDocument()
    expect(screen.getAllByText('*')).toHaveLength(2)
  })
})
