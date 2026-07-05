/**
 * Reading-direction resolution for RTL support.
 *
 * Zag machines take a `dir: 'ltr' | 'rtl'` prop. Rather than a provider
 * component (Phase 3d adds `ui-direction`), components resolve direction from
 * the DOM: the nearest ancestor with a `dir` attribute wins, falling back to
 * the document's computed direction.
 */

export type Direction = 'ltr' | 'rtl'

export function resolveDirection(el: Element | null | undefined): Direction {
  let node: Element | null = el ?? null
  while (node) {
    const dir = node.getAttribute('dir')
    if (dir === 'ltr' || dir === 'rtl') return dir
    node = node.parentElement
  }
  const docDir = document.documentElement.getAttribute('dir')
  return docDir === 'rtl' ? 'rtl' : 'ltr'
}
