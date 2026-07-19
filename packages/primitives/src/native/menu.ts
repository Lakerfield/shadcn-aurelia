/**
 * Native menu engine — Phase 8 migration off Zag. One engine drives
 * dropdown-menu, context-menu and menubar (the registry menubar coordinates
 * plain root machines itself).
 *
 * Drop-in replacement for `@zag-js/menu` behind the facade: every prop bag
 * (trigger/context-trigger/positioner/content/item/option-item/indicator/
 * group/separator/trigger-item) emits the exact attribute, ARIA, style and
 * event contract the Zag connect produced, verified by the dual-engine suite
 * in `test/menu.spec.ts`.
 *
 * Model (Zag's states): idle ⇄ closed → open ⇄ closing, plus the transient
 * `opening` (submenu hover, 200 ms) and `contextOpening` (long-press, 700 ms).
 * `closing` is the submenu grace period: an intent polygon spanning pointer →
 * submenu content keeps it open while the pointer travels there (100 ms cap),
 * and re-entering the content reopens.
 *
 * Submenus are separate machines linked via `setParent`/`setChild` exactly
 * like Zag: the parent treats the child's trigger as one of its items
 * (`getTriggerItemProps` merges both bags), keyboard ArrowRight/Enter open the
 * highlighted child, ArrowLeft closes it, and a pointer-routing lock stops the
 * parent from re-highlighting while the pointer crosses the polygon.
 *
 * Deliberate deviations from Zag (behavior-identical for the registry):
 *   • closing a menu cascades to its open descendants directly — Zag relies
 *     on each child's focus-outside dismissal to observe the same end state
 *   • `onOpenChange(false)` also fires for the pointer-moved-away submenu
 *     close (Zag skips it on that one transition)
 * Not ported (unused by the registry): controlled `open`/`highlightedValue`
 * props, multi-trigger `triggerValue`, custom `ids`, arrow/indicator/
 * item-text parts, `addItemListener`.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import { createDismissableLayer } from '../internal/dismissable-layer'
import {
  ensureInteractionModalityTracking,
  getInteractionModality,
} from '../internal/interaction-modality'
import { getEventKey } from './keyboard'
import {
  getFloatingStyleString,
  getPlacementSide,
  trackPlacement,
  type Placement,
  type PositioningOptions,
  type VirtualElement,
} from './positioning'

export interface MenuPoint {
  x: number
  y: number
}

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type MenuProps = {
  /** Unique machine id — element ids derive from it (`menu:{id}:content`). */
  id: string
  dir?: 'ltr' | 'rtl'
  'aria-label'?: string
  defaultOpen?: boolean
  defaultHighlightedValue?: string | null
  /** Close when an item is selected. Default true (items can override). */
  closeOnSelect?: boolean
  typeahead?: boolean
  composite?: boolean
  loopFocus?: boolean
  positioning?: PositioningOptions
  onOpenChange?: (details: { open: boolean }) => void
  onSelect?: (details: { value: string }) => void
  onHighlightChange?: (details: { highlightedValue: string | null }) => void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Called for anchor items on keyboard selection. Default: click the link. */
  navigate?: ((details: { value: string | null; node: HTMLAnchorElement; href: string }) => void) | null
}

export interface MenuItemProps {
  value: string
  disabled?: boolean
  valueText?: string
  closeOnSelect?: boolean
}

export interface MenuOptionItemProps extends MenuItemProps {
  type: 'checkbox' | 'radio'
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export interface MenuItemIndicatorProps {
  value: string
  checked?: boolean
  disabled?: boolean
}

/**
 * Opaque machine handle used for parent/child linking. For the native engine
 * this is the behavior instance itself; for the Zag reference engine it is
 * the raw machine service. Trees never mix engines, so the type stays opaque.
 */
export type MenuService = unknown

export interface MenuApi {
  open: boolean
  highlightedValue: string | null
  setOpen(open: boolean): void
  setHighlightedValue(value: string | null): void
  setParent(parent: MenuService): void
  setChild(child: MenuService): void
  reposition(options?: PositioningOptions): void
  getTriggerProps(): Record<string, unknown>
  getContextTriggerProps(): Record<string, unknown>
  getTriggerItemProps(childApi: MenuApi): Record<string, unknown>
  getPositionerProps(): Record<string, unknown>
  getContentProps(): Record<string, unknown>
  getSeparatorProps(): Record<string, unknown>
  getItemProps(props: MenuItemProps): Record<string, unknown>
  getOptionItemProps(props: MenuOptionItemProps): Record<string, unknown>
  getItemIndicatorProps(props: MenuItemIndicatorProps): Record<string, unknown>
  getItemGroupProps(props: { id: string }): Record<string, unknown>
  getItemGroupLabelProps(props: { htmlFor: string }): Record<string, unknown>
}

interface ResolvedMenuProps extends Omit<MenuProps, 'positioning'> {
  closeOnSelect: boolean
  typeahead: boolean
  composite: boolean
  loopFocus: boolean
  positioning: PositioningOptions
}

type MenuState = 'idle' | 'contextOpening' | 'opening' | 'open' | 'closing' | 'closed'

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

const isTargetDisabled = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement && (el.dataset.disabled === '' || el.hasAttribute('disabled'))

/** A menu item that also controls a submenu (merged trigger-item bag). */
const isTriggerItemEl = (el: Element | null): boolean =>
  !!el?.getAttribute('role')?.startsWith('menuitem') && !!el.hasAttribute('data-controls')

const isEditableElement = (el: Element | null): boolean => {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  return /^(input|textarea|select)$/.test(el.localName)
}

const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? '')

const isContextMenuPress = (e: PointerEvent | MouseEvent): boolean =>
  e.button === 2 || (isMac() && e.ctrlKey && e.button === 0)

/** Alt+click on a link/submit downloads — Zag lets the browser have it. */
const isDownloadingEvent = (e: MouseEvent): boolean => {
  const el = e.currentTarget as HTMLElement | null
  if (!el || !e.altKey) return false
  if (el.localName === 'a') return true
  return (
    (el.localName === 'button' || el.localName === 'input') &&
    (el as HTMLButtonElement | HTMLInputElement).type === 'submit'
  )
}

/** Middle-click / cmd-click on a link opens a new tab — same hands-off rule. */
const isOpeningInNewTab = (e: MouseEvent): boolean => {
  const el = e.currentTarget as HTMLElement | null
  if (!el?.matches("a[href], button[type='submit'], input[type='submit']")) return false
  return e.button === 1 || (isMac() ? e.metaKey : e.ctrlKey)
}

const isPrintableKey = (e: KeyboardEvent): boolean =>
  e.key.length === 1 && !e.ctrlKey && !e.metaKey

const isModifierKey = (e: KeyboardEvent): boolean => e.ctrlKey || e.altKey || e.metaKey

const getPoint = (e: PointerEvent | MouseEvent): MenuPoint => ({ x: e.clientX, y: e.clientY })

/**
 * Zag's `getElementPolygon`: the content rect's corners ordered so that,
 * prefixed with the pointer's exit point, they form the safe-travel polygon.
 */
function getElementPolygon(rect: DOMRect, placement: Placement): MenuPoint[] | undefined {
  const top = { x: rect.left, y: rect.top }
  const right = { x: rect.right, y: rect.top }
  const bottom = { x: rect.right, y: rect.bottom }
  const left = { x: rect.left, y: rect.bottom }
  const side = getPlacementSide(placement)
  return {
    top: [left, top, right, bottom],
    right: [top, right, bottom, left],
    bottom: [top, left, bottom, right],
    left: [right, top, left, bottom],
  }[side as 'top' | 'right' | 'bottom' | 'left']
}

function isPointInPolygon(polygon: MenuPoint[], point: MenuPoint): boolean {
  const { x, y } = point
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Zag's array `nextIndex`: loop=false clamps at the edges, -1 starts over. */
function nextIndex(length: number, idx: number, step: 1 | -1, loop: boolean): number {
  const next = idx + step
  const last = length - 1
  if (idx === -1) return step > 0 ? 0 : last
  if (next < 0) return loop ? last : 0
  if (next >= length) return loop ? 0 : idx
  return next
}

/**
 * Zag core's `mergeProps` for the trigger-item bag: handlers compose (trigger
 * first, then item — Zag's callAll order), classes join, styles concatenate,
 * and otherwise the trigger's value wins.
 */
function mergeItemTriggerProps(
  item: Record<string, unknown>,
  trigger: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...item }
  for (const [key, val] of Object.entries(trigger)) {
    if (val === undefined) continue
    const prev = merged[key]
    if (/^on[a-z]/i.test(key) && typeof prev === 'function' && typeof val === 'function') {
      merged[key] = (...args: unknown[]) => {
        ;(val as (...a: unknown[]) => void)(...args)
        ;(prev as (...a: unknown[]) => void)(...args)
      }
    } else if (key === 'class' && typeof prev === 'string' && typeof val === 'string') {
      merged[key] = `${prev} ${val}`.trim()
    } else if (key === 'style' && typeof prev === 'string' && typeof val === 'string') {
      merged[key] = `${prev};${val}`
    } else {
      merged[key] = val
    }
  }
  return merged
}

const OPEN_DELAY = 200 // submenu hover-open
const CLOSE_DELAY = 100 // submenu grace period
const LONG_PRESS_DELAY = 700 // context-menu touch long-press
const TYPEAHEAD_TIMEOUT = 350

export class NativeMenuBehavior implements BehaviorSource<MenuApi> {
  api: MenuApi | null = null

  private props!: ResolvedMenuProps
  private state: MenuState = 'idle'
  private highlightedValue: string | null = null
  private lastHighlightedValue: string | null = null
  private currentPlacement: Placement | undefined
  private intentPolygon: MenuPoint[] | null = null
  private anchorPoint: MenuPoint | null = null
  private isSubmenu = false
  private pointerRoutingLocked = false
  private readonly typeaheadState = { keysSoFar: '', timer: null as ReturnType<typeof setTimeout> | null }
  private parent: NativeMenuBehavior | null = null
  private readonly children = new Map<string, NativeMenuBehavior>()
  /**
   * Mirrors Zag's event history: the item-pointerleave guard reads
   * `event.previous()` — the event BEFORE the last processed one — so a
   * single hover + leave does NOT clear the highlight (the previous event is
   * still the trigger click). Every handler that would make Zag `send()`
   * shifts this two-slot history.
   */
  private prevEventPointer = false
  private lastEventPointer = false
  private readonly listeners = new Set<() => void>()
  private overlayCleanups: Array<() => void> = []
  private closingCleanups: Array<() => void> = []
  private openTimer: ReturnType<typeof setTimeout> | null = null
  private longPressTimer: ReturnType<typeof setTimeout> | null = null
  private repositionCleanup: (() => void) | null = null
  private started = false

  /** The linking handle the registry passes to `setParent`/`setChild`. */
  get service(): MenuService {
    return this
  }

  init(props: MenuProps): void {
    if (!props.id) throw new Error('[menu] `id` is required')
    this.props = {
      closeOnSelect: true,
      typeahead: true,
      composite: true,
      loopFocus: false,
      ...props,
      positioning: {
        placement: 'bottom-start',
        gutter: 8,
        ...props.positioning,
      },
    }
  }

  updateProps(props: Partial<MenuProps>): void {
    this.props = {
      ...this.props,
      ...props,
      positioning: { ...this.props.positioning, ...props.positioning },
    }
  }

  start(): void {
    if (this.started) return
    this.started = true
    ensureInteractionModalityTracking()
    this.api = this.buildApi()
    this.highlightedValue = this.props.defaultHighlightedValue ?? null
    if (this.props.defaultOpen) this.doOpen({ silent: true })
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.cancelPendingTimers()
    this.clearTypeaheadTimer()
    this.disposeClosingEffects()
    this.disposeOverlayEffects()
    this.state = 'idle'
    this.highlightedValue = null
    this.anchorPoint = null
    this.api = null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify(): void {
    this.listeners.forEach((l) => l())
  }

  private recordEvent(pointer: boolean): void {
    this.prevEventPointer = this.lastEventPointer
    this.lastEventPointer = pointer
  }

  /* ------------------------------------------------------------- machine */

  private get isOpen(): boolean {
    // Zag's `open` tag spans open + the submenu grace period
    return this.state === 'open' || this.state === 'closing'
  }

  /** OPEN-family events: enter `open`, run entry actions, attach effects. */
  private doOpen(opts: { silent?: boolean } = {}): void {
    if (this.state === 'open') return
    const wasVisible = this.isOpen // true when re-opening from `closing`
    this.cancelPendingTimers()
    this.disposeClosingEffects()
    this.state = 'open'
    if (!wasVisible && !opts.silent) this.props.onOpenChange?.({ open: true })
    // entry: focusMenu + unlockParentOnOpen (suggest our trigger as highlight)
    this.focusContent()
    if (this.isSubmenu && this.parent) {
      this.parent.recordEvent(false) // HIGHLIGHTED.SUGGEST
      this.parent.suggestHighlighted(this.triggerId)
      this.parent.pointerRoutingLocked = false
    }
    if (!wasVisible) {
      // Zag's trackPositioning seeds the placement synchronously on entry —
      // except in context-menu mode, where the anchor reposition owns it
      if (!this.hasContextTrigger()) {
        this.currentPlacement = this.effectivePositioning().placement as Placement
      }
      this.attachOverlayEffects()
      if (this.anchorPoint) this.repositionToAnchor()
      this.scrollHighlightedIntoView()
    }
    this.notify()
  }

  /** CLOSE-family events: onOpenChange + focus restore + closed entry. */
  private doClose(opts: { restoreFocus?: boolean } = {}): void {
    if (this.state === 'closed' || this.state === 'idle') return
    this.cancelPendingTimers()
    this.disposeClosingEffects()
    this.props.onOpenChange?.({ open: false })
    this.releaseParentRoutingLock()
    // Zag's focusTrigger: skipped for submenus, anchored (context) menus and
    // dismissals that already moved focus somewhere focusable
    if (opts.restoreFocus !== false && !this.isSubmenu && !this.anchorPoint) {
      queueMicrotask(() => {
        if (!this.isOpen) this.getEl('trigger')?.focus({ preventScroll: true })
      })
    }
    this.enterClosed()
    this.notify()
  }

  /** Shared `closed` entry: clear state, unlock parent, cascade to children. */
  private enterClosed(): void {
    this.state = 'closed'
    this.setHighlighted(null)
    this.unlockParentOnClose()
    this.anchorPoint = null
    this.intentPolygon = null
    this.disposeOverlayEffects()
    for (const child of this.children.values()) {
      if (child.state !== 'closed' && child.state !== 'idle') child.doClose({ restoreFocus: false })
    }
  }

  /** Submenu grace period: intent-polygon tracking + 100 ms cap. */
  private enterClosing(): void {
    if (this.state !== 'open') return
    this.state = 'closing'
    const parent = this.parent
    if (parent) {
      parent.pointerRoutingLocked = true
      const onMove = (e: PointerEvent) => {
        const heading =
          this.intentPolygon != null && isPointInPolygon(this.intentPolygon, getPoint(e))
        if (!heading) {
          this.recordEvent(true) // POINTER_MOVED_AWAY_FROM_SUBMENU
          parent.pointerRoutingLocked = false
          this.closeAsSubmenu()
        }
      }
      document.addEventListener('pointermove', onMove)
      this.closingCleanups.push(() => document.removeEventListener('pointermove', onMove))
    }
    const timer = setTimeout(() => {
      this.recordEvent(false) // DELAY.CLOSE
      this.closeAsSubmenu()
    }, CLOSE_DELAY)
    this.closingCleanups.push(() => clearTimeout(timer))
    this.notify()
  }

  /** closing → closed: hand focus and highlight back to the parent menu. */
  private closeAsSubmenu(): void {
    if (this.state !== 'closing') return
    this.disposeClosingEffects()
    this.props.onOpenChange?.({ open: false })
    this.releaseParentRoutingLock()
    // the parent receives FOCUS_MENU + HIGHLIGHTED.RESTORE sends
    this.parent?.recordEvent(false)
    this.parent?.recordEvent(false)
    this.parent?.focusContent()
    this.parent?.restoreHighlighted()
    this.enterClosed()
    this.notify()
  }

  private cancelPendingTimers(): void {
    if (this.openTimer != null) {
      clearTimeout(this.openTimer)
      this.openTimer = null
    }
    if (this.longPressTimer != null) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  private disposeClosingEffects(): void {
    this.closingCleanups.forEach((fn) => fn())
    this.closingCleanups = []
  }

  private disposeOverlayEffects(): void {
    this.repositionCleanup?.()
    this.repositionCleanup = null
    this.overlayCleanups.forEach((fn) => fn())
    this.overlayCleanups = []
  }

  /* ------------------------------------------------------------- effects */

  /**
   * Dismissal, focus-outside and placement tracking — attached one frame
   * deferred (Zag `defer: true`) so bindPart has written the part ids.
   */
  private attachOverlayEffects(): void {
    const frame = requestAnimationFrame(() => {
      if (!this.isOpen || !this.started) return
      const contentEl = this.getEl('content')
      if (!contentEl) return
      this.overlayCleanups.push(
        createDismissableLayer(contentEl, {
          onDismiss: (event) => this.onLayerDismiss(event),
          exclude: () => [this.getEl('trigger')],
        }),
        this.trackFocusOutside(contentEl),
      )
      if (!this.hasContextTrigger()) {
        this.overlayCleanups.push(
          trackPlacement(
            () => this.getEl('trigger'),
            () => this.getEl('popper'),
            {
              ...this.effectivePositioning(),
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
      }
    })
    this.overlayCleanups.push(() => cancelAnimationFrame(frame))
  }

  private onLayerDismiss(event?: Event): void {
    this.recordEvent(false) // CLOSE (interact-outside)
    if (event instanceof KeyboardEvent) {
      // Escape: a submenu closes the whole tree via the root (Zag's
      // closeRootMenu); the cascade takes its descendants with it
      this.props.onEscapeKeyDown?.(event)
      this.getRootMenu().doClose()
      return
    }
    let restoreFocus = true
    if (event?.type === 'pointerdown') {
      const target = event.target
      const ctxTrigger = this.getEl('ctx-trigger')
      // right-click on the context trigger repositions instead of closing
      if (
        ctxTrigger &&
        target instanceof Node &&
        ctxTrigger.contains(target) &&
        isContextMenuPress(event as PointerEvent)
      ) {
        return
      }
      // outside press on a focusable element keeps its focus (Zag detail)
      restoreFocus = !isFocusableTarget(target)
    }
    this.doClose({ restoreFocus })
  }

  /**
   * Focus moving outside the menu tree dismisses. This is also how a parent
   * menu closes its open submenu when the pointer highlights another item
   * (highlighting refocuses the parent content).
   */
  private trackFocusOutside(contentEl: HTMLElement): () => void {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (contentEl.contains(target)) return
      if (this.getEl('trigger')?.contains(target)) return
      if (this.getEl('ctx-trigger')?.contains(target)) return
      if (this.isWithinChildTree(target)) return
      this.recordEvent(false) // CLOSE (focus-outside)
      this.doClose()
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }

  private isWithinChildTree(target: Node): boolean {
    for (const child of this.children.values()) {
      const childContent = child.getEl('content')
      if (childContent?.contains(target)) return true
      if (child.isWithinChildTree(target)) return true
    }
    return false
  }

  /* -------------------------------------------------------- positioning */

  private effectivePositioning(): PositioningOptions {
    if (!this.isSubmenu) return this.props.positioning
    // Zag's setSubmenuPlacement override (applied on PARENT.SET)
    const placement = this.props.dir === 'rtl' ? 'left-start' : 'right-start'
    return { ...this.props.positioning, placement, gutter: 0 }
  }

  private repositionToAnchor(): void {
    const anchor = this.anchorPoint
    if (!anchor) return
    const virtual: VirtualElement = {
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        x: anchor.x,
        y: anchor.y,
        top: anchor.y,
        left: anchor.x,
        right: anchor.x,
        bottom: anchor.y,
      }),
    }
    this.repositionCleanup?.()
    this.repositionCleanup = trackPlacement(
      () => virtual,
      () => this.getEl('popper'),
      {
        ...this.effectivePositioning(),
        listeners: false,
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

  private setAnchorPoint(point: MenuPoint): void {
    if (this.anchorPoint?.x === point.x && this.anchorPoint?.y === point.y) return
    this.anchorPoint = point
    this.repositionToAnchor()
    this.notify()
  }

  /* ------------------------------------------------------------ highlight */

  private setHighlighted(value: string | null): void {
    if (this.highlightedValue === value) return
    this.highlightedValue = value
    this.props.onHighlightChange?.({ highlightedValue: value })
    this.scrollHighlightedIntoView()
    this.notify()
  }

  /** Keyboard/virtual highlight changes keep the item in view (Zag effect). */
  private scrollHighlightedIntoView(): void {
    if (this.highlightedValue == null) return
    requestAnimationFrame(() => {
      if (getInteractionModality() === 'pointer') return
      const id = this.highlightedId()
      const itemEl = id ? document.getElementById(id) : null
      const contentEl = this.getEl('content')
      if (!itemEl || !contentEl) return
      if (contentEl.scrollHeight > contentEl.clientHeight) {
        itemEl.scrollIntoView?.({ block: 'nearest' })
      }
    })
  }

  /** Zag's resolveItemId: a child trigger's own id doubles as its value. */
  private highlightedId(): string | null {
    const value = this.highlightedValue
    if (!value) return null
    for (const child of this.children.values()) {
      if (child.triggerId === value) return value
    }
    return `${this.props.id}/${value}`
  }

  private getHighlightedEl(): HTMLElement | null {
    const id = this.highlightedId()
    return id ? document.getElementById(id) : null
  }

  private getItemEls(): HTMLElement[] {
    const contentEl = this.getEl('content')
    if (!contentEl) return []
    return Array.from(
      contentEl.querySelectorAll<HTMLElement>(
        `[role^="menuitem"][data-ownedby="${this.contentId}"]:not([data-disabled])`,
      ),
    )
  }

  private matchesHighlighted(el: HTMLElement): boolean {
    const value = this.highlightedValue
    if (!value) return false
    return el.id === value || el.dataset.value === value
  }

  private highlightEdge(edge: 'first' | 'last'): void {
    const items = this.getItemEls()
    const el = edge === 'first' ? items[0] : items[items.length - 1]
    if (!el) return
    this.setHighlighted(el.dataset.value ?? null)
  }

  /** Zag defers the post-open edge highlight one microtask/frame. */
  private deferHighlightEdge(edge: 'first' | 'last'): void {
    const run = () => {
      if (this.isOpen) this.highlightEdge(edge)
    }
    if (this.getEl('content')) queueMicrotask(run)
    else requestAnimationFrame(run)
  }

  private highlightStep(step: 1 | -1): void {
    const items = this.getItemEls()
    const index = items.findIndex((el) => this.matchesHighlighted(el))
    const target = items[nextIndex(items.length, index, step, this.props.loopFocus)]
    this.setHighlighted(target?.dataset.value ?? null)
  }

  private suggestHighlighted(value: string): void {
    if (this.highlightedValue != null) {
      this.lastHighlightedValue = value
      return
    }
    this.setHighlighted(value)
  }

  private restoreHighlighted(): void {
    const last = this.lastHighlightedValue
    this.lastHighlightedValue = null
    if (!last) return
    this.setHighlighted(last)
  }

  /* ------------------------------------------------------------ typeahead */

  private get isTypingAhead(): boolean {
    return this.typeaheadState.keysSoFar !== ''
  }

  private clearTypeaheadTimer(): void {
    if (this.typeaheadState.timer != null) {
      clearTimeout(this.typeaheadState.timer)
      this.typeaheadState.timer = null
    }
  }

  private typeaheadHighlight(key: string): void {
    if (this.state !== 'open') return
    const items = this.getItemEls()
    const current = items.find((el) => this.matchesHighlighted(el)) ?? null
    const search = this.typeaheadState.keysSoFar + key
    const isRepeated = search.length > 1 && Array.from(search).every((c) => c === search[0])
    const query = (isRepeated ? search[0] : search).toLowerCase()
    // search from the current item, wrapping; a single key skips the current
    const index = current ? items.indexOf(current) : -1
    let scoped = current ? items.map((_, i) => items[(Math.max(index, 0) + i) % items.length]) : items
    if (query.length === 1) scoped = scoped.filter((el) => el !== current)
    const next = scoped.find((el) =>
      (el.dataset.valuetext ?? el.textContent ?? '').trim().toLowerCase().startsWith(query),
    )
    this.typeaheadState.keysSoFar = search
    this.clearTypeaheadTimer()
    this.typeaheadState.timer = setTimeout(() => {
      this.typeaheadState.keysSoFar = ''
      this.clearTypeaheadTimer()
    }, TYPEAHEAD_TIMEOUT)
    if (next) this.setHighlighted(next.dataset.value ?? null)
  }

  /* --------------------------------------------------------------- focus */

  /** Zag's focusMenu: focus the content unless focus is already inside. */
  private focusContent(): void {
    requestAnimationFrame(() => {
      const contentEl = this.getEl('content')
      if (!contentEl) return
      if (contentEl.contains(document.activeElement)) return
      const target =
        contentEl.querySelector<HTMLElement>('[data-autofocus],[autofocus]') ??
        getTabbables(contentEl).filter((el) => !el.getAttribute('role')?.startsWith('menuitem'))[0] ??
        contentEl
      target.focus({ preventScroll: true })
    })
  }

  /* ---------------------------------------------------------- interactions */

  private triggerClick(target: HTMLElement): void {
    if (this.state === 'open') {
      if (!isTriggerItemEl(target)) this.doClose()
      return
    }
    if (this.state === 'idle' || this.state === 'closed') this.doOpen()
  }

  private triggerKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return
    const key = getEventKey(event, { orientation: 'vertical', dir: this.props.dir })
    const edgeByKey: Record<string, 'first' | 'last'> = {
      ArrowDown: 'first',
      ArrowUp: 'last',
      Enter: 'first',
      Space: 'first',
    }
    const edge = edgeByKey[key]
    if (!edge) return
    event.preventDefault()
    this.recordEvent(false)
    if (this.state === 'closed') {
      this.doOpen()
      this.deferHighlightEdge(edge)
    } else if (this.state === 'open') {
      this.highlightStep(edge === 'last' ? -1 : 1)
      this.focusContent()
    }
  }

  /** Hovering a submenu trigger arms the 200 ms open delay. */
  private triggerPointerMove(target: HTMLElement, point: MenuPoint): void {
    if (this.state === 'idle' || this.state === 'closed') {
      this.state = 'opening'
      this.openTimer = setTimeout(() => {
        this.openTimer = null
        this.recordEvent(false) // DELAY.OPEN
        if (this.state === 'opening') this.doOpen()
      }, OPEN_DELAY)
      return
    }
    if (this.state === 'open' && isTriggerItemEl(target)) this.setIntentPolygon(point)
  }

  private triggerPointerLeave(point: MenuPoint): void {
    if (this.state === 'opening') {
      this.doClose()
      return
    }
    if (this.state === 'open') {
      this.setIntentPolygon(point)
      this.enterClosing()
    }
  }

  private setIntentPolygon(point: MenuPoint): void {
    const contentEl = this.getEl('content')
    const placement = this.currentPlacement
    if (!contentEl || !placement) return
    const polygon = getElementPolygon(contentEl.getBoundingClientRect(), placement)
    if (!polygon) return
    // bleed the exit point past the trigger edge so the polygon has width
    const bleed = getPlacementSide(placement) === 'right' ? -5 : 5
    this.intentPolygon = [{ x: point.x + bleed, y: point.y }, ...polygon]
  }

  private itemPointerMove(value: string, target: HTMLElement, point: MenuPoint): void {
    if (this.state !== 'open') return
    if (!this.pointerRoutingLocked) {
      this.setHighlighted(value)
      this.focusContent()
    } else {
      this.lastHighlightedValue = target.dataset.value ?? null
    }
    this.closeSiblingMenus(target, point)
  }

  private closeSiblingMenus(target: HTMLElement, point: MenuPoint): void {
    if (!isTriggerItemEl(target)) return
    const hoveredChildId = target.getAttribute('data-uid')
    for (const [id, child] of this.children) {
      if (id === hoveredChildId) continue
      if (child.state === 'closed' || child.state === 'idle') continue
      if (child.intentPolygon && isPointInPolygon(child.intentPolygon, point)) continue
      this.getEl('content')?.focus({ preventScroll: true })
      child.doClose({ restoreFocus: false })
    }
  }

  private itemClick(
    target: HTMLElement,
    closeOnSelect: boolean | undefined,
    option?: MenuOptionItemProps,
  ): void {
    if (this.state !== 'open') return
    if (isTriggerItemEl(target)) {
      this.setHighlighted(target.dataset.value ?? null)
      return
    }
    if (isEditableElement(this.getHighlightedEl())) {
      this.setHighlighted(target.dataset.value ?? null)
      return
    }
    // invokeOnSelect — Zag selects the HIGHLIGHTED value, not the click target
    const value = this.highlightedValue
    if (value != null) {
      const id = this.highlightedId()
      const node = id ? document.getElementById(id) : null
      node?.dispatchEvent(new CustomEvent('menu:select', { detail: { value } }))
      this.props.onSelect?.({ value })
    }
    if (option) {
      if (option.type === 'radio') option.onCheckedChange?.(true)
      else option.onCheckedChange?.(!option.checked)
    }
    if (closeOnSelect ?? this.props.closeOnSelect) {
      // close the root; the cascade closes this menu and every sibling branch
      this.getRootMenu().doClose()
    }
  }

  private contentKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return
    const contentEl = event.currentTarget as HTMLElement
    const target = event.target as HTMLElement | null
    if (!target || !contentEl.contains(target)) return
    const sameMenu = target.closest('[role=menu]') === contentEl || target === contentEl
    if (!sameMenu) return
    if (event.key === 'Tab') {
      // Zag's isValidTabEvent: with no tabbable edges the Tab is swallowed
      const tabbables = getTabbables(contentEl)
      const first = tabbables[0]
      const last = tabbables[tabbables.length - 1]
      const invalid =
        (!first && !last) ||
        (document.activeElement === first && event.shiftKey) ||
        (document.activeElement === last && !event.shiftKey)
      if (invalid) {
        event.preventDefault()
        return
      }
    }
    const key = getEventKey(event, { dir: this.props.dir })
    const exec: Record<string, () => void> = {
      ArrowDown: () => {
        this.highlightStep(1)
        this.focusContent()
      },
      ArrowUp: () => {
        this.highlightStep(-1)
        this.focusContent()
      },
      ArrowLeft: () => {
        if (!this.isSubmenu) return
        const parent = this.parent
        this.doClose()
        parent?.focusContent()
      },
      ArrowRight: () => {
        const el = this.getHighlightedEl()
        if (isTriggerItemEl(el)) this.openHighlightedSubmenu(el!)
      },
      Enter: () => this.enterKey(),
      Space: () => {
        if (this.isTypingAhead) this.typeaheadHighlight(event.key)
        else this.enterKey()
      },
      Home: () => {
        this.highlightEdge('first')
        this.focusContent()
      },
      End: () => {
        this.highlightEdge('last')
        this.focusContent()
      },
    }
    const handler = exec[key]
    if (handler) {
      this.recordEvent(false)
      handler()
      event.stopPropagation()
      event.preventDefault()
      return
    }
    if (!this.props.typeahead) return
    if (!isPrintableKey(event) || isModifierKey(event) || isEditableElement(target)) return
    this.recordEvent(false)
    this.typeaheadHighlight(event.key)
    event.preventDefault()
  }

  private enterKey(): void {
    const itemEl = this.getHighlightedEl()
    if (isTriggerItemEl(itemEl)) {
      this.openHighlightedSubmenu(itemEl!)
      return
    }
    if (!itemEl) return
    if (itemEl instanceof HTMLAnchorElement && itemEl.matches('a[href]')) {
      const navigate = this.props.navigate
      if (navigate) navigate({ value: this.highlightedValue, node: itemEl, href: itemEl.href })
      else queueMicrotask(() => itemEl.dispatchEvent(new MouseEvent('click')))
    } else {
      queueMicrotask(() => itemEl.click())
    }
  }

  private openHighlightedSubmenu(itemEl: HTMLElement): void {
    const uid = itemEl.getAttribute('data-uid')
    const child = uid ? this.children.get(uid) : null
    if (!child) return
    child.doOpen()
    child.deferHighlightEdge('first')
  }

  private contextMenuStart(point: MenuPoint): void {
    if (this.state !== 'idle' && this.state !== 'closed') return
    this.setAnchorPoint(point)
    this.state = 'contextOpening'
    this.longPressTimer = setTimeout(() => {
      this.longPressTimer = null
      this.recordEvent(false) // LONG_PRESS.OPEN
      if (this.state === 'contextOpening') this.doOpen()
    }, LONG_PRESS_DELAY)
  }

  private contextMenuCancel(): void {
    if (this.state !== 'contextOpening') return
    this.doClose()
  }

  private contextMenu(point: MenuPoint): void {
    if (this.state === 'open' || this.state === 'closing') {
      this.setAnchorPoint(point)
      this.focusContent()
      return
    }
    if (this.state === 'idle' || this.state === 'closed') {
      this.setAnchorPoint(point)
      this.doOpen()
    }
  }

  /* ------------------------------------------------------ machine linking */

  private getRootMenu(): NativeMenuBehavior {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let menu: NativeMenuBehavior = this
    while (menu.isSubmenu && menu.parent) menu = menu.parent
    return menu
  }

  /** Zag's releaseParentRoutingLock (CLOSE actions, submenus only). */
  private releaseParentRoutingLock(): void {
    if (!this.isSubmenu || !this.parent) return
    if (!this.parent.isHighlightedSubmenuOpen()) this.parent.pointerRoutingLocked = false
  }

  /** Zag's unlockParentOnClose (closed-state entry). */
  private unlockParentOnClose(): void {
    const parent = this.parent
    if (!parent) return
    if (parent.pointerRoutingLocked) return
    if (this.isSubmenu && parent.isHighlightedSubmenuOpen()) return
    parent.pointerRoutingLocked = false
  }

  private isHighlightedSubmenuOpen(): boolean {
    const highlighted = this.highlightedValue
    if (!highlighted) return false
    for (const child of this.children.values()) {
      if (child.isOpen && child.triggerId === highlighted) return true
    }
    return false
  }

  /* ----------------------------------------------------------------- dom */

  private get triggerId(): string {
    return `menu:${this.props.id}:trigger`
  }

  private get contentId(): string {
    return `menu:${this.props.id}:content`
  }

  private getEl(part: 'trigger' | 'content' | 'popper' | 'ctx-trigger'): HTMLElement | null {
    return document.getElementById(`menu:${this.props.id}:${part}`)
  }

  private hasContextTrigger(): boolean {
    return this.getEl('ctx-trigger') != null
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): MenuApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this

    function getItemBag(props: MenuItemProps): Record<string, unknown> {
      const { value, valueText, closeOnSelect } = props
      const disabled = !!props.disabled
      const highlighted = self.highlightedValue === value
      return {
        'data-scope': 'menu',
        'data-part': 'item',
        id: `${self.props.id}/${value}`,
        role: 'menuitem',
        'aria-disabled': disabled || undefined,
        'data-disabled': dataAttr(disabled),
        'data-ownedby': self.contentId,
        'data-highlighted': dataAttr(highlighted),
        'data-value': value,
        'data-valuetext': valueText,
        ondragstart(event: DragEvent) {
          if ((event.currentTarget as HTMLElement).matches('a[href]')) event.preventDefault()
        },
        onpointermove(event: PointerEvent) {
          if (disabled || event.pointerType !== 'mouse') return
          if (self.highlightedValue === value) return
          self.recordEvent(true)
          self.itemPointerMove(value, event.currentTarget as HTMLElement, getPoint(event))
        },
        onpointerleave(event: PointerEvent) {
          if (disabled || event.pointerType !== 'mouse') return
          // Zag reads event.previous(): the event BEFORE the last one
          if (!self.prevEventPointer) return
          self.recordEvent(true)
          if (self.state !== 'open') return
          if (self.pointerRoutingLocked) return
          if (isTriggerItemEl(event.currentTarget as HTMLElement)) return
          self.setHighlighted(null)
        },
        onpointerdown(event: PointerEvent) {
          if (disabled) return
          self.recordEvent(true)
          if (self.state === 'open') {
            self.setHighlighted((event.currentTarget as HTMLElement).dataset.value ?? null)
          }
        },
        onclick(event: MouseEvent) {
          if (isDownloadingEvent(event) || isOpeningInNewTab(event) || disabled) return
          self.recordEvent(false)
          self.itemClick(event.currentTarget as HTMLElement, closeOnSelect)
        },
      }
    }

    return {
      get open() {
        return self.isOpen
      },
      get highlightedValue() {
        return self.highlightedValue
      },
      setOpen(nextOpen: boolean) {
        if (self.isOpen === nextOpen) return
        self.recordEvent(false)
        if (nextOpen) self.doOpen()
        else self.doClose()
      },
      setHighlightedValue(value: string | null) {
        self.setHighlighted(value)
      },
      setParent(parent: MenuService) {
        self.parent = parent as NativeMenuBehavior
        self.isSubmenu = true
        self.notify()
      },
      setChild(child: MenuService) {
        const childBehavior = child as NativeMenuBehavior
        self.children.set(childBehavior.props.id, childBehavior)
      },
      reposition(options: PositioningOptions = {}) {
        if (!self.isOpen) return
        if (self.anchorPoint) {
          self.repositionToAnchor()
          return
        }
        trackPlacement(
          () => self.getEl('trigger'),
          () => self.getEl('popper'),
          {
            ...self.effectivePositioning(),
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
          'data-scope': 'menu',
          'data-part': self.isSubmenu ? 'trigger-item' : 'trigger',
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          type: 'button',
          dir: self.props.dir,
          id: self.triggerId,
          'data-uid': self.props.id,
          'aria-haspopup': self.props.composite ? 'menu' : 'dialog',
          'aria-controls': self.contentId,
          'data-controls': self.contentId,
          'aria-expanded': open,
          'data-state': open ? 'open' : 'closed',
          onpointermove(event: PointerEvent) {
            if (event.pointerType !== 'mouse') return
            if (isTargetDisabled(event.currentTarget) || !self.isSubmenu) return
            self.recordEvent(true)
            self.triggerPointerMove(event.currentTarget as HTMLElement, getPoint(event))
          },
          onpointerleave(event: PointerEvent) {
            if (isTargetDisabled(event.currentTarget)) return
            if (event.pointerType !== 'mouse' || !self.isSubmenu) return
            if (self.parent) self.parent.pointerRoutingLocked = true
            self.recordEvent(true)
            self.triggerPointerLeave(getPoint(event))
          },
          onpointerdown(event: PointerEvent) {
            if (isTargetDisabled(event.currentTarget)) return
            if (isContextMenuPress(event)) return
            event.preventDefault()
          },
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            if (isTargetDisabled(event.currentTarget)) return
            self.recordEvent(false)
            self.triggerClick(event.currentTarget as HTMLElement)
          },
          onfocusout() {
            self.recordEvent(false)
            if (self.state === 'closed') self.state = 'idle'
          },
          onfocusin() {
            self.recordEvent(false)
            if (self.state === 'idle' && !self.isSubmenu) self.state = 'closed'
          },
          onkeydown(event: KeyboardEvent) {
            self.triggerKeydown(event)
          },
        }
      },
      getContextTriggerProps() {
        return {
          'data-scope': 'menu',
          'data-part': 'context-trigger',
          dir: self.props.dir,
          id: `menu:${self.props.id}:ctx-trigger`,
          'data-ownedby': self.props.id,
          'data-state': self.isOpen ? 'open' : 'closed',
          onpointerdown(event: PointerEvent) {
            if (event.pointerType === 'mouse') return
            self.recordEvent(false) // CONTEXT_MENU_START
            self.contextMenuStart(getPoint(event))
          },
          onpointercancel(event: PointerEvent) {
            if (event.pointerType === 'mouse') return
            self.recordEvent(false)
            self.contextMenuCancel()
          },
          onpointermove(event: PointerEvent) {
            if (event.pointerType === 'mouse') return
            self.recordEvent(false)
            self.contextMenuCancel()
          },
          onpointerup(event: PointerEvent) {
            if (event.pointerType === 'mouse') return
            self.recordEvent(false)
            self.contextMenuCancel()
          },
          oncontextmenu(event: MouseEvent) {
            self.recordEvent(false)
            self.contextMenu(getPoint(event))
            event.preventDefault()
          },
          style: '-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;',
        }
      },
      getTriggerItemProps(childApi: MenuApi) {
        const triggerProps = childApi.getTriggerProps()
        return mergeItemTriggerProps(getItemBag({ value: triggerProps.id as string }), triggerProps)
      },
      getPositionerProps() {
        return {
          'data-scope': 'menu',
          'data-part': 'positioner',
          dir: self.props.dir,
          id: `menu:${self.props.id}:popper`,
          style: getFloatingStyleString(self.currentPlacement, self.effectivePositioning()),
        }
      },
      getContentProps() {
        const open = self.isOpen
        return {
          'data-scope': 'menu',
          'data-part': 'content',
          id: self.contentId,
          'aria-label': self.props['aria-label'],
          hidden: !open,
          'data-state': open ? 'open' : 'closed',
          role: self.props.composite ? 'menu' : 'dialog',
          tabindex: 0,
          dir: self.props.dir,
          'aria-activedescendant': self.highlightedId() || undefined,
          'aria-labelledby': self.anchorPoint
            ? `menu:${self.props.id}:ctx-trigger`
            : self.triggerId,
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          onpointerenter(event: PointerEvent) {
            if (event.pointerType !== 'mouse') return
            self.recordEvent(true) // MENU_POINTERENTER
            if (self.state === 'closing') {
              self.intentPolygon = null
              self.doOpen()
            }
          },
          onkeydown(event: KeyboardEvent) {
            self.contentKeydown(event)
          },
        }
      },
      getSeparatorProps() {
        return {
          'data-scope': 'menu',
          'data-part': 'separator',
          role: 'separator',
          dir: self.props.dir,
          'aria-orientation': 'horizontal',
        }
      },
      getItemProps(props: MenuItemProps) {
        return getItemBag(props)
      },
      getOptionItemProps(props: MenuOptionItemProps) {
        const valueText = props.valueText ?? props.value
        const checked = !!props.checked
        const bag = getItemBag({ ...props, valueText })
        return {
          ...bag,
          'data-type': props.type,
          'data-scope': 'menu',
          'data-part': 'item',
          dir: self.props.dir,
          'data-value': props.value,
          role: `menuitem${props.type}`,
          'aria-checked': checked,
          'data-state': checked ? 'checked' : 'unchecked',
          onclick(event: MouseEvent) {
            if (props.disabled) return
            if (isDownloadingEvent(event) || isOpeningInNewTab(event)) return
            self.recordEvent(false)
            self.itemClick(event.currentTarget as HTMLElement, props.closeOnSelect, props)
          },
        }
      },
      getItemIndicatorProps(props: MenuItemIndicatorProps) {
        const checked = !!props.checked
        const hasChecked = 'checked' in props
        return {
          'data-scope': 'menu',
          'data-part': 'item-indicator',
          dir: self.props.dir,
          'data-disabled': dataAttr(!!props.disabled),
          'data-highlighted': dataAttr(self.highlightedValue === props.value),
          'data-state': hasChecked ? (checked ? 'checked' : 'unchecked') : undefined,
          hidden: hasChecked ? !checked : undefined,
        }
      },
      getItemGroupProps(props: { id: string }) {
        return {
          id: `menu:${self.props.id}:group:${props.id}`,
          'data-scope': 'menu',
          'data-part': 'item-group',
          dir: self.props.dir,
          'aria-labelledby': `menu:${self.props.id}:group-label:${props.id}`,
          role: 'group',
        }
      },
      getItemGroupLabelProps(props: { htmlFor: string }) {
        return {
          id: `menu:${self.props.id}:group-label:${props.htmlFor}`,
          'data-scope': 'menu',
          'data-part': 'item-group-label',
          dir: self.props.dir,
        }
      },
    }
  }
}

export const createNativeMenuBehavior = (): NativeMenuBehavior => new NativeMenuBehavior()
