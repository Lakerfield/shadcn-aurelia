/**
 * ZagBehavior — the per-component facade over a Zag machine (architecture §5.1).
 *
 * Registry components construct one via a `create*Behavior()` factory from
 * `behaviors/` and never import `@zag-js/*` directly, so a machine can later
 * be swapped for a native implementation without touching copied code.
 */
import { normalizeProps } from '@zag-js/vanilla'
import { ZagMachineAdapter } from './use-machine'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyService = any

export interface BehaviorSource<Api> {
  api: Api | null
  subscribe(listener: () => void): () => void
}

export class ZagBehavior<Api> implements BehaviorSource<Api> {
  api: Api | null = null

  private readonly adapter = new ZagMachineAdapter()
  private readonly listeners = new Set<() => void>()

  constructor(
    private readonly machineDef: unknown,
    private readonly connectFn: (service: AnyService, np: typeof normalizeProps) => Api,
  ) {}

  init(props: Record<string, unknown>): void {
    this.adapter.init(this.machineDef, props)
  }

  start(): void {
    this.adapter.start()
    this.adapter.subscribe((service: AnyService) => {
      this.api = this.connectFn(service, normalizeProps)
      this.listeners.forEach((l) => l())
    })
  }

  stop(): void {
    this.adapter.stop()
    this.api = null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

/**
 * Wires one DOM element to a Zag prop-bag and keeps it in sync by DIFFING on
 * every machine transition:
 *   • event listeners are attached ONCE per event via a stable wrapper that
 *     dispatches to the latest handler — no listener churn mid-interaction
 *     (churn breaks focus/drag/keyboard state)
 *   • attributes are only written when their value actually changed, and
 *     removed when they disappear from the bag
 * Returns a dispose function.
 */
export function bindPart<Api>(
  source: BehaviorSource<Api>,
  element: HTMLElement,
  getProps: (api: Api) => Record<string, unknown> | null | undefined,
): () => void {
  const latestHandlers = new Map<string, EventListener>()
  const wrappers = new Map<string, EventListener>()
  let appliedAttrs = new Set<string>()

  const apply = () => {
    const props = (source.api ? getProps(source.api) : null) ?? {}
    const nextAttrs = new Set<string>()

    for (const [key, val] of Object.entries(props)) {
      if (val === null || val === undefined) continue

      if (typeof val === 'function' && /^on[a-z]/i.test(key)) {
        const event = key.slice(2).toLowerCase()
        latestHandlers.set(event, val as EventListener)
        if (!wrappers.has(event)) {
          const wrapper: EventListener = (e) => latestHandlers.get(event)?.(e)
          wrappers.set(event, wrapper)
          element.addEventListener(event, wrapper)
        }
        continue
      }

      // boolean: aria-* serializes tri-state; other attrs are presence-based
      let str: string | null
      if (typeof val === 'boolean') {
        str = key.startsWith('aria-') ? String(val) : val ? '' : null
      } else {
        str = String(val)
      }

      if (str === null) {
        if (element.hasAttribute(key)) element.removeAttribute(key)
        continue
      }
      nextAttrs.add(key)
      if (element.getAttribute(key) !== str) element.setAttribute(key, str)
    }

    for (const key of appliedAttrs) {
      if (!nextAttrs.has(key)) element.removeAttribute(key)
    }
    appliedAttrs = nextAttrs
  }

  apply()
  const unsubscribe = source.subscribe(apply)
  return () => {
    unsubscribe()
    wrappers.forEach((wrapper, event) => element.removeEventListener(event, wrapper))
    wrappers.clear()
    latestHandlers.clear()
    appliedAttrs.forEach((key) => element.removeAttribute(key))
    appliedAttrs.clear()
  }
}
