/**
 * ui-tooltip — root compound element (Zag tooltip behind the facade).
 *   <ui-tooltip open.two-way="isOpen" open-change.trigger="...">
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import {
  createTooltipBehavior,
  createControlledSync,
  createContext,
  createId,
  type ControlledSync,
  type TooltipApi,
  type BehaviorSource,
} from '@shadcn-aurelia/primitives'

export const tooltipContext = createContext<UiTooltip>()

@customElement({ name: 'ui-tooltip', template: '<au-slot></au-slot>' })
export class UiTooltip implements BehaviorSource<TooltipApi> {
  @bindable({ mode: BindingMode.twoWay }) open = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createTooltipBehavior()
  private sync: ControlledSync<boolean> | null = null

  get api(): TooltipApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    tooltipContext.set(this.host, this)
    this.sync = createControlledSync<boolean>({
      host: this.host,
      eventName: 'open-change',
      setMachineValue: (v) => this.behavior.api?.setOpen(v),
      setBindable: (v) => (this.open = v),
    })
    this.behavior.init({
      id: createId('tooltip'),
      defaultOpen: this.open,
      onOpenChange: (d: { open: boolean }) => this.sync?.fromMachine(d.open),
    })
  }

  attached(): void {
    this.behavior.start()
  }

  openChanged(v: boolean): void {
    this.sync?.fromBindable(v)
  }

  detaching(): void {
    this.behavior.stop()
    tooltipContext.delete(this.host)
  }
}
