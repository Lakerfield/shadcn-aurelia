/**
 * aria-hides everything outside `targets` — parity with `@zag-js/aria-hidden`
 * (`hideOthers`): walking up from each target to <body>, every sibling that
 * does not contain a target gets `aria-hidden="true"` plus a
 * `data-aria-hidden` marker; the cleanup restores the previous value.
 * Reference counted per element so overlapping overlays (dialog → sheet)
 * unhide only when the last one releases.
 */

const MARKER = 'data-aria-hidden'

interface HiddenRecord {
  count: number
  prevAriaHidden: string | null
}

const hiddenElements = new Map<Element, HiddenRecord>()

function hide(el: Element): void {
  const record = hiddenElements.get(el)
  if (record) {
    record.count++
    return
  }
  hiddenElements.set(el, { count: 1, prevAriaHidden: el.getAttribute('aria-hidden') })
  el.setAttribute('aria-hidden', 'true')
  el.setAttribute(MARKER, '')
}

function unhide(el: Element): void {
  const record = hiddenElements.get(el)
  if (!record) return
  if (--record.count > 0) return
  hiddenElements.delete(el)
  el.removeAttribute(MARKER)
  if (record.prevAriaHidden === null) el.removeAttribute('aria-hidden')
  else el.setAttribute('aria-hidden', record.prevAriaHidden)
}

/** Hides all content outside `targets`. Returns a restore function. */
export function hideOthers(targets: Array<Element | null | undefined>): () => void {
  const elements = targets.filter((el): el is Element => el != null)
  if (elements.length === 0) return () => {}

  // targets + every ancestor stay visible; everything else at each level hides
  const keep = new Set<Element>()
  for (let el of elements as Array<Element | null>) {
    while (el && el !== document.body) {
      keep.add(el)
      el = el.parentElement
    }
  }

  const marked: Element[] = []
  for (const target of elements) {
    let el: Element | null = target
    while (el && el !== document.body && el.parentElement) {
      for (const sibling of el.parentElement.children) {
        if (keep.has(sibling)) continue
        if (sibling.hasAttribute('aria-live')) continue
        hide(sibling)
        marked.push(sibling)
      }
      el = el.parentElement
    }
  }

  return () => marked.forEach(unhide)
}
