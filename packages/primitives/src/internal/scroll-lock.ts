/**
 * Body scroll lock for modal overlays — parity with `@zag-js/remove-scroll`:
 * `overflow: hidden` on <body>, scrollbar-width compensation (padding on the
 * scrollbar side + `--scrollbar-width` on the root element) so the page does
 * not shift, and a `data-scroll-lock` marker for styling hooks. Reference
 * counted: nested overlays lock once, the last one to close unlocks.
 *
 * Not ported from Zag: the iOS `position: fixed` variant (visual-viewport
 * scroll restoration) — overscroll containment covers the target browsers.
 */

let lockCount = 0
let releaseLock: (() => void) | null = null

function hasStableScrollbarGutter(el: Element): boolean {
  const gutter = getComputedStyle(el).scrollbarGutter
  return gutter === 'stable' || gutter?.startsWith('stable ') === true
}

/** RTL pages overflow on the left — compensate on the side the scrollbar is. */
function getPaddingProperty(documentElement: HTMLElement): 'paddingLeft' | 'paddingRight' {
  const documentLeft = documentElement.getBoundingClientRect().left
  const scrollbarX = Math.round(documentLeft) + documentElement.scrollLeft
  return scrollbarX ? 'paddingLeft' : 'paddingRight'
}

function applyLock(): () => void {
  const { documentElement, body } = document
  const hasStableGutter =
    hasStableScrollbarGutter(documentElement) || hasStableScrollbarGutter(body)
  const scrollbarWidth = window.innerWidth - documentElement.clientWidth

  body.setAttribute('data-scroll-lock', '')
  documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)

  const paddingProperty = getPaddingProperty(documentElement)
  const prevOverflow = body.style.overflow
  const prevPadding = body.style[paddingProperty]
  body.style.overflow = 'hidden'
  if (!hasStableGutter && scrollbarWidth > 0) {
    body.style[paddingProperty] = `${scrollbarWidth}px`
  }

  return () => {
    body.style.overflow = prevOverflow
    body.style[paddingProperty] = prevPadding
    documentElement.style.removeProperty('--scrollbar-width')
    body.removeAttribute('data-scroll-lock')
    if (body.style.length === 0) body.removeAttribute('style')
    if (documentElement.style.length === 0) documentElement.removeAttribute('style')
  }
}

/** Locks body scroll. Returns a release function (idempotent). */
export function preventBodyScroll(): () => void {
  if (lockCount === 0) releaseLock = applyLock()
  lockCount++
  let released = false
  return () => {
    if (released) return
    released = true
    lockCount--
    if (lockCount === 0) {
      releaseLock?.()
      releaseLock = null
    }
  }
}
