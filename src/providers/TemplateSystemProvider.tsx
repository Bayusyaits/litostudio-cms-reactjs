/**
 * TemplateSystemProvider
 *
 * Wraps the four template-system contexts in one place:
 *   TemplateContext   — active template + its TemplateDefinition
 *   VariantContext    — getBlockVariant(template, blockType)
 *   PageTypeContext   — pages allowed in the active template
 *   ContractContext   — getBlockFields(blockType)
 *
 * Place this inside QueryProvider + WebsiteStoreProvider, above the editor shell.
 * All contexts read the active template from useWebsiteStore — no extra prop drilling.
 */

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'

import { useWebsiteStore } from '@litostudio/ui-cms'
import {
  getTemplateDefinition,
  getBlockVariant,
  getBlockFields,
  ALLOWED_TEMPLATES,
  type TemplateName,
  type TemplateDefinition,
  type FieldSchema,
  type PageDefinition,
} from '@litostudio/template-system'

// ── TemplateContext ────────────────────────────────────────────────────────────

interface TemplateContextValue {
  /** Current template name; null if no site active or invalid slug */
  template:   TemplateName | null
  /** Full TemplateDefinition; null if template is null */
  definition: TemplateDefinition | null
}

const TemplateCtx = createContext<TemplateContextValue>({
  template:   null,
  definition: null,
})

// ── VariantContext ─────────────────────────────────────────────────────────────

interface VariantContextValue {
  /** Returns the variant string for a block type in the current template */
  getVariant: (blockType: string) => string
}

const VariantCtx = createContext<VariantContextValue>({
  getVariant: () => 'default',
})

// ── PageTypeContext ────────────────────────────────────────────────────────────

interface PageTypeContextValue {
  /** Pages allowed by the current template */
  allowedPages: PageDefinition[]
}

const PageTypeCtx = createContext<PageTypeContextValue>({ allowedPages: [] })

// ── ContractContext ────────────────────────────────────────────────────────────

interface ContractContextValue {
  /** Returns the FieldSchema[] for a block type (for DynamicField inspector) */
  getFields: (blockType: string) => FieldSchema[]
}

const ContractCtx = createContext<ContractContextValue>({
  getFields: () => [],
})

// ── Provider ──────────────────────────────────────────────────────────────────

interface TemplateSystemProviderProps {
  children: ReactNode
}

export function TemplateSystemProvider({ children }: TemplateSystemProviderProps) {
  const activeSite = useWebsiteStore((s) => s.activeSite)

  const template = useMemo<TemplateName | null>(() => {
    const slug = (activeSite?.settings as Record<string, unknown> | undefined)?.template_slug
    if (!slug || typeof slug !== 'string') return null
    return (ALLOWED_TEMPLATES as readonly string[]).includes(slug)
      ? (slug as TemplateName)
      : null
  }, [activeSite])

  const definition = useMemo<TemplateDefinition | null>(() => {
    if (!template) return null
    return getTemplateDefinition(template)
  }, [template])

  const templateValue = useMemo<TemplateContextValue>(
    () => ({ template, definition }),
    [template, definition],
  )

  const variantValue = useMemo<VariantContextValue>(
    () => ({
      getVariant: (blockType: string) =>
        template ? getBlockVariant(template, blockType) : 'default',
    }),
    [template],
  )

  const pageTypeValue = useMemo<PageTypeContextValue>(
    () => ({ allowedPages: definition?.pages ?? [] }),
    [definition],
  )

  const contractValue = useMemo<ContractContextValue>(
    () => ({ getFields: getBlockFields }),
    [],
  )

  return (
    <TemplateCtx.Provider value={templateValue}>
      <VariantCtx.Provider value={variantValue}>
        <PageTypeCtx.Provider value={pageTypeValue}>
          <ContractCtx.Provider value={contractValue}>
            {children}
          </ContractCtx.Provider>
        </PageTypeCtx.Provider>
      </VariantCtx.Provider>
    </TemplateCtx.Provider>
  )
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Returns the active template name + full TemplateDefinition */
// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider/context; splitting would require updating every import site for no runtime benefit
export function useTemplateSystem(): TemplateContextValue {
  return useContext(TemplateCtx)
}

/** Returns `getVariant(blockType)` bound to the active template */
// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider/context; splitting would require updating every import site for no runtime benefit
export function useVariantContext(): VariantContextValue {
  return useContext(VariantCtx)
}

/** Returns the pages allowed in the active template */
// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider/context; splitting would require updating every import site for no runtime benefit
export function usePageTypeContext(): PageTypeContextValue {
  return useContext(PageTypeCtx)
}

/** Returns `getFields(blockType)` for DynamicField inspector rendering */
// eslint-disable-next-line react-refresh/only-export-components -- hook belongs with its provider/context; splitting would require updating every import site for no runtime benefit
export function useContractContext(): ContractContextValue {
  return useContext(ContractCtx)
}
