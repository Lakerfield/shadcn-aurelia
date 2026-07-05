/**
 * ui-tooltip-content — overlay panel.
 *
 * Anatomy (matches Zag/shadcn): host is portaled to <body>; inside it a
 * positioner div receives Zag's floating-ui positioning styles and the content
 * div receives role/data-state/aria props plus the shadcn tooltip classes.
 */
import { customElement, INode, resolve } from 'aurelia'
import { applySpreadProps } from '@shadcn-aurelia/primitives'
import { tooltipContext } from './tooltip'
import type { UiTooltip } from './tooltip'

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="tooltip-positioner">
  <div ref="contentEl" data-slot="tooltip-content"
       class="z-50 w-fit rounded-md bg-primary px-3 py-1.5 text-xs text-balance text-primary-foreground">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-tooltip-content', template: CONTENT_TEMPLATE })
export class UiTooltipContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private controller: UiTooltip | null = null
  private cleanupPositioner: (() => void) | null = null
  private cleanupContent: (() => void) | null = null
  private unsubscribeController: (() => void) | null = null

  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement

  attached(): void {
    // Resolve context BEFORE the portal moves the element out of the tree
    this.controller = tooltipContext.get(this.host) ?? null

    // Portal to body so overflow/z-index ancestors can't clip the overlay
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
    this.cleanupPositioner?.()
    this.cleanupPositioner = null
    this.cleanupContent?.()
    this.cleanupContent = null
  }

  private update(): void {
    this.cleanupPositioner?.()
    this.cleanupContent?.()
    const api = this.controller?.api
    const positionerProps = api?.getPositionerProps()
    const contentProps = api?.getContentProps()
    this.cleanupPositioner = positionerProps
      ? applySpreadProps(this.positionerEl, positionerProps as Record<string, unknown>)
      : null
    this.cleanupContent = contentProps
      ? applySpreadProps(this.contentEl, contentProps as Record<string, unknown>)
      : null
  }
}
