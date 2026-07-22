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
