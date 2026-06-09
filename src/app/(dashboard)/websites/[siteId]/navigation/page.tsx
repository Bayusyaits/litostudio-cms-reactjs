'use client'
// apps/cms/src/app/(dashboard)/websites/[siteId]/navigation/page.tsx
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { PageHeader, Button, Input, Label, Card, CardContent, CardHeader, CardTitle, cn } from '@litostudio/ui'
import { api } from '@/lib/api'

interface NavItem { id: string; label: string; url: string; sort_order: number }

function SortableNavItem({ item, onDelete, onUpdate }: {
  item: NavItem; onDelete: (id: string) => void; onUpdate: (id: string, field: keyof NavItem, value: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={cn('flex items-center gap-2 p-3 rounded-lg border border-border bg-card', isDragging && 'shadow-lg')}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none">
        <GripVertical className="h-4 w-4" />
      </button>
      <Input value={item.label} onChange={(e) => onUpdate(item.id, 'label', e.target.value)} placeholder="Label" className="flex-1" />
      <Input value={item.url} onChange={(e) => onUpdate(item.id, 'url', e.target.value)} placeholder="/page or https://…" className="flex-1 font-mono text-xs" />
      <button onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Remove">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function NavigationPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const queryClient = useQueryClient()
  const [items, setItems] = useState<NavItem[]>([])

  const { data } = useQuery({
    queryKey: ['site-navigation', siteId],
    queryFn: () => api.get<{ data: NavItem[] }>(`/api/v1/cms/sites/${siteId}/navigation`),
  })

  const serverItems = data?.data ?? []
  const display = items.length > 0 ? items : serverItems
  const sensors = useSensors(useSensor(PointerSensor))

  const save = useMutation({
    mutationFn: (nav: NavItem[]) => api.put(`/api/v1/cms/sites/${siteId}/navigation`, { items: nav }),
    onSuccess: () => { toast.success('Navigation saved'); queryClient.invalidateQueries({ queryKey: ['site-navigation', siteId] }); setItems([]) },
    onError: () => toast.error('Save failed'),
  })

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = display.findIndex((i) => i.id === active.id)
    const to = display.findIndex((i) => i.id === over.id)
    setItems(arrayMove(display, from, to).map((item, idx) => ({ ...item, sort_order: idx })))
  }

  function addItem() {
    setItems([...display, { id: `new-${Date.now()}`, label: '', url: '/', sort_order: display.length }])
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Navigation" description="Configure your site's main navigation links." />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-sm font-semibold">Main navigation</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 pb-1">
            <div className="w-4" /><span className="flex-1">Label</span><span className="flex-1">URL</span><div className="w-4" />
          </div>
          {display.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No navigation items yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={display.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {display.map((item) => (
                    <SortableNavItem
                      key={item.id} item={item}
                      onDelete={(id) => setItems(display.filter((i) => i.id !== id))}
                      onUpdate={(id, field, value) => setItems(display.map((i) => i.id === id ? { ...i, [field]: value } : i))}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <Button variant="outline" size="sm" className="w-full border-dashed" onClick={addItem}>
            <Plus className="h-4 w-4" /> Add link
          </Button>
        </CardContent>
      </Card>
      <Button onClick={() => save.mutate(display)} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save navigation'}
      </Button>
    </div>
  )
}
