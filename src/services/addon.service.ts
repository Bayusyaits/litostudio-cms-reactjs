import { http } from '@/lib/request'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Addon {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  tier: 'free' | 'pro' | 'enterprise'
  icon: string | null
  sort_order: number
  settings_schema: Record<string, unknown> | null
  default_config: Record<string, unknown> | null
}

export interface AddonSetting {
  key: string
  value: unknown
  updated_at?: string
}

export interface OrgAddon {
  id: string
  enabled: boolean
  site_id: string | null
  installed_at: string
  updated_at: string
  addons: Pick<Addon, 'id' | 'slug' | 'name' | 'description' | 'category' | 'tier' | 'icon' | 'sort_order' | 'default_config' | 'settings_schema'>
  addon_settings: AddonSetting[]
}

export interface InstallAddonPayload {
  addon_slug: string
  site_id?: string
  settings?: Record<string, unknown>
}

export interface UpdateAddonPayload {
  enabled?: boolean
  settings?: Record<string, unknown>
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const addonService = {
  /** List all available add-ons in the platform catalog */
  async listCatalog(): Promise<Addon[]> {
    const data = await http.get<{ success: boolean; data: Addon[] }>('/api/v1/cms/addons')
    return data.data ?? []
  },

  /** Get all add-ons for an org with enabled state + settings */
  async listOrgAddons(orgId: string): Promise<OrgAddon[]> {
    const data = await http.get<{ success: boolean; data: OrgAddon[] }>(
      `/api/v1/cms/organizations/${orgId}/addons`,
    )
    return data.data ?? []
  },

  /** Install (enable) an add-on for an organization */
  async install(orgId: string, payload: InstallAddonPayload): Promise<void> {
    await http.post(`/api/v1/cms/organizations/${orgId}/addons`, payload)
  },

  /** Toggle enabled state or update settings for an installed add-on */
  async update(orgId: string, orgAddonId: string, payload: UpdateAddonPayload): Promise<void> {
    await http.patch(`/api/v1/cms/organizations/${orgId}/addons/${orgAddonId}`, payload)
  },

  /** Uninstall (disable) an add-on — settings preserved */
  async uninstall(orgId: string, orgAddonId: string): Promise<void> {
    await http.delete(`/api/v1/cms/organizations/${orgId}/addons/${orgAddonId}`)
  },

  /** Get all settings for a specific installed add-on */
  async getSettings(orgId: string, orgAddonId: string): Promise<AddonSetting[]> {
    const data = await http.get<{ success: boolean; data: AddonSetting[] }>(
      `/api/v1/cms/organizations/${orgId}/addons/${orgAddonId}/settings`,
    )
    return data.data ?? []
  },
}
