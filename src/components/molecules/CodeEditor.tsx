/**
 * CodeEditor — syntax-highlighted code editor with Tailwind styling.
 *
 * Technique: transparent <textarea> overlaid on a <pre> mirror that renders
 * highlighted HTML. Both share identical font / padding / line-height so they
 * stay pixel-perfect in sync.
 *
 * Supported languages: html | css
 *
 * Dark mode: responds to [data-dark] ancestor (Tailwind darkMode selector config).
 * The syntax token colours are still JS-driven (they live inside
 * dangerouslySetInnerHTML spans), so we keep the useDarkMode hook only for
 * picking the right token palette.
 *
 * Unavoidable inline styles (3 only):
 *   1. height: computedHeight  (dynamic — changes with line count)
 *   2. WebkitTextFillColor: 'transparent'  (vendor prefix — no Tailwind equiv)
 *   3. <span style="color:…"> inside dangerouslySetInnerHTML  (runtime-generated)
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'

// ── Token types ───────────────────────────────────────────────────────────────

type TokenType =
  | 'tag' | 'attr' | 'string' | 'comment' | 'doctype' | 'punct'
  | 'prop' | 'value' | 'selector' | 'at' | 'number' | 'unit' | 'plain'

interface Token { type: TokenType; text: string }

// ── Tokenisers ────────────────────────────────────────────────────────────────

function tokeniseHTML(code: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < code.length) {
    if (code.startsWith('<!--', i)) {
      const e = code.indexOf('-->', i + 4); const c = e === -1 ? code.length : e + 3
      out.push({ type: 'comment', text: code.slice(i, c) }); i = c; continue
    }
    if (code.startsWith('<!', i)) {
      const e = (code.indexOf('>', i) + 1) || code.length
      out.push({ type: 'doctype', text: code.slice(i, e) }); i = e; continue
    }
    if (code[i] === '<') {
      out.push({ type: 'punct', text: '<' }); i++
      if (code[i] === '/') { out.push({ type: 'punct', text: '/' }); i++ }
      const tm = code.slice(i).match(/^[a-zA-Z][a-zA-Z0-9-]*/)
      if (tm) { out.push({ type: 'tag', text: tm[0] }); i += tm[0].length }
      while (i < code.length && code[i] !== '>') {
        if (code[i] === '/' && code[i + 1] === '>') { out.push({ type: 'punct', text: '/>' }); i += 2; break }
        if (code[i] === '"' || code[i] === "'") {
          const q = code[i]; const e = code.indexOf(q, i + 1); const c = e === -1 ? code.length : e + 1
          out.push({ type: 'string', text: code.slice(i, c) }); i = c; continue
        }
        if (code[i] === '=') { out.push({ type: 'punct', text: '=' }); i++; continue }
        if (/\s/.test(code[i])) {
          let ws = ''; while (i < code.length && /\s/.test(code[i])) ws += code[i++]
          out.push({ type: 'plain', text: ws }); continue
        }
        const am = code.slice(i).match(/^[^\s=/>]+/)
        if (am) { out.push({ type: 'attr', text: am[0] }); i += am[0].length; continue }
        out.push({ type: 'plain', text: code[i] }); i++
      }
      if (i < code.length && code[i] === '>') { out.push({ type: 'punct', text: '>' }); i++ }
      continue
    }
    let plain = ''; while (i < code.length && code[i] !== '<') plain += code[i++]
    if (plain) out.push({ type: 'plain', text: plain })
  }
  return out
}

function tokeniseCSS(code: string): Token[] {
  const out: Token[] = []
  let i = 0
  while (i < code.length) {
    if (code.startsWith('/*', i)) {
      const e = code.indexOf('*/', i + 2); const c = e === -1 ? code.length : e + 2
      out.push({ type: 'comment', text: code.slice(i, c) }); i = c; continue
    }
    if (code[i] === '@') {
      const m = code.slice(i).match(/^@[a-zA-Z-]+/)
      if (m) { out.push({ type: 'at', text: m[0] }); i += m[0].length; continue }
    }
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i]; const e = code.indexOf(q, i + 1); const c = e === -1 ? code.length : e + 1
      out.push({ type: 'string', text: code.slice(i, c) }); i = c; continue
    }
    if ('{}:;,>+~()[]'.includes(code[i])) { out.push({ type: 'punct', text: code[i] }); i++; continue }
    const nm = code.slice(i).match(/^-?(\d+\.?\d*)(px|em|rem|vh|vw|%|s|ms|deg|fr)?/)
    if (nm?.[1]) {
      out.push({ type: 'number', text: nm[1] }); i += nm[1].length
      if (nm[2]) { out.push({ type: 'unit', text: nm[2] }); i += nm[2].length }
      continue
    }
    const im = code.slice(i).match(/^[a-zA-Z_-][a-zA-Z0-9_-]*/)
    if (im) {
      const before = code.slice(0, i).trimEnd(); const last = before[before.length - 1]
      const type: TokenType = last === '{' || last === ';' ? 'prop' : last === ':' ? 'value' : 'selector'
      out.push({ type, text: im[0] }); i += im[0].length; continue
    }
    out.push({ type: 'plain', text: code[i] }); i++
  }
  return out
}

// ── Token colour palettes (used only inside dangerouslySetInnerHTML spans) ────

interface Palette {
  text: string
  tag: string; attr: string; string: string; comment: string; doctype: string
  punct: string; prop: string; value: string; selector: string
  at: string; number: string; unit: string
}

const LIGHT: Palette = {
  text:     '#24292e',
  tag:      '#005cc5', attr:     '#6f42c1', string:   '#032f62',
  comment:  '#6a737d', doctype:  '#6f42c1', punct:    '#24292e',
  prop:     '#005cc5', value:    '#032f62', selector: '#6f42c1',
  at:       '#d73a49', number:   '#005cc5', unit:     '#6f42c1',
}

const DARK: Palette = {
  text:     '#c9d1d9',
  tag:      '#7ee787', attr:     '#79c0ff', string:   '#a5d6ff',
  comment:  '#8b949e', doctype:  '#d2a8ff', punct:    '#c9d1d9',
  prop:     '#79c0ff', value:    '#a5d6ff', selector: '#7ee787',
  at:       '#ff7b72', number:   '#f2cc60', unit:     '#d2a8ff',
}

function tokenColour(type: TokenType, p: Palette): string {
  const map: Partial<Record<TokenType, string>> = {
    tag: p.tag, attr: p.attr, string: p.string, comment: p.comment,
    doctype: p.doctype, punct: p.punct, prop: p.prop, value: p.value,
    selector: p.selector, at: p.at, number: p.number, unit: p.unit,
  }
  return map[type] ?? p.text
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlight(code: string, lang: 'html' | 'css', palette: Palette): string {
  const tokens = lang === 'css' ? tokeniseCSS(code) : tokeniseHTML(code)
  return tokens.map(t => {
    const col = tokenColour(t.type, palette)
    const safe = escHtml(t.text)
    return col === palette.text ? safe : `<span style="color:${col}">${safe}</span>`
  }).join('')
}

// ── Dark-mode hook (for token palette only) ───────────────────────────────────

function useDarkMode(): boolean {
  const [dark, setDark] = useState(() =>
    !!document.querySelector('[data-dark]') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () =>
      setDark(!!document.querySelector('[data-dark]') || mq.matches)
    mq.addEventListener('change', update)
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dark'] })
    return () => { mq.removeEventListener('change', update); obs.disconnect() }
  }, [])
  return dark
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LINE_H    = 20   // px  ↔ leading-5
const PAD_V     = 12   // px  ↔ p-3
const LINE_NUM_W = 36  // px  ↔ w-9

// Tailwind classes shared between <pre> and <textarea>
// (font, size, line-height, padding, sizing, overflow, whitespace)
const SHARED_CLS = [
  'font-mono',
  'text-[12px]',
  'leading-5',           // 20px
  'p-3',                 // 12px
  'pl-12',               // 48px = PAD_H(12) + LINE_NUM_W(36)
  'm-0',
  'border-0',
  'outline-none',
  'whitespace-pre',
  'break-normal',
  'tab-2',
  'w-full',
  'box-border',
  'overflow-x-auto',
  'overflow-y-auto',
].join(' ')

// ── Component ─────────────────────────────────────────────────────────────────

export interface CodeEditorProps {
  value:       string
  onChange:    (v: string) => void
  language?:   'html' | 'css'
  placeholder?: string
  minHeight?:  number
  label?:      string
}

export function CodeEditor({
  value,
  onChange,
  language    = 'html',
  placeholder = '<!-- write your code here -->',
  minHeight   = 200,
  label,
}: CodeEditorProps) {
  const dark    = useDarkMode()
  const palette = dark ? DARK : LIGHT

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef      = useRef<HTMLPreElement>(null)

  // Sync scroll between textarea ↔ pre mirror
  const syncScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop  = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  // Tab → 2 spaces
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const ta = e.currentTarget
    const { selectionStart: s, selectionEnd: end } = ta
    const next = value.slice(0, s) + '  ' + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2 })
  }, [value, onChange])

  const highlighted = useMemo(
    () => highlight(value ?? '', language, palette),
    [value, language, palette],
  )

  const lines          = (value ?? '').split('\n').length
  const computedHeight = Math.max(minHeight, lines * LINE_H + PAD_V * 2)

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <p className="
          font-body text-xs font-semibold uppercase tracking-[0.04em]
          text-gray-500 dark:text-gray-400
          mb-1.5
        ">
          {label}
        </p>
      )}

      {/* Editor shell */}
      <div className="
        relative rounded-md overflow-hidden
        border border-gray-300 dark:border-gray-700
        bg-gray-50 dark:bg-[#0d1117]
        shadow-sm dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]
      ">
        {/* Language badge — top-right */}
        <div
          aria-hidden="true"
          className="
            absolute top-1.5 right-2 z-[4]
            font-mono text-[10px] font-semibold uppercase tracking-[0.08em]
            text-gray-400 dark:text-gray-600
            select-none pointer-events-none
          "
        >
          {language.toUpperCase()}
        </div>

        {/* Line-numbers gutter */}
        <div
          aria-hidden="true"
          className="
            absolute top-0 left-0 z-[2]
            w-9 h-full
            bg-gray-100 dark:bg-[#161b22]
            border-r border-gray-300 dark:border-gray-700
            overflow-hidden pointer-events-none
          "
        >
          <div className="
            pt-3 pr-1.5
            font-mono text-[12px] leading-5
            text-gray-400 dark:text-[#484f58]
            text-right select-none
          ">
            {Array.from({ length: lines }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        </div>

        {/* Highlighted mirror (behind textarea) */}
        <pre
          ref={preRef}
          aria-hidden="true"
          className={`
            ${SHARED_CLS}
            absolute top-0 left-0 z-[1]
            bg-transparent pointer-events-none overflow-hidden
            text-gray-900 dark:text-gray-300
            resize-none
          `}
          style={{ height: computedHeight }}
          dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
        />

        {/* Transparent textarea — receives all input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className={`
            ${SHARED_CLS}
            relative z-[3]
            bg-transparent text-transparent
            caret-gray-900 dark:caret-gray-300
            resize-none
            placeholder:text-gray-400 dark:placeholder:text-gray-600
          `}
          style={{
            height: computedHeight,
            // No Tailwind equivalent for vendor-prefixed -webkit-text-fill-color
            WebkitTextFillColor: 'transparent',
          }}
        />
      </div>

      {/* Responsive hint (visible on small screens) */}
      <p className="
        mt-1 text-[10px] text-gray-400 dark:text-gray-600
        sm:hidden
      ">
        Tip: rotate to landscape for a wider editor.
      </p>
    </div>
  )
}
