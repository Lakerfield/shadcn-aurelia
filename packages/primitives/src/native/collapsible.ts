/**
 * Native collapsible engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/collapsible` behind the facade: the prop
 * bags emit the exact attribute, ARIA, style and event contract the Zag
 * connect produced (keys pre-normalized the way `@zag-js/vanilla` would),
 * verified by the dual-engine suite in `test/collapsible.spec.ts`.
 *
 * Behavior model (same states as the Zag machine):
 *   closed → open     (trigger click / setOpen(true)) — size measured first
 *   open → closing    (close requested)               — exit animation runs out
 *   closing → closed  (animationend, or no animation)
 * The content element keeps `--height`/`--width` CSS vars (measured with
 * animations suppressed) so the tw-preset accordion-up/down keyframes can
 * animate to the natural size. `data-state` is present on open content only
 * while an animation may run: Zag's `initial` flag clears on animation end and
 * the connect then omits `data-state` (`skip`), which this engine replicates.
 *
 * Not ported (unused by the registry component): controlled `open` prop,
 * `collapsedHeight`/`collapsedWidth` partial collapse (incl. the inert
 * tracking of tabbables inside a partially collapsed content).
 */
import type { BehaviorSource } from '../adapter/zag-behavior'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type CollapsibleProps = {
  /** Unique machine id — element ids derive from it (`collapsible:{id}`). */
  id: string
  dir?: 'ltr' | 'rtl'
  defaultOpen?: boolean
  disabled?: boolean
  onOpenChange?: (details: { open: boolean }) => void
  onExitComplete?: () => void
}

export interface CollapsibleApi {
  disabled: boolean
  visible: boolean
  open: boolean
  measureSize(): void
  setOpen(open: boolean): void
  getRootProps(): Record<string, unknown>
  getContentProps(): Record<string, unknown>
  getTriggerProps(): Record<string, unknown>
  getIndicatorProps(): Record<string, unknown>
}

type CollapsibleState = 'closed' | 'closing' | 'open'

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

/** Zag's `raf` helper: one animation frame, cancellable. */
const raf = (fn: () => void): (() => void) => {
  const id = requestAnimationFrame(fn)
  return () => cancelAnimationFrame(id)
}

export class NativeCollapsibleBehavior implements BehaviorSource<CollapsibleApi> {
  api: CollapsibleApi | null = null

  private props!: CollapsibleProps
  private state: CollapsibleState = 'closed'
  private size: { width: number; height: number } = { width: 0, height: 0 }
  /** Zag's `initial` flag: true while a user-triggered transition may animate. */
  private initial = false
  private readonly listeners = new Set<() => void>()
  private stateCleanups: Array<() => void> = []
  private measureCleanup: (() => void) | null = null
  private started = false

  init(props: CollapsibleProps): void {
    if (!props.id) throw new Error('[collapsible] `id` is required')
    this.props = { ...props }
  }

  updateProps(props: Partial<CollapsibleProps>): void {
    this.props = { ...this.props, ...props }
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.api = this.buildApi()
    this.state = this.props.defaultOpen ? 'open' : 'closed'
    // like Zag: entering `open` on mount tracks the enter animation, but with
    // `initial` still false the content carries no data-state (no mount flash)
    if (this.state === 'open') this.enterEffects()
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.disposeStateEffects()
    this.measureCleanup?.()
    this.measureCleanup = null
    this.state = 'closed'
    this.initial = false
    this.api = null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify(): void {
    this.listeners.forEach((l) => l())
  }

  /* ------------------------------------------------------------- machine */

  private transition(next: CollapsibleState): void {
    if (!this.started) return
    this.disposeStateEffects()
    this.state = next
    this.enterEffects()
    this.notify()
  }

  private enterEffects(): void {
    if (this.state === 'open' || this.state === 'closing') {
      this.stateCleanups.push(this.trackAnimation(this.state))
    }
  }

  private disposeStateEffects(): void {
    this.stateCleanups.forEach((fn) => fn())
    this.stateCleanups = []
  }

  /** "open" event (closed or closing state). */
  private open(): void {
    if (this.state === 'closed') {
      this.initial = true
      this.computeSize()
      this.props.onOpenChange?.({ open: true })
      this.transition('open')
    } else if (this.state === 'closing') {
      this.initial = true
      this.props.onOpenChange?.({ open: true })
      this.transition('open')
    }
  }

  /** "close" event (open or closing state). */
  private close(): void {
    if (this.state === 'open') {
      this.initial = true
      this.computeSize()
      this.props.onOpenChange?.({ open: false })
      this.transition('closing')
    } else if (this.state === 'closing') {
      // a second close while the exit animation runs jumps straight to closed
      this.initial = true
      this.computeSize()
      this.props.onExitComplete?.()
      this.transition('closed')
    }
  }

  private onAnimationEnd(): void {
    if (this.state === 'closing') {
      this.props.onExitComplete?.()
      this.initial = false
      this.transition('closed')
    } else if (this.state === 'open') {
      this.initial = false
      this.notify()
    }
  }

  /* ------------------------------------------------------------- effects */

  /**
   * Zag's trackEnterAnimation/trackExitAnimation: wait a frame, then either
   * finish immediately (no CSS animation) or wait for `animationend` on the
   * content. Exit animations get `animation-fill-mode: forwards` so the
   * content holds its final frame until the state flips to closed.
   */
  private trackAnimation(kind: 'open' | 'closing'): () => void {
    let cleanup: (() => void) | undefined
    const rafCleanup = raf(() => {
      const contentEl = this.getContentEl()
      if (!contentEl) return
      const animationName = getComputedStyle(contentEl).animationName
      if (!animationName || animationName === 'none') {
        this.onAnimationEnd()
        return
      }
      const onEnd = (event: AnimationEvent) => {
        if (event.target === contentEl) this.onAnimationEnd()
      }
      contentEl.addEventListener('animationend', onEnd)
      if (kind === 'closing') {
        const prevFillMode = contentEl.style.animationFillMode
        contentEl.style.animationFillMode = 'forwards'
        cleanup = () => {
          contentEl.removeEventListener('animationend', onEnd)
          setTimeout(() => {
            contentEl.style.animationFillMode = prevFillMode
          }, 0)
        }
      } else {
        cleanup = () => contentEl.removeEventListener('animationend', onEnd)
      }
    })
    return () => {
      rafCleanup()
      cleanup?.()
    }
  }

  /**
   * Measure the natural content size with animations suppressed and the
   * element unhidden, exactly like Zag's computeSize action, so `--height`
   * and `--width` are correct before the animation reads them.
   */
  private computeSize(): void {
    this.measureCleanup?.()
    this.measureCleanup = raf(() => {
      const contentEl = this.getContentEl()
      if (!contentEl) return
      const hidden = contentEl.hidden
      contentEl.style.animationName = 'none'
      contentEl.style.animationDuration = '0s'
      contentEl.hidden = false
      const rect = contentEl.getBoundingClientRect()
      this.size = { height: rect.height, width: rect.width }
      if (this.initial) {
        contentEl.style.animationName = ''
        contentEl.style.animationDuration = ''
      }
      contentEl.hidden = hidden
      this.notify()
    })
  }

  /* ----------------------------------------------------------------- dom */

  private get rootId(): string {
    return `collapsible:${this.props.id}`
  }
  private get contentId(): string {
    return `collapsible:${this.props.id}:content`
  }
  private get triggerId(): string {
    return `collapsible:${this.props.id}:trigger`
  }
  private getContentEl(): HTMLElement | null {
    return document.getElementById(this.contentId)
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): CollapsibleApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return {
      get disabled() {
        return !!self.props.disabled
      },
      get visible() {
        return self.state === 'open' || self.state === 'closing'
      },
      get open() {
        return self.state === 'open'
      },
      measureSize() {
        if (self.state !== 'open') return
        const contentEl = self.getContentEl()
        if (!contentEl) return
        const { height, width } = contentEl.getBoundingClientRect()
        self.size = { height, width }
        self.notify()
      },
      setOpen(nextOpen: boolean) {
        const open = self.state === 'open'
        if (open === nextOpen) return
        if (nextOpen) self.open()
        else self.close()
      },
      getRootProps() {
        return {
          'data-scope': 'collapsible',
          'data-part': 'root',
          'data-state': self.state === 'open' ? 'open' : 'closed',
          dir: self.props.dir,
          id: self.rootId,
        }
      },
      getContentProps() {
        const open = self.state === 'open'
        const visible = open || self.state === 'closing'
        const skip = !self.initial && open
        return {
          'data-scope': 'collapsible',
          'data-part': 'content',
          id: self.contentId,
          'data-collapsible': '',
          'data-state': skip ? undefined : open ? 'open' : 'closed',
          'data-disabled': dataAttr(!!self.props.disabled),
          hidden: !visible,
          dir: self.props.dir,
          style: `--height:${self.size.height}px;--width:${self.size.width}px;`,
        }
      },
      getTriggerProps() {
        const open = self.state === 'open'
        const visible = open || self.state === 'closing'
        return {
          'data-scope': 'collapsible',
          'data-part': 'trigger',
          id: self.triggerId,
          dir: self.props.dir,
          type: 'button',
          'data-state': open ? 'open' : 'closed',
          'data-disabled': dataAttr(!!self.props.disabled),
          'aria-controls': self.contentId,
          'aria-expanded': visible || false,
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            if (self.props.disabled) return
            if (self.state === 'open') self.close()
            else self.open()
          },
        }
      },
      getIndicatorProps() {
        return {
          'data-scope': 'collapsible',
          'data-part': 'indicator',
          dir: self.props.dir,
          'data-state': self.state === 'open' ? 'open' : 'closed',
          'data-disabled': dataAttr(!!self.props.disabled),
        }
      },
    }
  }
}

export const createNativeCollapsibleBehavior = (): NativeCollapsibleBehavior =>
  new NativeCollapsibleBehavior()
