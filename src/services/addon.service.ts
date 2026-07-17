import { http } from '@litostudio/ui-cms'

// ─── Types ────────────────────────────────────────────────────────────────────

// Addon settings bug fix (2026-07-15, addon-settings-compatibility-plan):
// `addons.settings_schema` is real JSON Schema in the DB — always
// `{"type":"object","properties":{...}}` for every seeded add-on with any
// configurable settings (confirmed against every row in
// migrations/020_addons_navigation_language.sql). This type existing at
// all is the fix for the root enabler of the "Objects are not valid as a
// React child" crash: the old `Record<string, unknown> | null` typing let
// AddonsPageView.tsx cast the whole schema object to a flat
// key→{type,label,default} map and iterate its own top-level keys
// (producing a bogus `["properties", {...}]` entry) without a compile-time
// error catching the wrong shape.
export interface JSONSchemaProperty {
  type: string
  title?: string
  description?: string
  default?: unknown
  enum?: unknown[]
  placeholder?: string
}

export interface AddonSettingsSchema {
  type: 'object'
  properties: Record<string, JSONSchemaProperty>
}

export interface Addon {
  id: string
  slug: string
  name: string
  description: string | null
  category: string
  tier: 'free' | 'pro' | 'enterprise'
  icon: string | null
  sort_order: number
  // Empty schema is seeded as '{}' (no `type`/`properties`) for add-ons
  // with no configurable settings — hence the 3-way union rather than
  // requiring AddonSettingsSchema unconditionally.
  settings_schema: AddonSettingsSchema | Record<string, never> | null
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

/** One addon_compatibility row with both sides' slugs resolved server-side
 * (2026-07-15, addon-settings-compatibility-plan) — lets the catalog card
 * show a proactive "Conflicts with X" badge. */
export interface AddonCompatibilityRule {
  id: string
  relation_type: 'conflicts' | 'requires'
  condition_key: string | null
  condition_value: unknown
  addon_slug: string | null
  related_addon_slug: string | null
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

  /**
   * Install (enable) an add-on for an organization.
   * Returns `warnings` (2026-07-15, addon-settings-compatibility-plan) — a
   * non-blocking heads-up (e.g. two enabled add-ons both defaulting their
   * `position` setting to the same value) distinct from the hard
   * conflicts/requires rejection, which throws (409) instead of returning.
   */
  async install(orgId: string, payload: InstallAddonPayload): Promise<{ warnings: string[] }> {
    const data = await http.post<{ success: boolean; data: { warnings?: string[] } }>(
      `/api/v1/cms/organizations/${orgId}/addons`, payload,
    )
    return { warnings: data.data?.warnings ?? [] }
  },

  /** Toggle enabled state or update settings for an installed add-on. See `install` for `warnings`. */
  async update(orgId: string, orgAddonId: string, payload: UpdateAddonPayload): Promise<{ warnings: string[] }> {
    const data = await http.patch<{ success: boolean; data: { warnings?: string[] } | null }>(
      `/api/v1/cms/organizations/${orgId}/addons/${orgAddonId}`, payload,
    )
    return { warnings: data.data?.warnings ?? [] }
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

  /** List all addon_compatibility rules (platform-wide, not org-scoped) */
  async listCompatibility(): Promise<AddonCompatibilityRule[]> {
    const data = await http.get<{ success: boolean; data: AddonCompatibilityRule[] }>('/api/v1/cms/addons/compatibility')
    return data.data ?? []
  },
}
