/**
 * Native tooltip engine — the first Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/tooltip` behind the facade: the prop bags
 * (`getTriggerProps`/`getPositionerProps`/`getContentProps`) emit the exact
 * attribute, ARIA, style and event contract the Zag connect produced (keys
 * pre-normalized the way `@zag-js/vanilla` would), verified by the
 * dual-engine test suite in `test/tooltip.spec.ts`.
 *
 * Behavior model (same states as the Zag machine):
 *   closed → opening (pointer enters, cold)      — openDelay timer
 *   opening → open   (delay elapses / focus)
 *   open → closing   (pointer leaves)            — closeDelay timer
 *   closing → open   (pointer returns)
 * A module-level store keeps at most one tooltip visible and makes a switch
 * between adjacent triggers instant ("warm" tooltips, `data-instant`).
 *
 * Not ported (unused by the registry component): multi-trigger `triggerValue`
 * support, arrow parts, and Zag's controlled `open` prop — the Aurelia layer
 * controls via `setOpen()` + `onOpenChange`.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import {
  ensureInteractionModalityTracking,
  isFocusVisible,
} from '../internal/interaction-modality'
import {
  getFloatingStyleString,
  getOverflowAncestors,
  getPlacementSide,
  trackPlacement,
  type Placement,
  type PositioningOptions,
} from './positioning'

/* ------------------------------------------------------------------ store */

interface TooltipStoreState {
  id: string | null
  prevId: string | null
  instant: boolean
}

const storeState: TooltipStoreState = { id: null, prevId: null, instant: false }
const storeSubscribers = new Set<() => void>()

const tooltipStore = {
  get: <K extends keyof TooltipStoreState>(key: K): TooltipStoreState[K] => storeState[key],
  update(partial: Partial<TooltipStoreState>): void {
    Object.assign(storeState, partial)
    storeSubscribers.forEach((fn) => fn())
  },
  subscribe(fn: () => void): () => void {
    storeSubscribers.add(fn)
    return () => storeSubscribers.delete(fn)
  },
}

/* ------------------------------------------------------------------ types */

// type alias (not interface) so it stays assignable to Record<string, unknown>,
// which is what the shared ZagBehavior.init signature takes
export type TooltipProps = {
  /** Unique machine id — element ids derive from it (`tooltip:{id}:trigger`). */
  id: string
  dir?: 'ltr' | 'rtl'
  defaultOpen?: boolean
  openDelay?: number
  closeDelay?: number
  closeOnEscape?: boolean
  closeOnClick?: boolean
  closeOnPointerDown?: boolean
  closeOnScroll?: boolean
  interactive?: boolean
  disabled?: boolean
  'aria-label'?: string
  positioning?: PositioningOptions
  onOpenChange?: (details: { open: boolean }) => void
}

export interface TooltipApi {
  open: boolean
  setOpen(open: boolean): void
  reposition(options?: PositioningOptions): void
  getTriggerProps(): Record<string, unknown>
  getPositionerProps(): Record<string, unknown>
  getContentProps(): Record<string, unknown>
}

type TooltipState = 'closed' | 'opening' | 'open' | 'closing'

interface ResolvedTooltipProps extends Omit<TooltipProps, 'positioning'> {
  openDelay: number
  closeDelay: number
  closeOnEscape: boolean
  closeOnClick: boolean
  closeOnPointerDown: boolean
  closeOnScroll: boolean
  interactive: boolean
  disabled: boolean
  positioning: PositioningOptions & { placement: Placement }
}

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

/* --------------------------------------------------------------- behavior */

export class NativeTooltipBehavior implements BehaviorSource<TooltipApi> {
  api: TooltipApi | null = null

  private props!: ResolvedTooltipProps
  private state: TooltipState = 'closed'
  private currentPlacement: Placement | undefined
  private hasPointerMoveOpened = false
  private readonly listeners = new Set<() => void>()
  private stateCleanups: Array<() => void> = []
  private storeUnsub: (() => void) | null = null
  private started = false

  init(props: TooltipProps): void {
    if (!props.id) throw new Error('[tooltip] `id` is required')
    const closeOnClick = props.closeOnClick ?? true
    this.props = {
      openDelay: 400,
      closeDelay: 150,
      closeOnEscape: true,
      interactive: false,
      closeOnScroll: true,
      disabled: false,
      ...props,
      closeOnClick,
      closeOnPointerDown: props.closeOnPointerDown ?? closeOnClick,
      positioning: {
        placement: 'bottom',
        ...props.positioning,
      } as ResolvedTooltipProps['positioning'],
    }
  }

  updateProps(props: Partial<TooltipProps>): void {
    const wasDisabled = this.props.disabled
    this.props = {
      ...this.props,
      ...props,
      positioning: {
        ...this.props.positioning,
        ...props.positioning,
      } as ResolvedTooltipProps['positioning'],
    }
    if (!wasDisabled && this.props.disabled) this.close()
  }

  start(): void {
    if (this.started) return
    this.started = true
    ensureInteractionModalityTracking()
    this.api = this.buildApi()
    this.storeUnsub = tooltipStore.subscribe(() => {
      if (tooltipStore.get('id') !== this.props.id) this.close()
    })
    if (this.props.defaultOpen) this.enter('open')
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.disposeStateEffects()
    this.storeUnsub?.()
    this.storeUnsub = null
    if (this.state === 'open' || this.state === 'closing') this.clearGlobalId()
    this.state = 'closed'
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

  private get isOpen(): boolean {
    // like Zag: the content stays visible while `closing`
    return this.state === 'open' || this.state === 'closing'
  }

  private transition(next: TooltipState): void {
    if (!this.started) return
    this.disposeStateEffects()
    this.enter(next)
    this.notify()
  }

  private enter(next: TooltipState): void {
    this.state = next
    switch (next) {
      case 'closed':
        this.clearGlobalId()
        break
      case 'opening':
        this.stateCleanups.push(this.trackScroll(), this.trackPointerlock(), this.startTimer('open'))
        break
      case 'open':
        this.setGlobalId()
        this.stateCleanups.push(
          this.trackEscape(),
          this.trackScroll(),
          this.trackPointerlock(),
          this.trackPositioning(),
        )
        break
      case 'closing':
        this.stateCleanups.push(this.trackPositioning(), this.startTimer('close'))
        break
    }
  }

  private disposeStateEffects(): void {
    this.stateCleanups.forEach((fn) => fn())
    this.stateCleanups = []
  }

  /** "open" event: programmatic setOpen(true) or focus-visible focus. */
  private open(): void {
    if (this.state === 'closed' || this.state === 'opening') {
      this.invokeOnOpen()
      this.transition('open')
    }
  }

  /** "close" event: Escape, scroll, click, blur, store change, setOpen(false). */
  private close(): void {
    if (this.state === 'opening' || this.state === 'open' || this.state === 'closing') {
      this.invokeOnClose()
      this.transition('closed')
    }
  }

  private pointerMove(): void {
    if (this.state === 'closed') {
      if (this.hasPointerMoveOpened) return
      if (tooltipStore.get('id') === null) {
        this.transition('opening')
      } else {
        // another tooltip is visible → switch instantly (warm tooltips)
        this.hasPointerMoveOpened = true
        this.invokeOnOpen()
        this.transition('open')
      }
    } else if (this.state === 'closing') {
      this.hasPointerMoveOpened = true
      this.invokeOnOpen()
      this.transition('open')
    }
  }

  private pointerLeave(): void {
    if (this.state === 'closed') {
      this.hasPointerMoveOpened = false
    } else if (this.state === 'opening') {
      this.hasPointerMoveOpened = false
      this.invokeOnClose()
      this.transition('closed')
    } else if (this.state === 'open') {
      this.hasPointerMoveOpened = false
      if (tooltipStore.get('id') === this.props.id) {
        this.transition('closing')
      } else {
        this.invokeOnClose()
        this.transition('closed')
      }
    }
  }

  private startTimer(kind: 'open' | 'close'): () => void {
    const delay = kind === 'open' ? this.props.openDelay : this.props.closeDelay
    const id = setTimeout(() => {
      if (kind === 'open') {
        this.hasPointerMoveOpened = true
        this.invokeOnOpen()
        this.transition('open')
      } else {
        this.invokeOnClose()
        this.transition('closed')
      }
    }, delay)
    return () => clearTimeout(id)
  }

  private invokeOnOpen(): void {
    this.props.onOpenChange?.({ open: true })
  }

  private invokeOnClose(): void {
    this.props.onOpenChange?.({ open: false })
  }

  private setGlobalId(): void {
    const prevId = tooltipStore.get('id')
    const isInstant = prevId !== null && prevId !== this.props.id
    tooltipStore.update({ id: this.props.id, prevId: isInstant ? prevId : null, instant: isInstant })
  }

  private clearGlobalId(): void {
    if (tooltipStore.get('id') === this.props.id) {
      tooltipStore.update({ id: null, prevId: null, instant: false })
    }
  }

  /* ------------------------------------------------------------- effects */

  private trackEscape(): () => void {
    if (!this.props.closeOnEscape) return () => {}
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return
      if (event.key !== 'Escape') return
      event.stopPropagation()
      this.close()
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }

  private trackScroll(): () => void {
    if (!this.props.closeOnScroll) return () => {}
    const triggerEl = this.getTriggerEl()
    if (!triggerEl) return () => {}
    const onScroll = () => this.close()
    const ancestors = getOverflowAncestors(triggerEl)
    ancestors.forEach((ancestor) =>
      ancestor.addEventListener('scroll', onScroll, { passive: true, capture: true }),
    )
    return () =>
      ancestors.forEach((ancestor) =>
        ancestor.removeEventListener('scroll', onScroll, { capture: true }),
      )
  }

  private trackPointerlock(): () => void {
    const onChange = () => this.close()
    document.addEventListener('pointerlockchange', onChange, false)
    return () => document.removeEventListener('pointerlockchange', onChange, false)
  }

  private trackPositioning(overrides?: PositioningOptions): () => void {
    if (!this.currentPlacement) {
      this.currentPlacement = this.props.positioning.placement
    }
    return trackPlacement(
      () => this.getTriggerEl(),
      () => this.getPositionerEl(),
      {
        ...this.props.positioning,
        ...overrides,
        defer: true,
        onComplete: ({ placement }) => {
          if (this.currentPlacement !== placement) {
            this.currentPlacement = placement
            this.notify()
          }
        },
      },
    )
  }

  /* ----------------------------------------------------------------- dom */

  private get triggerId(): string {
    return `tooltip:${this.props.id}:trigger`
  }
  private get contentId(): string {
    return `tooltip:${this.props.id}:content`
  }
  private get positionerId(): string {
    return `tooltip:${this.props.id}:popper`
  }
  private getTriggerEl(): HTMLElement | null {
    return document.getElementById(this.triggerId)
  }
  private getPositionerEl(): HTMLElement | null {
    return document.getElementById(this.positionerId)
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): TooltipApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return {
      get open() {
        return self.isOpen
      },
      setOpen(nextOpen: boolean) {
        if (self.isOpen === nextOpen) return
        if (nextOpen) self.open()
        else self.close()
      },
      reposition(options = {}) {
        if (self.state !== 'open' && self.state !== 'closing') return
        // one-shot: listeners:false attaches nothing, so the cleanup is moot
        trackPlacement(
          () => self.getTriggerEl(),
          () => self.getPositionerEl(),
          {
            ...self.props.positioning,
            ...options,
            listeners: false,
            onComplete: ({ placement }) => {
              if (self.currentPlacement !== placement) {
                self.currentPlacement = placement
                self.notify()
              }
            },
          },
        )
      },
      getTriggerProps() {
        const open = self.isOpen
        return {
          'data-scope': 'tooltip',
          'data-part': 'trigger',
          id: self.triggerId,
          'data-ownedby': self.props.id,
          dir: self.props.dir,
          'data-expanded': dataAttr(open),
          'data-state': open ? 'open' : 'closed',
          'aria-describedby': open ? self.contentId : undefined,
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            if (self.props.disabled) return
            if (!self.props.closeOnClick) return
            self.close()
          },
          onfocusin(event: FocusEvent) {
            if (event.defaultPrevented) return
            if (self.props.disabled) return
            if (!isFocusVisible()) return
            self.open()
          },
          onfocusout(event: FocusEvent) {
            if (event.defaultPrevented) return
            if (self.props.disabled) return
            if (self.props.id !== tooltipStore.get('id')) return
            const activeEl = (event.relatedTarget ?? document.activeElement) as HTMLElement | null
            const focusedAnotherTrigger =
              activeEl?.closest(`[data-ownedby="${self.props.id}"]`) != null
            if (!focusedAnotherTrigger) self.close()
          },
          onpointerdown(event: PointerEvent) {
            if (event.defaultPrevented) return
            if (self.props.disabled) return
            if (event.button !== 0) return
            if (!self.props.closeOnPointerDown) return
            if (self.props.id === tooltipStore.get('id')) self.close()
          },
          onpointermove(event: PointerEvent) {
            if (event.defaultPrevented) return
            if (self.props.disabled) return
            if (event.pointerType === 'touch') return
            self.pointerMove()
          },
          onpointerover(event: PointerEvent) {
            if (event.defaultPrevented) return
            if (self.props.disabled) return
            if (event.pointerType === 'touch') return
            self.pointerMove()
          },
          onpointerleave() {
            if (self.props.disabled) return
            self.pointerLeave()
          },
          onpointercancel() {
            if (self.props.disabled) return
            self.pointerLeave()
          },
        }
      },
      getPositionerProps() {
        return {
          id: self.positionerId,
          'data-scope': 'tooltip',
          'data-part': 'positioner',
          dir: self.props.dir,
          style: getFloatingStyleString(self.currentPlacement, self.props.positioning),
        }
      },
      getContentProps() {
        const open = self.isOpen
        const hasAriaLabel = !!self.props['aria-label']
        const isCurrent = tooltipStore.get('id') === self.props.id
        const isPrev = tooltipStore.get('prevId') === self.props.id
        const instant = tooltipStore.get('instant') && ((open && isCurrent) || isPrev)
        return {
          'data-scope': 'tooltip',
          'data-part': 'content',
          dir: self.props.dir,
          hidden: !open,
          'data-state': open ? 'open' : 'closed',
          'data-instant': dataAttr(instant),
          role: hasAriaLabel ? undefined : 'tooltip',
          id: hasAriaLabel ? undefined : self.contentId,
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          onpointerenter() {
            // "content.pointer.move": re-open only while closing + interactive
            if (self.state === 'closing' && self.props.interactive) self.transition('open')
          },
          onpointerleave() {
            if (self.state === 'open' && self.props.interactive) self.transition('closing')
          },
          style: `pointer-events:${self.props.interactive ? 'auto' : 'none'};`,
        }
      },
    }
  }
}

export const createNativeTooltipBehavior = (): NativeTooltipBehavior => new NativeTooltipBehavior()
