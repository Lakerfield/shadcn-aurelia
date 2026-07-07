/**
 * Message-scroller engine — native port of upstream shadcn's message-scroller
 * primitive (`shadcn-ui/packages/react/src/message-scroller`, no Zag machine
 * exists for this). The geometry and mode/command logic follow upstream; the
 * React hook glue is replaced by an imperative engine that owns its DOM
 * observers/listeners, in the same shape as the table/chart engines.
 *
 * Behavior contract (matches upstream):
 * - modes: following-bottom / free-scrolling / anchored-to-message /
 *   settling-jump (internal, during a programmatic jump)
 * - `data-scrollable="start end"` + `data-autoscrolling` on root and viewport
 * - new `data-scroll-anchor` items anchor at the reading line with the
 *   previous item peeking above; a tail spacer keeps the turn holdable
 * - prepends preserve the reader's position; user scroll intent (wheel,
 *   touch, scroll keys) releases follow-bottom and anchoring
 * - commands: scrollToEnd / scrollToStart / scrollToMessage (queued until the
 *   target row mounts)
 *
 * Not ported (v1): the visibility store (IntersectionObserver-based
 * visibleMessageIds/currentAnchorId hooks) — the styled component does not
 * consume it.
 */

const DEFAULT_SCROLL_EDGE_THRESHOLD = 8
const DEFAULT_SCROLL_PREVIOUS_ITEM_PEEK = 64
const DEFAULT_SCROLL_MARGIN = 0
const SCROLL_POSITION_EPSILON = 0.5
const AUTOSCROLLING_CLEAR_DELAY = 180

/** Viewport keys that count as deliberate scroll intent. */
const USER_SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp', ' '])

export interface MessageScrollerScrollable {
  /** Content extends above the viewport (can scroll toward the start). */
  start: boolean
  /** Content extends below the viewport (can scroll toward the end). */
  end: boolean
}

export type MessageScrollerScrollAlign = 'start' | 'center' | 'end' | 'nearest'
export type MessageScrollerDefaultScrollPosition = 'start' | 'end' | 'last-anchor' | false

export interface MessageScrollerScrollOptions {
  behavior?: ScrollBehavior
  align?: MessageScrollerScrollAlign
  scrollMargin?: number
}

export interface MessageScrollerOptions {
  /** Follow the live end: new appends keep the viewport pinned to the bottom. */
  autoScroll?: boolean
  defaultScrollPosition?: MessageScrollerDefaultScrollPosition
  scrollEdgeThreshold?: number
  scrollPreviousItemPeek?: number
  scrollMargin?: number
  /** Keep the reader's position when older rows are prepended (default true). */
  preserveScrollOnPrepend?: boolean
}

type Mode = 'following-bottom' | 'free-scrolling' | 'anchored-to-message' | 'settling-jump'

interface PrependAnchor {
  element: HTMLElement
  viewportTop: number
}

const EMPTY_SCROLLABLE: MessageScrollerScrollable = { start: false, end: false }

function readCssPixel(value: string | undefined): number {
  if (!value) return 0
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

function getBlockPadding(element: HTMLElement): { start: number; end: number } {
  const style = window.getComputedStyle(element)
  return {
    start: readCssPixel(style.paddingBlockStart || style.paddingTop),
    end: readCssPixel(style.paddingBlockEnd || style.paddingBottom),
  }
}

function getFlexGap(element: HTMLElement | null): number {
  if (!element) return 0
  const style = window.getComputedStyle(element)
  const gap = style.rowGap === 'normal' ? style.gap : style.rowGap
  return readCssPixel(gap)
}

export class MessageScrollerEngine {
  private root: HTMLElement | null = null
  private viewport: HTMLElement | null = null
  private content: HTMLElement | null = null
  private spacer: HTMLElement | null = null

  private readonly autoScroll: boolean
  private readonly defaultScrollPosition: MessageScrollerDefaultScrollPosition
  private readonly scrollEdgeThreshold: number
  private readonly scrollPreviousItemPeek: number
  private readonly scrollMargin: number
  private preserveScrollOnPrepend: boolean

  private mode: Mode = 'free-scrolling'
  private state: MessageScrollerScrollable = EMPTY_SCROLLABLE
  private autoscrolling = false
  private autoscrollingTimeout: number | null = null
  private stateFrame: number | null = null

  private itemCount = 0
  private firstItem: HTMLElement | null = null
  private prependRestore: PrependAnchor | null = null
  private anchoredElement: HTMLElement | null = null
  private readonly handledScrollAnchors = new WeakSet<HTMLElement>()
  private defaultScrollPositionApplied = false

  private spacerHeight = 0
  private spacerGap = 0

  private readonly messageElements = new Map<string, HTMLElement>()
  private pendingScrollToMessage: {
    messageId: string
    options?: MessageScrollerScrollOptions
  } | null = null
  private pendingScrollFrame: number | null = null

  private readonly listeners = new Set<(state: MessageScrollerScrollable) => void>()

  private mutationObserver: MutationObserver | null = null
  private viewportResizeObserver: ResizeObserver | null = null
  private contentResizeObserver: ResizeObserver | null = null
  private readonly viewportListeners: Array<[string, EventListener]> = []

  constructor(options: MessageScrollerOptions = {}) {
    this.autoScroll = options.autoScroll ?? false
    this.defaultScrollPosition = options.defaultScrollPosition ?? 'end'
    this.scrollEdgeThreshold = options.scrollEdgeThreshold ?? DEFAULT_SCROLL_EDGE_THRESHOLD
    this.scrollPreviousItemPeek =
      options.scrollPreviousItemPeek ?? DEFAULT_SCROLL_PREVIOUS_ITEM_PEEK
    this.scrollMargin = options.scrollMargin ?? DEFAULT_SCROLL_MARGIN
    this.preserveScrollOnPrepend = options.preserveScrollOnPrepend ?? true
    if (this.autoScroll) this.mode = 'following-bottom'
  }

  // ---- element wiring -----------------------------------------------------

  setRoot(element: HTMLElement | null): void {
    this.root = element
    if (element) this.writeStateAttributes()
  }

  setViewport(element: HTMLElement | null): void {
    if (this.viewport) {
      for (const [type, listener] of this.viewportListeners) {
        this.viewport.removeEventListener(type, listener)
      }
      this.viewportListeners.length = 0
      this.viewportResizeObserver?.disconnect()
      this.viewportResizeObserver = null
    }

    this.viewport = element
    if (!element) return

    const on = (type: string, listener: EventListener, options?: AddEventListenerOptions) => {
      element.addEventListener(type, listener, options)
      this.viewportListeners.push([type, listener])
    }

    on('scroll', () => this.syncAfterScroll(), { passive: true })
    on('wheel', () => this.userScrollIntent(), { passive: true })
    on('touchmove', () => this.userScrollIntent(), { passive: true })
    on('keydown', (event) => {
      if (USER_SCROLL_KEYS.has((event as KeyboardEvent).key)) this.userScrollIntent()
    })

    if (typeof ResizeObserver !== 'undefined') {
      this.viewportResizeObserver = new ResizeObserver(() => this.handleResize())
      this.viewportResizeObserver.observe(element)
    }

    this.writeStateAttributes()

    // Wiring order is not guaranteed: if content mounted first, its
    // first-content pass ran without a viewport — replay it now so the
    // default scroll position still applies.
    if (this.content && this.itemCount > 0 && !this.defaultScrollPositionApplied) {
      this.itemCount = 0
      this.firstItem = null
      this.handleContentChange()
    }
  }

  setContent(element: HTMLElement | null): void {
    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    this.contentResizeObserver?.disconnect()
    this.contentResizeObserver = null
    if (this.spacer) {
      this.spacer.remove()
      this.spacer = null
    }

    this.content = element
    if (!element) return

    // Tail spacer: lets an anchored turn sit at the reading line even when
    // there is not enough content below it yet.
    const spacer = element.ownerDocument.createElement('div')
    spacer.setAttribute('aria-hidden', 'true')
    spacer.setAttribute('data-message-scroller-spacer', '')
    spacer.hidden = true
    element.appendChild(spacer)
    this.spacer = spacer
    this.spacerGap = getFlexGap(element)

    this.handleContentChange()

    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(() => this.handleContentChange())
      this.mutationObserver.observe(element, { childList: true })
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.contentResizeObserver = new ResizeObserver(() => this.handleResize())
      this.contentResizeObserver.observe(element)
    }
  }

  /** Items register so scrollToMessage can resolve (and queue) targets by id. */
  registerItem(messageId: string, element: HTMLElement | null, removed?: HTMLElement | null): void {
    if (element) {
      this.messageElements.set(messageId, element)
      if (this.pendingScrollToMessage?.messageId === messageId) {
        this.schedulePendingScrollToMessageFlush()
      }
      return
    }
    if (removed && this.messageElements.get(messageId) === removed) {
      this.messageElements.delete(messageId)
    }
  }

  destroy(): void {
    this.setViewport(null)
    this.setContent(null)
    if (this.stateFrame !== null) cancelAnimationFrame(this.stateFrame)
    if (this.pendingScrollFrame !== null) cancelAnimationFrame(this.pendingScrollFrame)
    if (this.autoscrollingTimeout !== null) clearTimeout(this.autoscrollingTimeout)
    this.stateFrame = null
    this.pendingScrollFrame = null
    this.autoscrollingTimeout = null
    this.listeners.clear()
    this.messageElements.clear()
    this.root = null
  }

  // ---- state --------------------------------------------------------------

  getState(): MessageScrollerScrollable {
    return this.state
  }

  subscribe(listener: (state: MessageScrollerScrollable) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.state)
  }

  // ---- geometry (ported from upstream geometry.ts) --------------------------

  private getItems(): HTMLElement[] {
    if (!this.content) return []
    return Array.from(this.content.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement && child !== this.spacer,
    )
  }

  /** Bottom edge of real content, ignoring the tail spacer. */
  private getContentBottom(): number {
    const content = this.content
    const viewport = this.viewport
    if (!content || !viewport) return 0
    const items = this.getItems()
    const padding = getBlockPadding(content)
    const viewportRect = viewport.getBoundingClientRect()
    const scrollTop = viewport.scrollTop
    let contentBottom = padding.start + padding.end
    for (const item of items) {
      const rect = item.getBoundingClientRect()
      contentBottom = Math.max(
        contentBottom,
        rect.bottom - viewportRect.top + scrollTop + padding.end,
      )
    }
    return contentBottom
  }

  private getScrollable(): MessageScrollerScrollable {
    const viewport = this.viewport
    if (!viewport || !this.content) return EMPTY_SCROLLABLE
    const contentBottom = this.getContentBottom()
    return {
      start: viewport.scrollTop > this.scrollEdgeThreshold,
      end: contentBottom - viewport.scrollTop - viewport.clientHeight > this.scrollEdgeThreshold,
    }
  }

  private getMaxScrollTop(): number {
    const viewport = this.viewport
    if (!viewport) return 0
    return Math.max(0, viewport.scrollHeight - viewport.clientHeight)
  }

  private getElementTop(element: HTMLElement): number {
    const viewport = this.viewport!
    return (
      element.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top +
      viewport.scrollTop
    )
  }

  private getElementViewportTop(element: HTMLElement): number {
    const viewport = this.viewport!
    return element.getBoundingClientRect().top - viewport.getBoundingClientRect().top
  }

  private getContentBlockPadding(): { start: number; end: number } {
    return this.content ? getBlockPadding(this.content) : { start: 0, end: 0 }
  }

  private getElementScrollTop(
    element: HTMLElement,
    align: MessageScrollerScrollAlign,
    scrollMargin: number,
  ): number {
    const viewport = this.viewport!
    const elementTop = this.getElementTop(element)
    const elementHeight = element.getBoundingClientRect().height
    const contentPadding = this.getContentBlockPadding()

    if (align === 'center') {
      const insetHeight = Math.max(
        0,
        viewport.clientHeight - contentPadding.start - contentPadding.end,
      )
      return elementTop - contentPadding.start - (insetHeight - elementHeight) / 2 - scrollMargin
    }
    if (align === 'end') {
      return elementTop - viewport.clientHeight + elementHeight + contentPadding.end + scrollMargin
    }
    if (align === 'nearest') {
      const elementBottom = elementTop + elementHeight
      const viewportTop = viewport.scrollTop + contentPadding.start
      const viewportBottom = viewport.scrollTop + viewport.clientHeight - contentPadding.end
      if (elementTop >= viewportTop && elementBottom <= viewportBottom) return viewport.scrollTop
      if (elementTop < viewportTop) return elementTop - contentPadding.start - scrollMargin
      return elementBottom - viewport.clientHeight + contentPadding.end + scrollMargin
    }
    return elementTop - contentPadding.start - scrollMargin
  }

  private getTailSpacerHeight(scrollTop: number): number {
    const viewport = this.viewport!
    return scrollTop + viewport.clientHeight - this.getContentBottom()
  }

  // ---- attribute + mode bookkeeping -----------------------------------------

  private writeStateAttributes(): void {
    const scrollable = [this.state.start && 'start', this.state.end && 'end']
      .filter(Boolean)
      .join(' ')
    for (const element of [this.root, this.viewport]) {
      if (!element) continue
      if (scrollable) element.setAttribute('data-scrollable', scrollable)
      else element.removeAttribute('data-scrollable')
      element.toggleAttribute('data-autoscrolling', this.autoscrolling)
    }
  }

  /**
   * Arm follow-bottom at the bottom, release on any scroll away — suppressed
   * during a programmatic scroll so auto-scroll cannot release itself.
   * (`state.end` true = content extends below, i.e. NOT at the bottom.)
   */
  private reconcileFollowMode(next: MessageScrollerScrollable): void {
    if (this.autoScroll && !next.end && this.mode !== 'settling-jump') {
      this.mode = 'following-bottom'
    } else if (this.mode === 'following-bottom' && next.end && !this.autoscrolling) {
      this.mode = 'free-scrolling'
    }
  }

  private commitScrollState(): void {
    const next = this.getScrollable()
    this.reconcileFollowMode(next)
    const changed = next.start !== this.state.start || next.end !== this.state.end
    this.state = next
    this.writeStateAttributes()
    if (changed) this.notify()
  }

  private scheduleStateCommit(): void {
    if (this.stateFrame !== null) return
    this.stateFrame = requestAnimationFrame(() => {
      this.stateFrame = null
      this.commitScrollState()
    })
  }

  private userScrollIntent(): void {
    if (
      this.mode === 'following-bottom' ||
      this.mode === 'anchored-to-message' ||
      this.mode === 'settling-jump'
    ) {
      this.anchoredElement = null
      this.mode = 'free-scrolling'
    }
  }

  private syncAfterScroll(): void {
    this.commitScrollState()
    this.capturePrependAnchor()
  }

  // ---- commands (ported from upstream use-message-scroller-commands.ts) -----

  private setAutoScrolling(autoscrolling: boolean): void {
    if (this.autoscrollingTimeout !== null) {
      clearTimeout(this.autoscrollingTimeout)
      this.autoscrollingTimeout = null
    }
    if (this.autoscrolling !== autoscrolling) {
      this.autoscrolling = autoscrolling
      this.commitScrollState()
    }
    if (autoscrolling) {
      this.autoscrollingTimeout = window.setTimeout(() => {
        this.autoscrollingTimeout = null
        this.autoscrolling = false
        this.commitScrollState()
      }, AUTOSCROLLING_CLEAR_DELAY)
    }
  }

  private setTailSpacerHeight(height: number): void {
    const spacer = this.spacer
    if (!spacer) return
    const next = Math.max(0, Math.ceil(height))
    if (this.spacerHeight === next) return
    this.spacerHeight = next
    spacer.hidden = next === 0
    spacer.style.height = `${next}px`
    spacer.style.marginTop = next > 0 ? `${-this.spacerGap}px` : ''
  }

  private scrollToPosition(
    scrollTop: number,
    behavior: ScrollBehavior,
    autoscrolling = false,
  ): void {
    const viewport = this.viewport
    if (!viewport) return
    const next = Math.max(0, scrollTop)
    if (Math.abs(viewport.scrollTop - next) <= SCROLL_POSITION_EPSILON) {
      viewport.scrollTop = next
      this.commitScrollState()
      return
    }
    if (autoscrolling) this.setAutoScrolling(true)
    viewport.scrollTo({ top: next, behavior })
    this.scheduleStateCommit()
  }

  scrollToStart(options: MessageScrollerScrollOptions = {}): boolean {
    if (!this.viewport) return false
    this.setTailSpacerHeight(0)
    this.anchoredElement = null
    this.mode = 'free-scrolling'
    this.scrollToPosition(0, options.behavior ?? 'auto')
    return true
  }

  scrollToEnd(options: MessageScrollerScrollOptions = {}): boolean {
    if (!this.viewport) return false
    this.setTailSpacerHeight(0)
    this.anchoredElement = null
    this.mode = this.autoScroll ? 'following-bottom' : 'free-scrolling'
    this.scrollToPosition(this.getMaxScrollTop(), options.behavior ?? 'auto', true)
    return true
  }

  private scrollToElement(
    element: HTMLElement,
    options: MessageScrollerScrollOptions = {},
    { keepPreviousPeek = false } = {},
  ): boolean {
    const content = this.content
    const viewport = this.viewport
    if (!content || !viewport || !content.contains(element)) return false

    const baseMargin = options.scrollMargin ?? this.scrollMargin
    const scrollTop = this.getElementScrollTop(
      element,
      options.align ?? 'start',
      keepPreviousPeek ? baseMargin + this.scrollPreviousItemPeek : baseMargin,
    )
    this.setTailSpacerHeight(this.getTailSpacerHeight(scrollTop))

    // Seed the prepend anchor with the jump target so a prepend landing before
    // the scroll settles still preserves the jumped-to row.
    this.prependRestore = { element, viewportTop: this.getElementViewportTop(element) }
    this.mode = keepPreviousPeek ? 'anchored-to-message' : 'settling-jump'
    this.anchoredElement = keepPreviousPeek ? element : null

    this.scrollToPosition(scrollTop, options.behavior ?? 'auto')
    return true
  }

  scrollToMessage(messageId: string, options?: MessageScrollerScrollOptions): boolean {
    const element = this.messageElements.get(messageId)
    if (!element) {
      if (this.itemCount === 0) {
        this.pendingScrollToMessage = { messageId, options }
        this.defaultScrollPositionApplied = true
        return true
      }
      return false
    }
    this.defaultScrollPositionApplied = true
    if (this.scrollToElement(element, options)) {
      this.pendingScrollToMessage = null
      return true
    }
    this.pendingScrollToMessage = { messageId, options }
    return true
  }

  private flushPendingScrollToMessage(): boolean {
    const pending = this.pendingScrollToMessage
    if (!pending) return false
    const element = this.messageElements.get(pending.messageId)
    if (!element) return false
    if (!this.scrollToElement(element, pending.options)) return false
    this.pendingScrollToMessage = null
    this.defaultScrollPositionApplied = true
    return true
  }

  private schedulePendingScrollToMessageFlush(): void {
    if (this.pendingScrollFrame !== null) return
    this.pendingScrollFrame = requestAnimationFrame(() => {
      this.pendingScrollFrame = null
      if (this.flushPendingScrollToMessage()) this.capturePrependAnchor()
    })
  }

  /** Hold the anchored turn at the reading line as content below it resizes. */
  private reanchorToAnchoredMessage(): boolean {
    const element = this.anchoredElement
    if (!element || !element.isConnected || this.mode !== 'anchored-to-message') return false
    return this.scrollToElement(element, { align: 'start' }, { keepPreviousPeek: true })
  }

  // ---- prepend preservation --------------------------------------------------

  private capturePrependAnchor(): void {
    const content = this.content
    const viewport = this.viewport
    if (!content || !viewport) {
      this.prependRestore = null
      return
    }
    const viewportRect = viewport.getBoundingClientRect()
    for (const item of this.getItems()) {
      const rect = item.getBoundingClientRect()
      if (rect.bottom > viewportRect.top && rect.top < viewportRect.bottom) {
        this.prependRestore = { element: item, viewportTop: this.getElementViewportTop(item) }
        return
      }
    }
    this.prependRestore = null
  }

  /**
   * Restore the anchor's viewport-relative position. A no-op where native
   * scroll anchoring already handled the prepend; corrects engines that did not.
   */
  private restorePrependedAnchor(): boolean {
    const anchor = this.prependRestore
    const viewport = this.viewport
    if (!anchor || !viewport || !anchor.element.isConnected) return false
    const nextViewportTop = this.getElementViewportTop(anchor.element)
    const delta = nextViewportTop - anchor.viewportTop
    if (Math.abs(delta) <= SCROLL_POSITION_EPSILON) return false
    viewport.scrollTop += delta
    anchor.viewportTop = this.getElementViewportTop(anchor.element)
    this.scheduleStateCommit()
    return true
  }

  // ---- content/resize reconciliation ------------------------------------------

  private applyDefaultScrollPosition(): boolean {
    if (!this.defaultScrollPosition || this.defaultScrollPositionApplied || this.itemCount === 0) {
      return false
    }
    let handled = false
    if (this.defaultScrollPosition === 'last-anchor') {
      const items = this.getItems()
      let anchor: HTMLElement | null = null
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].dataset.scrollAnchor === 'true') {
          anchor = items[i]
          break
        }
      }
      if (!anchor || !this.viewport) {
        handled = this.scrollToEnd({ behavior: 'auto' })
      } else {
        const lastTurnFits =
          this.getContentBottom() - this.getElementTop(anchor) <= this.viewport.clientHeight
        handled = lastTurnFits
          ? this.scrollToEnd({ behavior: 'auto' })
          : this.scrollToElement(anchor, { align: 'start' }, { keepPreviousPeek: true })
      }
    } else {
      handled =
        this.defaultScrollPosition === 'end'
          ? this.scrollToEnd({ behavior: 'auto' })
          : this.scrollToStart({ behavior: 'auto' })
    }
    if (!handled) return false
    this.defaultScrollPositionApplied = true
    return true
  }

  private handleContentChange(): void {
    if (!this.content) return
    const items = this.getItems()
    const previousItemCount = this.itemCount
    const previousFirstItem = this.firstItem
    this.itemCount = items.length
    this.firstItem = items[0] ?? null

    // Branch order is load-bearing: first-content, prepended, appended, updated.
    const reconcile = (): void => {
      if (this.flushPendingScrollToMessage()) return

      if (previousItemCount === 0) {
        if (this.applyDefaultScrollPosition()) return
        if (items.length > 0 && this.autoScroll && this.scrollToEnd({ behavior: 'auto' })) return
        this.commitScrollState()
        return
      }

      const previousFirstItemIndex = previousFirstItem ? items.indexOf(previousFirstItem) : -1
      if (this.preserveScrollOnPrepend && previousFirstItemIndex > 0) {
        this.restorePrependedAnchor()
        return
      }

      if (items.length > previousItemCount) {
        let anchor: HTMLElement | null = null
        let anchorCount = 0
        for (let i = previousItemCount; i < items.length; i++) {
          if (items[i].dataset.scrollAnchor === 'true') {
            anchor ??= items[i]
            anchorCount++
          }
        }
        if (anchor) {
          // Several anchored turns arriving at once while following the live
          // end keep following the end; a single new anchor moves to the line.
          if (this.autoScroll && this.mode === 'following-bottom' && anchorCount > 1) {
            this.scrollToEnd({ behavior: 'auto' })
            return
          }
          this.scrollToElement(anchor, { align: 'start' }, { keepPreviousPeek: true })
          this.handledScrollAnchors.add(anchor)
          return
        }
      }

      if (items.length === previousItemCount) {
        const anchor = items.find(
          (item) => item.dataset.scrollAnchor === 'true' && !this.handledScrollAnchors.has(item),
        )
        if (anchor) {
          this.scrollToElement(anchor, { align: 'start' }, { keepPreviousPeek: true })
          this.handledScrollAnchors.add(anchor)
          return
        }
      }

      if (this.mode === 'following-bottom' && this.autoScroll) {
        this.scrollToEnd({ behavior: 'auto' })
      } else {
        this.commitScrollState()
      }
    }

    reconcile()
    this.capturePrependAnchor()
  }

  private handleResize(): void {
    if (this.mode === 'following-bottom' && this.autoScroll) {
      this.scrollToEnd({ behavior: 'auto' })
      return
    }
    if (this.reanchorToAnchoredMessage()) return
    this.scheduleStateCommit()
  }
}

export function createMessageScrollerEngine(
  options: MessageScrollerOptions = {},
): MessageScrollerEngine {
  return new MessageScrollerEngine(options)
}
