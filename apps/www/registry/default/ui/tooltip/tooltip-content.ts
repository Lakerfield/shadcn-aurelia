/**
 * ui-tooltip-content — overlay panel, portaled to <body>; positioner receives
 * Zag's floating-ui styles, content gets role/data-state plus shadcn classes.
 */
import { customElement, INode, resolve } from 'aurelia'
import { bindPart } from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'
import { tooltipContext } from './tooltip'

const CONTENT_TEMPLATE = `
<div ref="positionerEl" data-slot="tooltip-positioner">
  <div ref="contentEl" data-slot="tooltip-content" class.bind="classes">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-tooltip-content', template: CONTENT_TEMPLATE })
export class UiTooltipContent {
  positionerEl!: HTMLDivElement
  contentEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private disposers: Array<() => void> = []
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      'z-50 w-fit rounded-md bg-primary px-3 py-1.5 text-xs text-balance text-primary-foreground',
      this.authorClasses,
    )
  }

  attached(): void {
    // resolve context BEFORE the portal moves the element out of the tree
    const tooltip = tooltipContext.get(this.host)
    document.body.appendChild(this.host)
    if (!tooltip) {
      console.warn('[ui-tooltip-content] No parent <ui-tooltip> found in DOM')
      return
    }
    this.disposers = [
      bindPart(tooltip, this.positionerEl, (api) => api.getPositionerProps()),
      bindPart(tooltip, this.contentEl, (api) => api.getContentProps()),
    ]
  }

  detaching(): void {
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
