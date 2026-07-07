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
