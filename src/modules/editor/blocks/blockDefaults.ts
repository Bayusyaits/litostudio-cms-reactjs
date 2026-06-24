/**
 * blockDefaults.ts
 *
 * Hydrates a block's defaultData with real site context so blocks inserted
 * from the sidebar show the site's actual name, email, phone, and address
 * instead of generic placeholders like "Your Brand Name".
 *
 * Usage:
 *   const hydrated = hydrateBlockDefaults(item.type, structuredClone(item.defaultData), siteCtx)
 */

export interface BlockSiteContext {
  /** Brand / company name from theme_settings.site_name || activeSite.name */
  name: string
  /** Short description */
  description?: string
  /** Contact email */
  email?: string
  /** Contact phone */
  phone?: string
  /** Physical address */
  address?: string
}

type BlockData = Record<string, unknown>

/**
 * Returns a new defaultData object with site-specific strings substituted.
 * Only fields that have a sensible real-data equivalent are replaced.
 * Structural placeholders (items lists, layout settings) are kept as-is.
 */
export function hydrateBlockDefaults(
  type: string,
  data: BlockData,
  ctx: BlockSiteContext,
): BlockData {
  const d = { ...data }

  switch (type) {
    // ── Hero ──────────────────────────────────────────────────────────────────
    case 'hero': {
      if (ctx.name) d['title'] = `Welcome to ${ctx.name}`
      if (ctx.description) d['subtitle'] = ctx.description
      break
    }

    // ── CTA Band ──────────────────────────────────────────────────────────────
    case 'cta': {
      if (ctx.name) d['title'] = `Ready to work with ${ctx.name}?`
      break
    }

    // ── Contact Form ──────────────────────────────────────────────────────────
    case 'contact_form': {
      if (ctx.email)   d['email']   = ctx.email
      if (ctx.phone)   d['phone']   = ctx.phone
      if (ctx.address) d['address'] = ctx.address
      break
    }

    // ── Team ─────────────────────────────────────────────────────────────────
    case 'team': {
      const members = d['members'] as Array<{ name: string; role?: string }> | undefined
      if (members?.length && ctx.name) {
        // Replace first member name with site/brand name as placeholder founder
        members[0] = { ...members[0], name: ctx.name }
        d['members'] = members
      }
      break
    }

    // ── About (lito template block) ───────────────────────────────────────────
    case 'about': {
      if (ctx.name && (d['heading'] as string | undefined)?.includes('Lito Studio')) {
        d['heading'] = ctx.name
      }
      if (ctx.description) d['description'] = ctx.description
      break
    }

    // ── Newsletter ────────────────────────────────────────────────────────────
    case 'newsletter': {
      if (ctx.name) d['description'] = `Subscribe to updates from ${ctx.name}.`
      break
    }

    // ── Services ─────────────────────────────────────────────────────────────
    case 'services': {
      // heading stays generic ("Our Services") — no site name needed
      break
    }

    default:
      break
  }

  return d
}
