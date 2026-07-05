/**
 * Focus trap for modal overlays (dialog, alert-dialog, sheet, drawer).
 *
 * Keeps Tab/Shift+Tab cycling inside `container`, focuses the first tabbable
 * (or the container itself) on activation, and restores focus to the
 * previously focused element on release.
 *
 * Note: Zag's dialog machine ships its own trap; this one exists for native
 * primitives (`internal` is native from day one — architecture §5.3) and for
 * overlays composed without a machine.
 */

const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

function getTabbables(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(
    (el) => !el.hidden && el.offsetParent !== null,
  )
}

export interface FocusTrapOptions {
  /** Element to focus on activation; defaults to the first tabbable. */
  initialFocus?: HTMLElement
  /** Restore focus to the pre-trap active element on release. Default true. */
  restoreFocus?: boolean
}

/** Activates the trap immediately. Returns a release function. */
export function trapFocus(container: HTMLElement, options: FocusTrapOptions = {}): () => void {
  const { initialFocus, restoreFocus = true } = options
  const previouslyFocused = document.activeElement as HTMLElement | null

  const target = initialFocus ?? getTabbables(container)[0] ?? container
  if (target === container && !container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '-1')
  }
  target.focus()

  const onKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const tabbables = getTabbables(container)
    if (tabbables.length === 0) {
      e.preventDefault()
      return
    }
    const first = tabbables[0]
    const last = tabbables[tabbables.length - 1]
    const active = document.activeElement

    if (e.shiftKey && (active === first || active === container)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  // Refocus the container if focus escapes (e.g. programmatic focus elsewhere)
  const onFocusIn = (e: FocusEvent) => {
    if (!container.contains(e.target as Node)) {
      const tabbables = getTabbables(container)
      ;(tabbables[0] ?? container).focus()
    }
  }

  container.addEventListener('keydown', onKeydown)
  document.addEventListener('focusin', onFocusIn)

  return () => {
    container.removeEventListener('keydown', onKeydown)
    document.removeEventListener('focusin', onFocusIn)
    if (restoreFocus) previouslyFocused?.focus()
  }
}
