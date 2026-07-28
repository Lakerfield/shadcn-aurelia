/**
 * Interaction-modality tracking — the focus-visible heuristic behind
 * "focus opens the tooltip only for keyboard users".
 *
 * Mirrors @zag-js/focus-visible (itself the react-aria/WICG polyfill
 * approach) so native engines behave exactly like the Zag machines they
 * replace: modality starts unknown, keyboard events switch to `keyboard`,
 * pointer events to `pointer`, and a trusted focus event with no preceding
 * input event counts as `virtual` (assistive tech). Programmatic
 * `element.focus()` is masked via a prototype patch so it never reads as
 * virtual.
 */

export type InteractionModality = 'keyboard' | 'pointer' | 'virtual' | null

let currentModality: InteractionModality = null
let hasEventBeforeFocus = false
let hasBlurredWindowRecently = false
let installed = false

const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? '')

// Modifier-only presses (and shortcuts) don't indicate keyboard navigation.
const isValidKey = (e: KeyboardEvent): boolean =>
  !(
    e.metaKey ||
    (!isMac() && e.altKey) ||
    e.ctrlKey ||
    e.key === 'Control' ||
    e.key === 'Shift' ||
    e.key === 'Meta'
  )

const onKeyboardEvent = (e: KeyboardEvent): void => {
  hasEventBeforeFocus = true
  if (isValidKey(e)) currentModality = 'keyboard'
}

const onPointerEvent = (e: Event): void => {
  currentModality = 'pointer'
  if (e.type === 'mousedown' || e.type === 'pointerdown') hasEventBeforeFocus = true
}

const onClickEvent = (e: MouseEvent): void => {
  // detail === 0 → not produced by a real pointer (screen reader "virtual click")
  if (e.detail === 0) {
    hasEventBeforeFocus = true
    currentModality = 'virtual'
  }
}

const onFocusEvent = (e: FocusEvent): void => {
  if (e.target === window || e.target === document || !e.isTrusted) return
  if (!hasEventBeforeFocus && !hasBlurredWindowRecently) currentModality = 'virtual'
  hasEventBeforeFocus = false
  hasBlurredWindowRecently = false
}

const onWindowBlur = (): void => {
  hasEventBeforeFocus = false
  hasBlurredWindowRecently = true
}

/** Install the global listeners once (no-op afterwards, never torn down). */
export function ensureInteractionModalityTracking(): void {
  if (installed || typeof window === 'undefined') return
  installed = true

  // Programmatic focus() must not count as a virtual-modality focus event.
  const nativeFocus = window.HTMLElement.prototype.focus
  try {
    Object.defineProperty(window.HTMLElement.prototype, 'focus', {
      configurable: true,
      value: function patchedFocus(this: HTMLElement, ...args: unknown[]) {
        hasEventBeforeFocus = true
        return (nativeFocus as (...a: unknown[]) => void).apply(this, args)
      },
    })
  } catch {
    /* frozen prototype — heuristic degrades gracefully */
  }

  document.addEventListener('keydown', onKeyboardEvent, true)
  document.addEventListener('keyup', onKeyboardEvent, true)
  document.addEventListener('click', onClickEvent, true)
  window.addEventListener('focus', onFocusEvent, true)
  window.addEventListener('blur', onWindowBlur, false)
  if (typeof window.PointerEvent !== 'undefined') {
    document.addEventListener('pointerdown', onPointerEvent, true)
    document.addEventListener('pointermove', onPointerEvent, true)
    document.addEventListener('pointerup', onPointerEvent, true)
  } else {
    document.addEventListener('mousedown', onPointerEvent, true)
    document.addEventListener('mousemove', onPointerEvent, true)
    document.addEventListener('mouseup', onPointerEvent, true)
  }
}

export function getInteractionModality(): InteractionModality {
  return currentModality
}

/**
 * Force the modality (Zag's `setInteractionModality`) — listbox engines mark
 * an open as `virtual` so the initial scroll-to-highlighted runs even though
 * the open itself came from a pointer click.
 */
export function setInteractionModality(modality: InteractionModality): void {
  currentModality = modality
}

export function isFocusVisible(): boolean {
  return currentModality === 'keyboard' || currentModality === 'virtual'
}
