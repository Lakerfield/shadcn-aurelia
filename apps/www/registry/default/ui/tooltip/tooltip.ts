/**
 * ui-tooltip — root compound element.
 *
 * Owns the Zag tooltip machine and registers itself as compound context so
 * trigger/content resolve it via DOM traversal. Supports controlled and
 * uncontrolled open state per the shadcn idiom:
 *   <ui-tooltip open.two-way="isOpen">      (controlled)
 *   <ui-tooltip open-change.trigger="...">  (event-style)
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { machine as tooltipMachine, connect } from '@zag-js/tooltip'
import type { Service as TooltipService } from '@zag-js/tooltip'
import {
  ZagMachineAdapter,
  normalizeProps,
  createContext,
  createId,
  createControlledSync,
  type ControlledSync,
} from '@shadcn-aurelia/primitives'

export const tooltipContext = createContext<UiTooltip>()

type TooltipApi = ReturnType<typeof connect>
type Listener = () => void

// Inline template: no .html file → no convention $au.ts double-define.
@customElement({ name: 'ui-tooltip', template: '<au-slot></au-slot>' })
export class UiTooltip {
  /** Controlled open state (two-way). Leave unbound for uncontrolled use. */
  @bindable() open?: boolean

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly adapter = new ZagMachineAdapter()
  private openSync: ControlledSync<boolean> | null = null

  api: TooltipApi | null = null
  private listeners = new Set<Listener>()
  private unsubscribeAdapter: (() => void) | null = null

  binding(): void {
    tooltipContext.set(this.host, this)
    this.adapter.init(tooltipMachine, {
      id: createId('tooltip'),
      defaultOpen: this.open ?? false,
    })
    this.openSync = createControlledSync<boolean>({
      host: this.host,
      eventName: 'open-change',
      setMachineValue: (open) => this.api?.setOpen(open),
      setBindable: (open) => (this.open = open),
    })
  }

  attached(): void {
    this.adapter.start()
    let prevOpen: boolean | undefined
    this.unsubscribeAdapter = this.adapter.subscribe((service: TooltipService) => {
      this.api = connect(service, normalizeProps)
      // Only notify child components when open state changes, not on every
      // pointermove context update (Zag updates positioning context on every move).
      const open = this.api.open
      if (open !== prevOpen) {
        prevOpen = open
        this.openSync?.fromMachine(open)
        this.listeners.forEach((l) => l())
      }
    })
  }

  openChanged(value: boolean | undefined): void {
    this.openSync?.fromBindable(value)
  }

  detaching(): void {
    this.unsubscribeAdapter?.()
    this.unsubscribeAdapter = null
    this.adapter.stop()
    tooltipContext.delete(this.host)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}
