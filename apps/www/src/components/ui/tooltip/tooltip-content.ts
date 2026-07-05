/**
 * ui-tooltip-content — overlay panel.
 *
 * Spikes exercised:
 *   B  Applies Zag content prop bag (data-state, aria-*, role) via applySpreadProps
 *   C  Resolves compound context by DOM traversal before portal moves the element
 *   D  Portals this element to document.body so it escapes overflow/z-index ancestors
 *
 * Positioning: Phase 0 uses a fixed viewport-top position. Phase 1 integrates
 * @floating-ui/dom for real anchor-based placement.
 */
import { customElement, INode, resolve } from 'aurelia'
import { applySpreadProps } from '@shadcn-aurelia/primitives'
import { tooltipContext } from './tooltip'
import type { UiTooltip } from './tooltip'

// Visibility is controlled by Zag's `hidden` boolean attribute (via applySpreadProps).
// No show.bind needed — Zag sets hidden=true/false on this host directly.
const CONTENT_TEMPLATE = `
<div class="z-50 w-auto overflow-hidden rounded-md bg-primary px-3 py-1.5
            text-xs text-primary-foreground fixed top-4 left-1/2 -translate-x-1/2 shadow-md">
  <au-slot></au-slot>
</div>
`

@customElement({ name: 'ui-tooltip-content', template: CONTENT_TEMPLATE })
export class UiTooltipContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private controller: UiTooltip | null = null
  private cleanupProps: (() => void) | null = null
  private unsubscribeController: (() => void) | null = null

  attached(): void {
    // Spike C: resolve context BEFORE portal (element still in original DOM position)
    this.controller = tooltipContext.get(this.host) ?? null

    // Spike D: portal to body
    document.body.appendChild(this.host)

    if (!this.controller) {
      console.warn('[ui-tooltip-content] No parent <ui-tooltip> found in DOM')
      return
    }

    this.update()
    this.unsubscribeController = this.controller.subscribe(() => this.update())
  }

  detaching(): void {
    this.unsubscribeController?.()
    this.unsubscribeController = null
    this.cleanupProps?.()
    this.cleanupProps = null
  }

  private update(): void {
    this.cleanupProps?.()
    const props = this.controller?.api?.getContentProps()
    this.cleanupProps = props ? applySpreadProps(this.host, props as Record<string, unknown>) : null
  }
}
