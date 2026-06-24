/**
 * sanitizeHtml — client-side HTML sanitizer for the CMS editor (React).
 *
 * Uses DOMParser to walk the DOM and keep only allowlisted tags/attributes.
 * Safe to call in server contexts (returns plain text via regex strip when
 * DOMParser is unavailable — e.g. SSR or Jest with jsdom not configured).
 *
 * ALLOWED_TAGS: covers standard rich-text formatting only.
 * Never allow: script, style, iframe, object, embed, form, input, link, meta.
 */

const ALLOWED_TAGS = new Set([
  'b', 'i', 'em', 'strong', 'mark', 'br', 'span',
  'p', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'code', 'pre',
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*':  new Set(['class']),
  'a':  new Set(['href', 'target', 'rel', 'class']),
  'img': new Set(['src', 'alt', 'width', 'height', 'class']),
}

/** Allowed `href` URL schemes (block javascript: / data: URIs). */
const ALLOWED_HREF_SCHEMES = /^(https?:\/\/|mailto:|tel:|\/|#)/i

function getAllowedAttrs(tag: string): Set<string> {
  return new Set([
    ...(ALLOWED_ATTRS['*'] ?? []),
    ...(ALLOWED_ATTRS[tag] ?? []),
  ])
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const div = document.createElement('div')
    div.textContent = node.textContent ?? ''
    return div.innerHTML
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as Element
  const tag = el.tagName.toLowerCase()

  if (!ALLOWED_TAGS.has(tag)) {
    // Drop the tag but recurse into children (unwrap)
    return Array.from(el.childNodes).map(sanitizeNode).join('')
  }

  const allowedAttrs = getAllowedAttrs(tag)
  const attrs = Array.from(el.attributes)
    .filter(a => {
      if (!allowedAttrs.has(a.name)) return false
      // Block dangerous href/src values
      if ((a.name === 'href' || a.name === 'src') && !ALLOWED_HREF_SCHEMES.test(a.value)) return false
      return true
    })
    .map(a => {
      // Force target="_blank" to also include rel="noopener noreferrer"
      if (a.name === 'target' && a.value === '_blank') return ''
      return ` ${a.name}="${a.value.replace(/"/g, '&quot;')}"`
    })
    .join('')

  // Add rel="noopener noreferrer" to all <a target="_blank"> links
  const extraAttrs = (tag === 'a' && el.getAttribute('target') === '_blank')
    ? ' rel="noopener noreferrer"'
    : ''

  // Void elements (self-closing)
  if (tag === 'br' || tag === 'img') return `<${tag}${attrs}${extraAttrs} />`

  const children = Array.from(el.childNodes).map(sanitizeNode).join('')
  return `<${tag}${attrs}${extraAttrs}>${children}</${tag}>`
}

/**
 * Sanitize an HTML string in the browser using DOMParser.
 * Falls back to plain-text stripping in non-browser environments.
 *
 * @param raw - Untrusted HTML string (e.g. from a rich-text DB field)
 * @returns Safe HTML string safe to pass to `dangerouslySetInnerHTML`
 */
export function sanitizeHtml(raw: string | null | undefined): string {
  if (!raw) return ''

  // Non-browser environment (Jest, Node SSR) — strip all tags
  if (typeof document === 'undefined') {
    return raw.replace(/<[^>]+>/g, '')
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, 'text/html')
  return Array.from(doc.body.childNodes).map(sanitizeNode).join('')
}
