/**
 * Native dialog engine — Phase 8 migration off Zag (first overlay migration).
 *
 * Drop-in replacement for `@zag-js/dialog` behind the facade: the prop bags
 * (trigger/backdrop/positioner/content/title/description/close-trigger) emit
 * the exact attribute, ARIA, style and event contract the Zag connect
 * produced (keys pre-normalized the way `@zag-js/vanilla` would), verified by
 * the dual-engine suite in `test/dialog.spec.ts`.
 *
 * Model: one open/closed flag. Entering `open` attaches the modal effects,
 * all deferred one frame (Zag's `defer: true` — the part ids land in the DOM
 * via `bindPart` before the frame fires):
 *   • dismissable layer — Escape + outside press, innermost-first via the
 *     shared layer stack in `internal/dismissable-layer`
 *   • focus trap (`internal/focus-trap`) — initial focus goes to the close
 *     trigger for `role="alertdialog"`, first tabbable otherwise; focus
 *     restores to the previously focused element on close
 *   • body scroll lock (`internal/scroll-lock`)
 *   • pointer blocking + aria-hiding of the content below (modal only)
 * Title/description presence is probed on the same frame (`rendered`) to
 * decide `aria-labelledby`/`aria-describedby`, like Zag's
 * `checkRenderedElements`.
 *
 * Native `<dialog>`/popover API evaluated and rejected: `showModal()` puts
 * the panel in the top layer, which breaks the registry contract — the copied
 * component renders backdrop/positioner/content as sibling divs styled by
 * Tailwind (`z-50`, `data-state` animations), portals them itself, and the
 * top layer cannot be z-index-interleaved with the existing overlay stack
 * (menus, popovers, sonner toasts).
 *
 * Not ported (unused by the registry component): multi-trigger
 * `triggerValue`/`setTriggerValue`, the controlled `open` prop (the Aurelia
 * layer controls via `setOpen()` + `onOpenChange`), per-part `ids` overrides,
 * `persistentElements`, and Zag's layer-stack style metadata (`--layer-index`
 * and friends) which no registry style consumes.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import { createDismissableLayer } from '../internal/dismissable-layer'
import { trapFocus } from '../internal/focus-trap'
import { hideOthers } from '../internal/hide-others'
import { preventBodyScroll } from '../internal/scroll-lock'

// type alias (not interface) so it stays assignable to Record<string, unknown>,
// which is what the shared ZagBehavior.init signature takes
export type DialogProps = {
  /** Unique machine id — element ids derive from it (`dialog:{id}:content`). */
  id: string
  dir?: 'ltr' | 'rtl'
  role?: 'dialog' | 'alertdialog'
  defaultOpen?: boolean
  /** Modal: trap focus, lock scroll, hide + pointer-block the page. Default true. */
  modal?: boolean
  trapFocus?: boolean
  preventScroll?: boolean
  closeOnInteractOutside?: boolean
  closeOnEscape?: boolean
  restoreFocus?: boolean
  /** Element to focus on open; defaults to the close trigger for alertdialog. */
  initialFocusEl?: () => HTMLElement | null
  'aria-label'?: string
  onOpenChange?: (details: { open: boolean }) => void
}

export interface DialogApi {
  open: boolean
  setOpen(open: boolean): void
  getTriggerProps(): Record<string, unknown>
  getBackdropProps(): Record<string, unknown>
  getPositionerProps(): Record<string, unknown>
  getContentProps(): Record<string, unknown>
  getTitleProps(): Record<string, unknown>
  getDescriptionProps(): Record<string, unknown>
  getCloseTriggerProps(): Record<string, unknown>
}

interface ResolvedDialogProps extends DialogProps {
  role: 'dialog' | 'alertdialog'
  modal: boolean
  trapFocus: boolean
  preventScroll: boolean
  closeOnInteractOutside: boolean
  closeOnEscape: boolean
  restoreFocus: boolean
}

/* Pointer blocking (Zag's `disablePointerEventsOutside`): while any modal
 * layer is up the body gets `pointer-events: none` + `data-inert`, and each
 * layer's content re-enables itself. Module-level so stacked dialogs block
 * once. */
let pointerBlockCount = 0
let prevBodyPointerEvents = ''

function blockPointerEventsOutside(contentEl: HTMLElement): () => void {
  const body = document.body
  if (pointerBlockCount === 0) {
    prevBodyPointerEvents = body.style.pointerEvents
    body.style.pointerEvents = 'none'
    body.setAttribute('data-inert', '')
  }
  pointerBlockCount++
  const prevContent = contentEl.style.pointerEvents
  contentEl.style.pointerEvents = 'auto'
  let released = false
  return () => {
    if (released) return
    released = true
    contentEl.style.pointerEvents = prevContent
    if (contentEl.style.length === 0) contentEl.removeAttribute('style')
    if (--pointerBlockCount === 0) {
      body.style.pointerEvents = prevBodyPointerEvents
      body.removeAttribute('data-inert')
      if (body.style.length === 0) body.removeAttribute('style')
    }
  }
}

export class NativeDialogBehavior implements BehaviorSource<DialogApi> {
  api: DialogApi | null = null

  private props!: ResolvedDialogProps
  private isOpen = false
  // Zag defaults both true and only corrects them one frame after opening
  private rendered = { title: true, description: true }
  private readonly listeners = new Set<() => void>()
  private openCleanups: Array<() => void> = []
  private started = false

  init(props: DialogProps): void {
    if (!props.id) throw new Error('[dialog] `id` is required')
    const role = props.role ?? 'dialog'
    const modal = props.modal ?? true
    this.props = {
      role,
      modal,
      trapFocus: modal,
      preventScroll: modal,
      closeOnInteractOutside: modal && role !== 'alertdialog',
      closeOnEscape: true,
      restoreFocus: true,
      initialFocusEl:
        role === 'alertdialog' ? () => this.getEl('close') : undefined,
      ...props,
    }
  }

  updateProps(props: Partial<DialogProps>): void {
    this.props = { ...this.props, ...props } as ResolvedDialogProps
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.api = this.buildApi()
    if (this.props.defaultOpen) this.enterOpen()
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.disposeOpenEffects()
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
    this.notify()
  }

  private close(): void {
    if (!this.isOpen) return
    this.props.onOpenChange?.({ open: false })
    this.disposeOpenEffects()
    this.isOpen = false
    this.notify()
  }

  private enterOpen(): void {
    this.isOpen = true
    // effects attach one frame later (Zag `defer: true`) so bindPart has
    // written the part ids by the time the elements are looked up
    const frame = requestAnimationFrame(() => {
      if (!this.isOpen || !this.started) return
      this.checkRenderedElements()
      const contentEl = this.getEl('content')
      if (!contentEl) return
      this.openCleanups.push(
        createDismissableLayer(contentEl, {
          onDismiss: () => this.close(),
          exclude: () => [...this.getTriggerEls()],
          escape: this.props.closeOnEscape,
          outsidePress: this.props.closeOnInteractOutside,
        }),
      )
      if (this.props.modal) {
        this.openCleanups.push(blockPointerEventsOutside(contentEl), hideOthers([contentEl]))
      }
      if (this.props.preventScroll) {
        this.openCleanups.push(preventBodyScroll())
      }
      if (this.props.trapFocus) {
        this.openCleanups.push(
          trapFocus(contentEl, {
            initialFocus: this.props.initialFocusEl?.() ?? undefined,
            restoreFocus: this.props.restoreFocus,
          }),
        )
      }
    })
    this.openCleanups.push(() => cancelAnimationFrame(frame))
  }

  private disposeOpenEffects(): void {
    this.openCleanups.forEach((fn) => fn())
    this.openCleanups = []
  }

  private checkRenderedElements(): void {
    const next = { title: !!this.getEl('title'), description: !!this.getEl('description') }
    if (next.title !== this.rendered.title || next.description !== this.rendered.description) {
      this.rendered = next
      this.notify()
    }
  }

  /* ----------------------------------------------------------------- dom */

  private id(part: string): string {
    return `dialog:${this.props.id}:${part}`
  }

  private getEl(part: string): HTMLElement | null {
    return document.getElementById(this.id(part))
  }

  private getTriggerEls(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll<HTMLElement>(
        `[data-scope="dialog"][data-part="trigger"][data-ownedby="${this.props.id}"]`,
      ),
    )
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): DialogApi {
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
      getTriggerProps() {
        const open = self.isOpen
        return {
          'data-scope': 'dialog',
          'data-part': 'trigger',
          dir: self.props.dir,
          id: self.id('trigger'),
          'data-ownedby': self.props.id,
          'aria-haspopup': 'dialog',
          type: 'button',
          'aria-expanded': open,
          'data-state': open ? 'open' : 'closed',
          'aria-controls': self.id('content'),
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            if (self.isOpen) self.close()
            else self.open()
          },
        }
      },
      getBackdropProps() {
        return {
          'data-scope': 'dialog',
          'data-part': 'backdrop',
          dir: self.props.dir,
          hidden: !self.isOpen,
          id: self.id('backdrop'),
          'data-state': self.isOpen ? 'open' : 'closed',
        }
      },
      getPositionerProps() {
        return {
          'data-scope': 'dialog',
          'data-part': 'positioner',
          dir: self.props.dir,
          id: self.id('positioner'),
          style: !self.isOpen || !self.props.modal ? 'pointer-events:none;' : undefined,
        }
      },
      getContentProps() {
        const ariaLabel = self.props['aria-label']
        return {
          'data-scope': 'dialog',
          'data-part': 'content',
          dir: self.props.dir,
          role: self.props.role,
          hidden: !self.isOpen,
          id: self.id('content'),
          tabindex: -1,
          'data-state': self.isOpen ? 'open' : 'closed',
          'aria-modal': self.props.modal,
          'aria-label': ariaLabel || undefined,
          'aria-labelledby': ariaLabel || !self.rendered.title ? undefined : self.id('title'),
          'aria-describedby': self.rendered.description ? self.id('description') : undefined,
          style: self.props.modal ? undefined : 'pointer-events:auto;',
        }
      },
      getTitleProps() {
        return {
          'data-scope': 'dialog',
          'data-part': 'title',
          dir: self.props.dir,
          id: self.id('title'),
        }
      },
      getDescriptionProps() {
        return {
          'data-scope': 'dialog',
          'data-part': 'description',
          dir: self.props.dir,
          id: self.id('description'),
        }
      },
      getCloseTriggerProps() {
        return {
          'data-scope': 'dialog',
          'data-part': 'close-trigger',
          dir: self.props.dir,
          id: self.id('close'),
          type: 'button',
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            event.stopPropagation()
            self.close()
          },
        }
      },
    }
  }
}

export const createNativeDialogBehavior = (): NativeDialogBehavior => new NativeDialogBehavior()
