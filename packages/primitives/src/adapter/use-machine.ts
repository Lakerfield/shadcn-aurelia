/**
 * Spike A — Zag ↔ Aurelia adapter.
 *
 * Wraps `@zag-js/vanilla`'s `VanillaMachine` in Aurelia's lifecycle:
 *   binding()   → init(machine, props)
 *   attached()  → start() then subscribe(listener)
 *   detaching() → stop()
 *
 * The adapter is intentionally non-generic (uses `any`) for Phase 0 ergonomics;
 * Phase 1 will add proper typed facades in packages/primitives/src/{tooltip,menu,…}.
 */
import { VanillaMachine } from '@zag-js/vanilla'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMachine = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyService = any

export class ZagMachineAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private vm: VanillaMachine<any> | null = null
  private unsubFromVm: (() => void) | null = null

  init(machine: AnyMachine, props: Record<string, unknown> = {}): void {
    this.vm = new VanillaMachine(machine, props)
  }

  start(): void {
    if (!this.vm) throw new Error('ZagMachineAdapter: call init() before start()')
    this.vm.start()
  }

  stop(): void {
    this.unsubFromVm?.()
    this.unsubFromVm = null
    this.vm?.stop()
    this.vm = null
  }

  get send(): (event: AnyService) => void {
    if (!this.vm) throw new Error('ZagMachineAdapter: call start() before send')
    return this.vm.send
  }

  get service(): AnyService {
    if (!this.vm) throw new Error('ZagMachineAdapter: call start() before service')
    return this.vm.service
  }

  /** Subscribe to state transitions. Emits once immediately on subscribe. Returns unsubscribe. */
  subscribe(listener: (service: AnyService) => void): () => void {
    if (!this.vm) throw new Error('ZagMachineAdapter: call start() before subscribe()')
    // vm.subscribe fires on every transition
    this.unsubFromVm = this.vm.subscribe(listener)
    // Emit initial service so callers build the first API immediately
    listener(this.vm.service)
    return () => {
      this.unsubFromVm?.()
      this.unsubFromVm = null
    }
  }
}

export { normalizeProps } from '@zag-js/vanilla'
