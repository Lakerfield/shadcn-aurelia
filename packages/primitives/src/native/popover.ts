/**
 * Native popover engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/popover` behind the facade: the prop bags
 * (trigger/positioner/content) emit the exact attribute, ARIA, style and
 * event contract the Zag connect produced (keys pre-normalized the way
 * `@zag-js/vanilla` would), verified by the dual-engine suite in
 * `test/popover.spec.ts`.
 *
 * Model (Zag's two states): closed ⇄ open. Opening attaches, one frame
 * deferred (Zag `defer: true`):
 *   • a dismissable layer — Escape + outside press; additionally a document
 *     focusin listener dismisses when focus moves outside (Zag's
 *     focus-outside), without restoring focus to the trigger
 *   • floating-ui placement tracking on the positioner
 *   • Tab-order proxying (portalled content): Tab from the trigger enters
 *     the content, Tab past the content's last tabbable continues after the
 *     trigger, Shift+Tab from the content's first tabbable returns to it
 * On open, focus moves into the content ([autofocus]/[data-autofocus], first
 * tabbable, else the content itself); on close it returns to the trigger —
 * except when an outside press landed on a focusable element (Zag's
 * `restoreFocus` detail).
 *
 * Not ported (unused by the registry component): `modal` (focus trap, scroll
 * lock, aria-hide — the registry popover is always non-modal + portalled),
 * multi-trigger `triggerValue`, arrow/anchor/indicator/title/description/
 * close-trigger parts, the controlled `open` prop, `persistentElements`.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import { createDismissableLayer } from '../internal/dismissable-layer'
import { isSafari } from './keyboard'
import {
  getFloatingStyleString,
  getPlacementSide,
  trackPlacement,
  type Placement,
  type PositioningOptions,
} from './positioning'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type PopoverProps = {
  /** Unique machine id — element ids derive from it (`popover:{id}:content`). */
  id: string
  dir?: 'ltr' | 'rtl'
  defaultOpen?: boolean
  portalled?: boolean
  autoFocus?: boolean
  closeOnInteractOutside?: boolean
  closeOnEscape?: boolean
  restoreFocus?: boolean
  initialFocusEl?: () => HTMLElement | null
  positioning?: PositioningOptions
  onOpenChange?: (details: { open: boolean }) => void
}

export interface PopoverApi {
  open: boolean
  portalled: boolean
  setOpen(open: boolean): void
  reposition(options?: PositioningOptions): void
  getTriggerProps(): Record<string, unknown>
  getPositionerProps(): Record<string, unknown>
  getContentProps(): Record<string, unknown>
}

interface ResolvedPopoverProps extends Omit<PopoverProps, 'positioning'> {
  portalled: boolean
  autoFocus: boolean
  closeOnInteractOutside: boolean
  closeOnEscape: boolean
  restoreFocus: boolean
  positioning: PositioningOptions & { placement: Placement }
}

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

const isVisible = (el: HTMLElement): boolean => !el.hidden && el.offsetParent !== null

function getTabbables(container: ParentNode): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR)).filter(isVisible)
}

/** Zag's `isComposedPathFocusable` boiled down to the event target. */
function isFocusableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.closest(TABBABLE_SELECTOR) != null
}

export class NativePopoverBehavior implements BehaviorSource<PopoverApi> {
  api: PopoverApi | null = null

  private props!: ResolvedPopoverProps
  private isOpen = false
  // Zag defaults both true and only corrects them one frame after start
  private rendered = { title: true, description: true }
  private currentPlacement: Placement | undefined
  private readonly listeners = new Set<() => void>()
  private openCleanups: Array<() => void> = []
  private startCleanups: Array<() => void> = []
  private started = false

  init(props: PopoverProps): void {
    if (!props.id) throw new Error('[popover] `id` is required')
    this.props = {
      portalled: true,
      autoFocus: true,
      closeOnInteractOutside: true,
      closeOnEscape: true,
      restoreFocus: true,
      ...props,
      positioning: {
        placement: 'bottom',
        ...props.positioning,
      } as ResolvedPopoverProps['positioning'],
    }
  }

  updateProps(props: Partial<PopoverProps>): void {
    this.props = {
      ...this.props,
      ...props,
      positioning: {
        ...this.props.positioning,
        ...props.positioning,
      } as ResolvedPopoverProps['positioning'],
    }
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.api = this.buildApi()
    // Zag's checkRenderedElements: probed once, one frame after start
    const frame = requestAnimationFrame(() => {
      this.rendered = {
        title: !!this.getEl('title'),
        description: !!this.getEl('desc'),
      }
      this.notify()
    })
    this.startCleanups.push(() => cancelAnimationFrame(frame))
    if (this.props.defaultOpen) this.enterOpen()
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.disposeOpenEffects()
    this.startCleanups.forEach((fn) => fn())
    this.startCleanups = []
    this.isOpen = false
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

  private open(): void {
    if (this.isOpen) return
    this.props.onOpenChange?.({ open: true })
    this.enterOpen()
    this.setInitialFocus()
    this.notify()
  }

  private close(restoreFocus = true): void {
    if (!this.isOpen) return
    this.props.onOpenChange?.({ open: false })
    this.disposeOpenEffects()
    this.isOpen = false
    if (restoreFocus) this.setFinalFocus()
    this.notify()
  }

  private enterOpen(): void {
    this.isOpen = true
    // Zag sets the placement synchronously on effect start
    this.currentPlacement = this.props.positioning.placement
    // effects attach one frame later (Zag `defer: true`) so bindPart has
    // written the part ids by the time the elements are looked up
    const frame = requestAnimationFrame(() => {
      if (!this.isOpen || !this.started) return
      const contentEl = this.getEl('content')
      if (!contentEl) return
      this.openCleanups.push(
        createDismissableLayer(contentEl, {
          onDismiss: (event) => {
            // outside press on a focusable element: it takes focus, so don't
            // steal it back to the trigger (Zag's restoreFocus detail)
            const focusable = event?.type === 'pointerdown' && isFocusableTarget(event.target)
            this.close(!focusable)
          },
          exclude: () => [this.getEl('trigger')],
          escape: this.props.closeOnEscape,
          outsidePress: this.props.closeOnInteractOutside,
        }),
        this.trackFocusOutside(contentEl),
        trackPlacement(
          () => this.getEl('trigger'),
          () => this.getEl('popper'),
          {
            ...this.props.positioning,
            defer: false,
            onComplete: ({ placement }) => {
              if (this.currentPlacement !== placement) {
                this.currentPlacement = placement
                this.notify()
              }
            },
          },
        ),
      )
      if (this.props.portalled) {
        this.openCleanups.push(this.proxyTabFocus(contentEl))
      }
    })
    this.openCleanups.push(() => cancelAnimationFrame(frame))
  }

  private disposeOpenEffects(): void {
    this.openCleanups.forEach((fn) => fn())
    this.openCleanups = []
  }

  /* --------------------------------------------------------------- focus */

  /** Zag's getInitialFocus: autofocus marker, first tabbable, else content. */
  private setInitialFocus(): void {
    requestAnimationFrame(() => {
      if (!this.isOpen) return
      const contentEl = this.getEl('content')
      if (!contentEl) return
      const target =
        this.props.initialFocusEl?.() ??
        (this.props.autoFocus
          ? (contentEl.querySelector<HTMLElement>('[data-autofocus],[autofocus]') ??
            getTabbables(contentEl)[0] ??
            contentEl)
          : null)
      target?.focus({ preventScroll: true })
    })
  }

  private setFinalFocus(): void {
    if (!this.props.restoreFocus) return
    requestAnimationFrame(() => {
      this.getEl('trigger')?.focus({ preventScroll: true })
    })
  }

  /** Focus moving outside content + trigger dismisses (non-modal popover). */
  private trackFocusOutside(contentEl: HTMLElement): () => void {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (contentEl.contains(target)) return
      if (this.getEl('trigger')?.contains(target)) return
      if (this.props.closeOnInteractOutside) this.close(false)
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }

  /**
   * Zag's proxyTabFocus: with portalled content the DOM order breaks the tab
   * sequence — proxy it so Tab flows trigger → content → after-trigger.
   */
  private proxyTabFocus(contentEl: HTMLElement): () => void {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const triggerEl = this.getEl('trigger')
      const tabbables = getTabbables(contentEl)
      const first = tabbables[0] ?? null
      const last = tabbables[tabbables.length - 1] ?? null
      const none = !first && !last
      const active = document.activeElement

      let elementToFocus: HTMLElement | null | undefined
      if (event.shiftKey && active === this.getNextTabbableAfterTrigger(triggerEl)) {
        elementToFocus = last
      } else if (event.shiftKey && (active === first || none)) {
        elementToFocus = triggerEl
      } else if (!event.shiftKey && active === triggerEl) {
        elementToFocus = first
      } else if (!event.shiftKey && (active === last || none)) {
        elementToFocus = this.getNextTabbableAfterTrigger(triggerEl)
      }
      if (!elementToFocus) return
      event.preventDefault()
      elementToFocus.focus({ preventScroll: true })
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }

  private getNextTabbableAfterTrigger(triggerEl: HTMLElement | null): HTMLElement | null {
    if (!triggerEl) return null
    const tabbables = getTabbables(document.body)
    const index = tabbables.indexOf(triggerEl)
    return tabbables[index + 1] ?? null
  }

  /* ----------------------------------------------------------------- dom */

  private getEl(part: 'trigger' | 'content' | 'popper' | 'title' | 'desc'): HTMLElement | null {
    return document.getElementById(`popover:${this.props.id}:${part}`)
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): PopoverApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    return {
      get open() {
        return self.isOpen
      },
      get portalled() {
        return self.props.portalled
      },
      setOpen(nextOpen: boolean) {
        if (self.isOpen === nextOpen) return
        if (nextOpen) self.open()
        else self.close()
      },
      reposition(options = {}) {
        if (!self.isOpen) return
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
          'data-scope': 'popover',
          'data-part': 'trigger',
          dir: self.props.dir,
          type: 'button',
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          id: `popover:${self.props.id}:trigger`,
          'data-ownedby': self.props.id,
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          'data-state': open ? 'open' : 'closed',
          'aria-controls': `popover:${self.props.id}:content`,
          onpointerdown(event: PointerEvent) {
            if (event.button !== 0) return
            // Safari does not focus buttons on click — Zag compensates
            if (isSafari()) (event.currentTarget as HTMLElement).focus()
          },
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            if (self.isOpen) self.close()
            else self.open()
          },
        }
      },
      getPositionerProps() {
        return {
          id: `popover:${self.props.id}:popper`,
          'data-scope': 'popover',
          'data-part': 'positioner',
          dir: self.props.dir,
          style: getFloatingStyleString(self.currentPlacement, self.props.positioning),
        }
      },
      getContentProps() {
        const open = self.isOpen
        return {
          'data-scope': 'popover',
          'data-part': 'content',
          dir: self.props.dir,
          id: `popover:${self.props.id}:content`,
          tabindex: -1,
          role: 'dialog',
          hidden: !open,
          'data-state': open ? 'open' : 'closed',
          'data-expanded': dataAttr(open),
          'aria-labelledby': self.rendered.title ? `popover:${self.props.id}:title` : undefined,
          'aria-describedby': self.rendered.description
            ? `popover:${self.props.id}:desc`
            : undefined,
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
        }
      },
    }
  }
}

export const createNativePopoverBehavior = (): NativePopoverBehavior => new NativePopoverBehavior()
