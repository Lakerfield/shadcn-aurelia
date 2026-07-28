/**
 * jsdom lacks the observers floating-ui's autoUpdate relies on; positions all
 * compute to the same deterministic zeros for both engines, which is exactly
 * what the dual-engine contract tests need.
 */
class ObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): never[] {
    return []
  }
}

globalThis.ResizeObserver ??= ObserverStub as unknown as typeof ResizeObserver
globalThis.IntersectionObserver ??= ObserverStub as unknown as typeof IntersectionObserver

// jsdom has no CSS global; both engines escape machine ids in selectors
globalThis.CSS ??= {} as typeof CSS
globalThis.CSS.escape ??= (value: string) =>
  String(value).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)

// jsdom implements neither Element scrolling API; both engines call them
// (select scrolls the content back to top on close, and the highlighted
// option into view on keyboard navigation)
Element.prototype.scrollTo ??= () => {}
Element.prototype.scrollIntoView ??= () => {}
