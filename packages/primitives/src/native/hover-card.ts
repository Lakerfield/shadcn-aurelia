/**
 * Native hover-card engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/hover-card` behind the facade: the prop
 * bags (trigger/positioner/content) emit the exact attribute, ARIA, style and
 * event contract the Zag connect produced (keys pre-normalized the way
 * `@zag-js/vanilla` would), verified by the dual-engine suite in
 * `test/hover-card.spec.ts`.
 *
 * Behavior model (same states as the Zag machine):
 *   closed → opening  (pointer enters / trigger focus) — openDelay timer (600)
 *   opening → open    (delay elapses)
 *   open → closing    (pointer leaves)                 — closeDelay timer (300)
 *   closing → open    (pointer returns / trigger focus)
 * The content stays visible while `closing` (Zag's "open" tag covers both).
 * An `isPointer` flag distinguishes hover- from focus-activation: trigger
 * blur only closes a focus-opened card. While open, a dismissable layer
 * handles Escape and outside press (focus moving outside does NOT dismiss —
 * Zag preventDefaults focus-outside), and floating-ui tracks placement in
 * the open and closing states.
 *
 * Note: programmatic `setOpen(true)` also goes through the opening delay —
 * that is Zag's semantics (`OPEN` targets the `opening` state).
 *
 * Not ported (unused by the registry component): multi-trigger
 * `triggerValue`, arrow parts, the controlled `open` prop.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import { createDismissableLayer } from '../internal/dismissable-layer'
import {
  getFloatingStyleString,
  getPlacementSide,
  trackPlacement,
  type Placement,
  type PositioningOptions,
} from './positioning'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type HoverCardProps = {
  /** Unique machine id — element ids derive from it (`hover-card:{id}:content`). */
  id: string
  dir?: 'ltr' | 'rtl'
  defaultOpen?: boolean
  disabled?: boolean
  openDelay?: number
  closeDelay?: number
  positioning?: PositioningOptions
  onOpenChange?: (details: { open: boolean }) => void
}

export interface HoverCardApi {
  open: boolean
  setOpen(open: boolean): void
  reposition(options?: PositioningOptions): void
  getTriggerProps(): Record<string, unknown>
  getPositionerProps(): Record<string, unknown>
  getContentProps(): Record<string, unknown>
}

type HoverCardState = 'closed' | 'opening' | 'open' | 'closing'

interface ResolvedHoverCardProps extends Omit<HoverCardProps, 'positioning'> {
  disabled: boolean
  openDelay: number
  closeDelay: number
  positioning: PositioningOptions & { placement: Placement }
}

export class NativeHoverCardBehavior implements BehaviorSource<HoverCardApi> {
  api: HoverCardApi | null = null

  private props!: ResolvedHoverCardProps
  private state: HoverCardState = 'closed'
  private currentPlacement: Placement | undefined
  private isPointer = false
  private readonly listeners = new Set<() => void>()
  private stateCleanups: Array<() => void> = []
  private started = false

  init(props: HoverCardProps): void {
    if (!props.id) throw new Error('[hover-card] `id` is required')
    this.props = {
      disabled: false,
      openDelay: 600,
      closeDelay: 300,
      ...props,
      positioning: {
        placement: 'bottom',
        ...props.positioning,
      } as ResolvedHoverCardProps['positioning'],
    }
  }

  updateProps(props: Partial<HoverCardProps>): void {
    const wasDisabled = this.props.disabled
    this.props = {
      ...this.props,
      ...props,
      positioning: {
        ...this.props.positioning,
        ...props.positioning,
      } as ResolvedHoverCardProps['positioning'],
    }
    if (!wasDisabled && this.props.disabled) this.close()
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.api = this.buildApi()
    if (this.props.defaultOpen) this.enter('open')
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.disposeStateEffects()
    this.state = 'closed'
    this.isPointer = false
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
    // Zag's "open" tag: the content stays visible while closing
    return this.state === 'open' || this.state === 'closing'
  }

  private transition(next: HoverCardState): void {
    if (!this.started) return
    this.disposeStateEffects()
    this.enter(next)
    this.notify()
  }

  private enter(next: HoverCardState): void {
    this.state = next
    switch (next) {
      case 'closed':
        this.isPointer = false
        break
      case 'opening':
        this.stateCleanups.push(this.startTimer('open'))
        break
      case 'open':
        this.stateCleanups.push(this.trackDismissable(), this.trackPositioning())
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

  private startTimer(kind: 'open' | 'close'): () => void {
    const delay = kind === 'open' ? this.props.openDelay : this.props.closeDelay
    const id = setTimeout(() => {
      this.invokeOnOpenChange(kind === 'open')
      this.transition(kind === 'open' ? 'open' : 'closed')
    }, delay)
    return () => clearTimeout(id)
  }

  private invokeOnOpenChange(open: boolean): void {
    this.props.onOpenChange?.({ open })
  }

  /** "OPEN" event: programmatic setOpen(true) — goes through the delay. */
  private open(): void {
    if (this.state === 'closed') this.transition('opening')
  }

  /** "CLOSE" event: Escape, outside press, setOpen(false), disabled flip. */
  private close(): void {
    // Zag's `closing` state has no CLOSE handler — the delay wins
    if (this.state === 'opening' || this.state === 'open') {
      this.invokeOnOpenChange(false)
      this.transition('closed')
    }
  }

  private pointerEnter(): void {
    // Zag's `opening` state has no POINTER_ENTER handler — isPointer only
    // flips in closed/open/closing
    if (this.state === 'opening') return
    this.isPointer = true
    if (this.state === 'closed') this.transition('opening')
    else if (this.state === 'closing') this.transition('open')
  }

  private pointerLeave(): void {
    if (this.state === 'opening') {
      this.invokeOnOpenChange(false)
      this.transition('closed')
    } else if (this.state === 'open') {
      this.transition('closing')
    }
  }

  private triggerFocus(): void {
    if (this.state === 'closed') this.transition('opening')
    else if (this.state === 'closing') this.transition('open')
  }

  private triggerBlur(): void {
    if (this.isPointer) return
    if (this.state === 'opening' || this.state === 'open') {
      this.invokeOnOpenChange(false)
      this.transition('closed')
    }
  }

  /* ------------------------------------------------------------- effects */

  private trackDismissable(): () => void {
    // deferred one frame (Zag `defer: true`) so bindPart has written the ids
    let dispose: (() => void) | null = null
    const frame = requestAnimationFrame(() => {
      const contentEl = this.getEl('content')
      if (!contentEl) return
      dispose = createDismissableLayer(contentEl, {
        onDismiss: () => this.close(),
        exclude: () => [this.getEl('trigger')],
      })
    })
    return () => {
      cancelAnimationFrame(frame)
      dispose?.()
    }
  }

  private trackPositioning(): () => void {
    if (!this.currentPlacement) {
      this.currentPlacement = this.props.positioning.placement
    }
    return trackPlacement(
      () => this.getEl('trigger'),
      () => this.getEl('popper'),
      {
        ...this.props.positioning,
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

  private getEl(part: 'trigger' | 'content' | 'popper'): HTMLElement | null {
    return document.getElementById(`hover-card:${this.props.id}:${part}`)
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): HoverCardApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return {
      get open() {
        return self.isOpen
      },
      setOpen(nextOpen: boolean) {
        if (self.isOpen === nextOpen) return
        if (self.props.disabled) return
        if (nextOpen) self.open()
        else self.close()
      },
      reposition(options = {}) {
        if (self.state !== 'open' && self.state !== 'closing') return
        trackPlacement(
          () => self.getEl('trigger'),
          () => self.getEl('popper'),
          {
            ...self.props.positioning,
            ...options,
            listeners: false,
            defer: true,
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
          'data-scope': 'hover-card',
          'data-part': 'trigger',
          dir: self.props.dir,
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          id: `hover-card:${self.props.id}:trigger`,
          'data-ownedby': self.props.id,
          'data-state': open ? 'open' : 'closed',
          onpointerenter(event: PointerEvent) {
            if (event.pointerType === 'touch') return
            if (self.props.disabled) return
            self.pointerEnter()
          },
          onpointerleave(event: PointerEvent) {
            if (event.pointerType === 'touch') return
            if (self.props.disabled) return
            self.pointerLeave()
          },
          onfocusin() {
            if (self.props.disabled) return
            self.triggerFocus()
          },
          onfocusout() {
            if (self.props.disabled) return
            self.triggerBlur()
          },
        }
      },
      getPositionerProps() {
        return {
          id: `hover-card:${self.props.id}:popper`,
          'data-scope': 'hover-card',
          'data-part': 'positioner',
          dir: self.props.dir,
          style: getFloatingStyleString(self.currentPlacement, self.props.positioning),
        }
      },
      getContentProps() {
        const open = self.isOpen
        return {
          'data-scope': 'hover-card',
          'data-part': 'content',
          dir: self.props.dir,
          id: `hover-card:${self.props.id}:content`,
          hidden: !open,
          tabindex: -1,
          'data-state': open ? 'open' : 'closed',
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          onpointerenter(event: PointerEvent) {
            if (event.pointerType === 'touch') return
            if (self.props.disabled) return
            self.pointerEnter()
          },
          onpointerleave(event: PointerEvent) {
            if (event.pointerType === 'touch') return
            if (self.props.disabled) return
            self.pointerLeave()
          },
        }
      },
    }
  }
}

export const createNativeHoverCardBehavior = (): NativeHoverCardBehavior =>
  new NativeHoverCardBehavior()
