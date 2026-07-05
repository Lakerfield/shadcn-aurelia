/**
 * Dismissable layer — Escape / outside-pointerdown dismissal with a layer
 * stack, so nested overlays (dialog → popover → menu) dismiss innermost-first.
 *
 * Only the topmost layer reacts to Escape; an outside pointerdown dismisses a
 * layer only if the press is also outside every layer above it (clicking a
 * nested popover must not dismiss the dialog underneath).
 */

export interface DismissableLayerOptions {
  onDismiss: () => void
  /** Elements considered "inside" besides the layer itself (e.g. the trigger). */
  exclude?: () => Array<Element | null | undefined>
  /** Dismiss on Escape. Default true. */
  escape?: boolean
  /** Dismiss on pointerdown outside. Default true. */
  outsidePress?: boolean
}

interface Layer {
  el: HTMLElement
  options: DismissableLayerOptions
}

const stack: Layer[] = []
let listenersActive = false

function isInside(layer: Layer, target: Node): boolean {
  if (layer.el.contains(target)) return true
  for (const el of layer.options.exclude?.() ?? []) {
    if (el?.contains(target)) return true
  }
  return false
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key !== 'Escape' || stack.length === 0) return
  const top = stack[stack.length - 1]
  if (top.options.escape === false) return
  e.preventDefault()
  top.options.onDismiss()
}

function onPointerdown(e: PointerEvent): void {
  const target = e.target as Node
  // Walk top-down; dismiss every layer the press is outside of, stop at the
  // first layer that contains it.
  for (let i = stack.length - 1; i >= 0; i--) {
    const layer = stack[i]
    if (isInside(layer, target)) break
    if (layer.options.outsidePress !== false) layer.options.onDismiss()
  }
}

function syncListeners(): void {
  if (stack.length > 0 && !listenersActive) {
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('pointerdown', onPointerdown, true)
    listenersActive = true
  } else if (stack.length === 0 && listenersActive) {
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('pointerdown', onPointerdown, true)
    listenersActive = false
  }
}

/** Pushes a layer onto the stack. Returns a function that removes it. */
export function createDismissableLayer(
  el: HTMLElement,
  options: DismissableLayerOptions,
): () => void {
  const layer: Layer = { el, options }
  stack.push(layer)
  syncListeners()
  return () => {
    const i = stack.indexOf(layer)
    if (i >= 0) stack.splice(i, 1)
    syncListeners()
  }
}
