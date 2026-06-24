# Lito Studio — Product Analytics (PostHog)

Auto-generated from `.telemetry/tracking-plan.yaml` v1 — 2026-06-21

## Install

```bash
# Backend
cd apps/backend && npm install posthog-node

# CMS
cd apps/cms && npm install posthog-js
```

## Environment Variables

**Backend `.env`:**
```
POSTHOG_API_KEY=phc_xxxxxxxx
POSTHOG_HOST=https://eu.i.posthog.com
```

**CMS `.env`:**
```
VITE_POSTHOG_API_KEY=phc_xxxxxxxx
VITE_POSTHOG_HOST=https://eu.i.posthog.com
# Set this to enable PostHog in dev:
# VITE_ANALYTICS_DEBUG=true
```

Use **separate PostHog projects** for dev/staging vs production.

## Architecture

- **Backend events** (signup, login, org creation): `apps/backend/src/core/observability/analytics.ts`
- **CMS events** (all other events): `apps/cms/src/tracking/` via `useTracking()` hook
- **Provider**: `AnalyticsProvider` wraps the entire CMS app (already wired in `App.tsx`)
- **Identity**: `useAnalyticsIdentify()` — call once in your root authenticated layout

## Usage in CMS Components

```typescript
import { useTracking } from '@/tracking'

function ThemesPageContainer() {
  const { trackTemplateSelected } = useTracking()
  const site = useWebsiteStore(s => s.activeSite)
  const org  = useWebsiteStore(s => s.org)

  const applyTheme = useMutation({
    mutationFn: ...,
    onSuccess: (_, themeId) => {
      trackTemplateSelected({
        site_id: site.id,
        org_id: org.id,
        template_slug: theme.template_slug,
        is_initial_selection: !site.template_slug,
        previous_template_slug: site.template_slug ?? undefined,
      })
    },
  })
}
```

## Where Each Event Goes

| Event | File | Hook Point |
|-------|------|-----------|
| `user.signed_up` | `apps/backend/.../auth.email.routes.ts` | After `supabaseAnon.auth.signUp()` success, line ~117 |
| `user.logged_in` | `apps/backend/.../auth.email.routes.ts` | After `supabaseAnon.auth.signInWithPassword()` success, ~line 247 |
| `org.created` | `apps/backend/.../organization.routes.ts` | After org + member rows inserted, ~line 120 |
| `site.created` | `apps/cms/.../OnboardingPage.tsx` or site creation flow | In mutation `onSuccess` |
| `template.selected` | `apps/cms/.../ThemesPageContainer.tsx` | In `applyThemeMutation.onSuccess`, after line 67 |
| `page.created` | `apps/cms/.../PagesNewPageContainer.tsx` | In `createPageMutation.onSuccess`, line 56 |
| `editor.session_ended` | `apps/cms/.../BlockEditorPage.tsx` | `useEffect` cleanup (component unmount) |
| `page.published` | `apps/cms/.../BlockEditorPage.tsx` | After `pagesService.update(pageId, { status: 'active' })` in `publishFn`, ~line 373 |
| `site.published` | site deploy action | In deploy mutation `onSuccess` |
| `member.invited` | org member invite form | In invite mutation `onSuccess` |
| `domain.connected` | `apps/cms/.../DomainsPageContainer.tsx` | In `addDomainMutation.onSuccess`, line 48 |
| `analytics_scripts.configured` | CMS analytics settings | In settings save mutation `onSuccess` |
| `content.created` | CMS content modules (products, blog, etc.) | In each content create mutation `onSuccess` |

## Regenerating After Plan Changes

When the tracking plan changes (new event or property added):
1. Run `/product-tracking-skills:product-tracking-instrument-new-feature`
2. It will update `.telemetry/tracking-plan.yaml`
3. Then re-run `/product-tracking-skills:product-tracking-implement-tracking` to update this module

## Verification

1. Start dev server with `VITE_ANALYTICS_DEBUG=true`
2. Open browser console — PostHog will log every event
3. Or check PostHog dashboard → Activity → Live Events (1-2s delay)

## North Star Event

`site.published` with `is_first_publish: true` is the primary value action. If this event count drops to zero, investigate immediately.
