/**
 * ui-tooltip-trigger — applies Zag trigger props to the host so the slotted
 * interactive child (button, link) activates the tooltip via bubbling events.
 */
import { customElement, INode, resolve } from 'aurelia'
import { bindPart } from '@shadcn-aurelia/primitives'
import { tooltipContext } from './tooltip'

@customElement({ name: 'ui-tooltip-trigger', template: '<au-slot></au-slot>' })
export class UiTooltipTrigger {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  attached(): void {
    const tooltip = tooltipContext.get(this.host)
    if (!tooltip) {
      console.warn('[ui-tooltip-trigger] No parent <ui-tooltip> found in DOM')
      return
    }
    this.dispose = bindPart(tooltip, this.host, (api) => api.getTriggerProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}
