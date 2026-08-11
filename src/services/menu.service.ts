import { http } from '@litostudio/ui-cms'

// GET /api/v1/cms/sites/:siteId/menu — server-resolved (role + org add-ons +
// site feature flags + org plan already applied), so the CMS sidebar only
// ever renders what this endpoint returns. See apps/backend/src/modules/
// cms-menu/interface/cms-menu.routes.ts for the visibility rule itself.
export interface MenuNode {
  id: string
  slug: string
  label: string
  icon: string
  path: string
  // 2026-08-10 (MARKETING-PRICING-PLAN.md, user-confirmed via AskUserQuestion
  // — "Show locked with 🔒 + upsell tooltip"): addon/plan-gated items are no
  // longer omitted by the backend — they're returned locked, with a reason,
  // so AppSidebar can render them dimmed instead of hiding them outright.
  locked: boolean
  lockReason: string | null
  children: MenuNode[]
}

export const menuService = {
  async getTree(siteId: string): Promise<MenuNode[]> {
    const data = await http.get<{ success: boolean; data: MenuNode[] }>(
      `/api/v1/cms/sites/${siteId}/menu`,
    )
    return data.data ?? []
  },
}
