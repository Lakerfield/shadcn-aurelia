/**
 * ui-tooltip — root compound element.
 *
 * Spikes exercised:
 *   A  Creates and manages a Zag tooltip machine via ZagMachineAdapter
 *   C  Registers itself as the compound context so trigger/content can resolve it
 */
import { customElement, INode, resolve } from 'aurelia'
import { machine as tooltipMachine, connect } from '@zag-js/tooltip'
import type { Service as TooltipService } from '@zag-js/tooltip'
import { normalizeProps } from '@zag-js/vanilla'
import { ZagMachineAdapter, createContext } from '@shadcn-aurelia/primitives'

export const tooltipContext = createContext<UiTooltip>()

let idCounter = 0

type TooltipApi = ReturnType<typeof connect>
type Listener = () => void

// Inline template: no .html file → no convention $au.ts double-define.
@customElement({ name: 'ui-tooltip', template: '<au-slot></au-slot>' })
export class UiTooltip {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly adapter = new ZagMachineAdapter()

  api: TooltipApi | null = null
  private listeners = new Set<Listener>()
  private unsubscribeAdapter: (() => void) | null = null

  binding(): void {
    tooltipContext.set(this.host, this)
    this.adapter.init(tooltipMachine, { id: `tooltip-${++idCounter}` })
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
        this.listeners.forEach((l) => l())
      }
    })
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
