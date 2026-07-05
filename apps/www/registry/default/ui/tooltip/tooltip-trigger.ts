/**
 * ui-tooltip-trigger — interactive target element.
 *
 * Spikes exercised:
 *   B  Applies Zag trigger prop bag (events + aria attrs) via applySpreadProps
 *   C  Resolves the compound context by walking up the DOM
 */
import { customElement, INode, resolve } from 'aurelia'
import { applySpreadProps } from '@shadcn-aurelia/primitives'
import { tooltipContext } from './tooltip'
import type { UiTooltip } from './tooltip'

@customElement({ name: 'ui-tooltip-trigger', template: '<au-slot></au-slot>' })
export class UiTooltipTrigger {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private controller: UiTooltip | null = null
  private cleanupProps: (() => void) | null = null
  private unsubscribeController: (() => void) | null = null

  attached(): void {
    this.controller = tooltipContext.get(this.host) ?? null
    if (!this.controller) {
      console.warn('[ui-tooltip-trigger] No parent <ui-tooltip> found in DOM')
      return
    }
    this.applyTriggerProps()
    this.unsubscribeController = this.controller.subscribe(() => this.applyTriggerProps())
  }

  detaching(): void {
    this.unsubscribeController?.()
    this.unsubscribeController = null
    this.cleanupProps?.()
    this.cleanupProps = null
  }

  private applyTriggerProps(): void {
    this.cleanupProps?.()
    const props = this.controller?.api?.getTriggerProps()
    this.cleanupProps = props ? applySpreadProps(this.host, props as Record<string, unknown>) : null
  }
}
