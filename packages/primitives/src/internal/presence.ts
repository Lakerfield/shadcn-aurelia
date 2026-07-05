/**
 * Presence — keep an element mounted until its exit animation finishes.
 *
 * shadcn styles animate on `data-state="closed"` (`data-[state=closed]:animate-out`).
 * If we unmount/hide the moment state flips, the exit animation never plays.
 * `waitForExitAnimations` resolves when all running CSS animations/transitions
 * on the element (subtree included) have finished — call it after setting
 * `data-state="closed"` and before hiding/removing the element.
 */

export async function waitForExitAnimations(el: HTMLElement): Promise<void> {
  if (typeof el.getAnimations !== 'function') return // jsdom / old browsers
  const animations = el.getAnimations({ subtree: true })
  if (animations.length === 0) return
  await Promise.allSettled(animations.map((a) => a.finished))
}

/**
 * Tracks open/close and flips `hidden` only after exit animations complete.
 * A monotonically increasing token discards stale transitions when the state
 * flips again mid-animation (rapid hover on/off).
 */
export class Presence {
  private token = 0

  constructor(private readonly el: HTMLElement) {}

  /** Sync presence to `open`. Resolves when the DOM reflects the new state. */
  async setOpen(open: boolean): Promise<void> {
    const current = ++this.token
    if (open) {
      this.el.hidden = false
      this.el.dataset.state = 'open'
      return
    }
    this.el.dataset.state = 'closed'
    await waitForExitAnimations(this.el)
    if (this.token !== current) return // reopened mid-animation
    this.el.hidden = true
  }
}
