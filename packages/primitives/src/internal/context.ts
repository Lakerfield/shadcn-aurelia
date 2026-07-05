/**
 * Spike C — Compound-component context via DOM traversal.
 *
 * Root elements store a typed context value on their DOM node; descendant
 * elements walk `parentElement` to retrieve it.  This mirrors what React
 * Context does internally and is reliable in Aurelia's light-DOM model where
 * projected content shares the caller's DI container scope (not the host's).
 */

const CTX_MAP = Symbol('shadcn-aurelia:ctx')

export interface Context<T> {
  set(element: Element, value: T): void
  get(child: Element): T | undefined
  delete(element: Element): void
}

export function createContext<T>(): Context<T> {
  const key = Symbol()

  return {
    set(element: Element, value: T): void {
      const el = element as unknown as Record<symbol, Record<symbol, unknown>>
      el[CTX_MAP] ??= {}
      el[CTX_MAP][key] = value
    },

    get(child: Element): T | undefined {
      let el: Element | null = child
      while (el) {
        const bag = (el as unknown as Record<symbol, Record<symbol, unknown>>)[CTX_MAP]
        if (bag && key in bag) return bag[key] as T
        el = el.parentElement
      }
      return undefined
    },

    delete(element: Element): void {
      const bag = (element as unknown as Record<symbol, Record<symbol, unknown>>)[CTX_MAP]
      if (bag) delete bag[key]
    },
  }
}
