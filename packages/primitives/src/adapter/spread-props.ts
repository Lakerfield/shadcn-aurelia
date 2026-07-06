/**
 * Spike B — spread-props: apply/diff a Zag prop bag (post-normalizeProps) onto a DOM element.
 *
 * After `@zag-js/vanilla`'s `normalizeProps` runs, the prop bag has:
 *   • data-*, aria-*, id, role …  → string attributes (keys already lowercase)
 *   • onclick, onpointerenter …   → event handlers (lowercase "on*" prefix)
 *   • style                       → already converted to a CSS string by normalizeProps
 *   • tabindex                    → numeric attribute, lowercase after normalize
 *
 * Our `applySpreadProps` function diffs and applies these against the element.
 * Returns a cleanup that removes all applied event listeners and attributes.
 *
 * Also exported: `SpreadPropsAttribute` — a custom attribute for template-driven use:
 *   <div spread-props.bind="api.getTriggerProps()">
 */
import { customAttribute, INode, bindable, resolve } from 'aurelia'

type PropBag = Record<string, unknown>

/**
 * Returns a cleanup function that reverts all applied props.
 *
 * Event detection: post-normalizeProps, Zag uses lowercase "on*" keys (onclick,
 * onpointerenter). Pre-normalize camelCase (onClick) is also handled for safety.
 */
export function applySpreadProps(element: HTMLElement, props: PropBag): () => void {
  const cleanups: Array<() => void> = []

  for (const [key, val] of Object.entries(props)) {
    if (val === null || val === undefined) continue

    // style is already a CSS string after @zag-js/vanilla's normalizeProps
    if (key === 'style' && typeof val === 'string') {
      const prev = element.getAttribute('style') ?? ''
      element.setAttribute('style', val)
      cleanups.push(() => {
        if (prev) element.setAttribute('style', prev)
        else element.removeAttribute('style')
      })
      continue
    }

    // Event handlers: onclick / onpointerenter (post-normalize) or onClick (pre-normalize)
    if (typeof val === 'function' && /^on[a-z]/i.test(key)) {
      const eventName = key.slice(2).toLowerCase() // "onclick" → "click", "onPointerEnter" → "pointerenter"
      const handler = val as EventListener
      element.addEventListener(eventName, handler)
      cleanups.push(() => element.removeEventListener(eventName, handler))
      continue
    }

    // aria-* attributes are tri-state: false must be serialized, not removed
    // (aria-selected="false" ≠ absent for assistive tech).
    if (typeof val === 'boolean' && key.startsWith('aria-')) {
      const prev = element.getAttribute(key)
      element.setAttribute(key, String(val))
      cleanups.push(() => {
        if (prev === null) element.removeAttribute(key)
        else element.setAttribute(key, prev)
      })
      continue
    }

    // Boolean false → remove the attribute (handles HTML boolean attrs like `hidden`, `disabled`).
    // Boolean true → set the attribute with an empty string (idiomatic HTML).
    if (val === false) {
      const wasPresent = element.hasAttribute(key)
      if (wasPresent) element.removeAttribute(key)
      cleanups.push(() => { if (wasPresent) element.setAttribute(key, '') })
      continue
    }
    if (val === true) {
      const prev = element.getAttribute(key)
      element.setAttribute(key, '')
      cleanups.push(() => {
        if (prev === null) element.removeAttribute(key)
        else element.setAttribute(key, prev)
      })
      continue
    }

    // Everything else: stringify and set as attribute
    const prev = element.getAttribute(key)
    element.setAttribute(key, String(val))
    cleanups.push(() => {
      if (prev === null) element.removeAttribute(key)
      else element.setAttribute(key, prev)
    })
  }

  return () => cleanups.forEach((fn) => fn())
}

/** Custom attribute: `<div spread-props.bind="api.getTriggerProps()">` */
@customAttribute('spread-props')
export class SpreadPropsAttribute {
  @bindable() value: PropBag = {}

  private readonly el: HTMLElement = resolve(INode) as HTMLElement
  private cleanup: (() => void) | null = null

  valueChanged(newProps: PropBag): void {
    this.cleanup?.()
    this.cleanup = null
    if (newProps && typeof newProps === 'object') {
      this.cleanup = applySpreadProps(this.el, newProps)
    }
  }

  detaching(): void {
    this.cleanup?.()
    this.cleanup = null
  }
}
