/**
 * Native select engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/select` behind the facade: the prop bags
 * (trigger/positioner/content/item/…) emit the exact attribute, ARIA, style
 * and event contract the Zag connect produced (keys pre-normalized the way
 * `@zag-js/vanilla` would), verified by the dual-engine suite in
 * `test/select.spec.ts`.
 *
 * Model (Zag's three states): idle ⇄ focused → open. The item list lives in
 * a `ListCollection` from `@zag-js/collection` (the same pure data structure
 * the facade's `createListCollection` hands to registry code — it carries the
 * navigation, sort and typeahead-search logic for both engines). Opening
 * attaches, one frame deferred (Zag `defer: true`):
 *   • a dismissable layer — Escape + outside press close; an outside press on
 *     a focusable target skips the focus restore (Zag's `restoreFocus`)
 *   • floating-ui placement tracking on the positioner
 *   • scroll-to-highlighted — the open is marked `virtual` interaction
 *     modality so the first selected item scrolls into view; pointer
 *     highlights never scroll (Zag's modality gate)
 * Keyboard on the closed trigger: Enter/Space/ArrowDown open highlighting the
 * first (or first selected) item, ArrowUp opens highlighting the last,
 * ArrowLeft/Right/Home/End select without opening, printable keys typeahead-
 * select. In the open content: arrows move the highlight (loopFocus opt-in),
 * Enter/Space select, printable keys typeahead-highlight, Tab is trapped
 * (options are never tabbable).
 *
 * Not ported (unused by the registry component): `multiple`/`deselectable`,
 * the controlled `open`/`value`/`highlightedValue` props, the hidden-select
 * form part (name/form/autoComplete + form-reset tracking), clear-trigger
 * part, `scrollToIndexFn`, `composite: false` mode, focus-outside dismissal
 * (Tab is trapped inside the open content, so focus can only leave via a
 * pointer press, which the layer already handles).
 */
import { ListCollection, deriveSelectionState, resolveSelectedItems } from '@zag-js/collection'
import type { CollectionItem } from '@zag-js/collection'
import type { BehaviorSource } from '../adapter/zag-behavior'
import { createDismissableLayer } from '../internal/dismissable-layer'
import {
  ensureInteractionModalityTracking,
  getInteractionModality,
  setInteractionModality,
} from '../internal/interaction-modality'
import { getEventKey } from './keyboard'
import {
  getFloatingStyleString,
  getPlacementSide,
  trackPlacement,
  type Placement,
  type PositioningOptions,
} from './positioning'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type SelectProps = {
  /** Unique machine id — element ids derive from it (`select:{id}:content`). */
  id: string
  collection?: ListCollection<CollectionItem>
  dir?: 'ltr' | 'rtl'
  defaultValue?: string[]
  defaultHighlightedValue?: string | null
  defaultOpen?: boolean
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  readOnly?: boolean
  /** Arrow navigation wraps around. Zag default: false. */
  loopFocus?: boolean
  /** Close the listbox after selecting. Zag default: true (single select). */
  closeOnSelect?: boolean
  positioning?: PositioningOptions
  onValueChange?: (details: { value: string[]; items: CollectionItem[] }) => void
  onHighlightChange?: (details: {
    highlightedValue: string | null
    highlightedItem: CollectionItem | null
    highlightedIndex: number
  }) => void
  onOpenChange?: (details: { open: boolean; value: string[] }) => void
  onSelect?: (details: { value: string }) => void
}

export interface SelectItemProps {
  item: CollectionItem
  /** Keep the highlight when the pointer leaves the item. */
  persistFocus?: boolean
}

export interface SelectItemState {
  value: string
  disabled: boolean
  highlighted: boolean
  selected: boolean
}

export interface SelectApi {
  open: boolean
  focused: boolean
  empty: boolean
  value: string[]
  valueAsString: string
  hasSelectedItems: boolean
  highlightedValue: string | null
  highlightedItem: CollectionItem | null
  selectedItems: CollectionItem[]
  collection: ListCollection<CollectionItem>
  multiple: boolean
  disabled: boolean
  focus(): void
  setOpen(open: boolean): void
  reposition(options?: PositioningOptions): void
  selectValue(value: string): void
  setValue(value: string[]): void
  clearValue(value?: string): void
  setHighlightValue(value: string): void
  clearHighlightValue(): void
  getItemState(props: SelectItemProps): SelectItemState
  getRootProps(): Record<string, unknown>
  getLabelProps(): Record<string, unknown>
  getControlProps(): Record<string, unknown>
  getValueTextProps(): Record<string, unknown>
  getTriggerProps(): Record<string, unknown>
  getIndicatorProps(): Record<string, unknown>
  getPositionerProps(): Record<string, unknown>
  getContentProps(): Record<string, unknown>
  getItemProps(props: SelectItemProps): Record<string, unknown>
  getItemTextProps(props: SelectItemProps): Record<string, unknown>
  getItemIndicatorProps(props: SelectItemProps): Record<string, unknown>
  getItemGroupProps(props: { id: string }): Record<string, unknown>
  getItemGroupLabelProps(props: { htmlFor: string }): Record<string, unknown>
}

interface ResolvedSelectProps extends Omit<SelectProps, 'positioning' | 'collection'> {
  collection: ListCollection<CollectionItem>
  loopFocus: boolean
  closeOnSelect: boolean
  positioning: PositioningOptions & { placement: Placement }
}

type SelectState = 'idle' | 'focused' | 'open'

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)
const ariaAttr = (cond: boolean): 'true' | undefined => (cond ? 'true' : undefined)

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

function isFocusableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.closest(TABBABLE_SELECTOR) != null
}

function isEditableElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  if (el instanceof HTMLInputElement && el.selectionStart != null) return true
  return /(textarea|select)/.test(el.localName) || el.isContentEditable
}

const arrayEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i])

export class NativeSelectBehavior implements BehaviorSource<SelectApi> {
  api: SelectApi | null = null

  private props!: ResolvedSelectProps
  private state: SelectState = 'idle'
  private value: string[] = []
  private highlightedValue: string | null = null
  private highlightedItem: CollectionItem | null = null
  private selectedItemMap = new Map<string, CollectionItem>()
  private currentPlacement: Placement | undefined
  private readonly typeaheadState = { keysSoFar: '', timer: -1 }
  // Zag keeps an event history; the item pointerleave guard reads the event
  // BEFORE the last one (`event.previous()`), so a single hover+leave does
  // not clear the highlight — mirror with a two-slot history.
  private readonly recentEvents: string[] = []
  private readonly listeners = new Set<() => void>()
  private openCleanups: Array<() => void> = []
  private started = false

  init(props: SelectProps): void {
    if (!props.id) throw new Error('[select] `id` is required')
    this.props = {
      loopFocus: false,
      closeOnSelect: true,
      ...props,
      collection: props.collection ?? new ListCollection<CollectionItem>({ items: [] }),
      positioning: {
        placement: 'bottom-start',
        gutter: 8,
        ...props.positioning,
      } as ResolvedSelectProps['positioning'],
    }
    this.value = [...(props.defaultValue ?? [])]
    this.highlightedValue = props.defaultHighlightedValue ?? null
    this.highlightedItem = this.props.collection.find(this.highlightedValue)
    this.syncSelectedItemMap()
  }

  updateProps(props: Partial<SelectProps>): void {
    const collectionChanged = props.collection != null && props.collection !== this.props.collection
    this.props = {
      ...this.props,
      ...props,
      collection: props.collection ?? this.props.collection,
      positioning: {
        ...this.props.positioning,
        ...props.positioning,
      } as ResolvedSelectProps['positioning'],
    }
    if (collectionChanged) {
      // Zag's syncCollection: refresh the highlighted item + selection map
      const item = this.props.collection.find(this.highlightedValue)
      if (item) this.highlightedItem = item
      this.syncSelectedItemMap()
      if (this.started) this.notify()
    }
  }

  start(): void {
    if (this.started) return
    this.started = true
    ensureInteractionModalityTracking()
    this.api = this.buildApi()
    if (this.props.defaultOpen) this.enterOpen('none')
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.disposeOpenEffects()
    clearTimeout(this.typeaheadState.timer)
    this.typeaheadState.keysSoFar = ''
    this.typeaheadState.timer = -1
    this.state = 'idle'
    this.api = null
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify(): void {
    this.listeners.forEach((l) => l())
  }

  /* ---------------------------------------------------------- selection */

  private syncSelectedItemMap(): void {
    const { nextSelectedItemMap } = deriveSelectionState({
      values: this.value,
      collection: this.props.collection,
      selectedItemMap: this.selectedItemMap,
    })
    this.selectedItemMap = nextSelectedItemMap
  }

  private get selectedItems(): CollectionItem[] {
    return resolveSelectedItems({
      values: this.value,
      collection: this.props.collection,
      selectedItemMap: this.selectedItemMap,
    })
  }

  private setValueInternal(next: string[]): void {
    if (arrayEqual(this.value, next)) return
    this.value = next
    const { selectedItems, nextSelectedItemMap } = deriveSelectionState({
      values: next,
      collection: this.props.collection,
      selectedItemMap: this.selectedItemMap,
    })
    this.selectedItemMap = nextSelectedItemMap
    this.props.onValueChange?.({ value: next, items: selectedItems })
    this.notify()
  }

  private setHighlight(value: string | null): void {
    if (this.highlightedValue === value) return
    this.highlightedValue = value
    this.highlightedItem = value ? this.props.collection.find(value) : null
    this.props.onHighlightChange?.({
      highlightedValue: value,
      highlightedItem: this.highlightedItem,
      highlightedIndex: this.props.collection.indexOf(value),
    })
    this.notify()
    // Zag re-scrolls on every data-activedescendant change (attribute
    // observer); the modality gate skips pointer-driven highlights
    if (this.state === 'open' && getInteractionModality() !== 'pointer') {
      this.scrollHighlightedIntoView()
    }
  }

  /* -------------------------------------------------------------- events */

  private recordEvent(type: string): void {
    this.recentEvents.push(type)
    if (this.recentEvents.length > 2) this.recentEvents.shift()
  }

  private wasPointerEventBeforeLast(): boolean {
    return this.recentEvents.length === 2 && this.recentEvents[0].includes('POINTER')
  }

  private get isInteractive(): boolean {
    return !(this.props.disabled || this.props.readOnly)
  }

  private get isTypingAhead(): boolean {
    return this.typeaheadState.keysSoFar !== ''
  }

  /* ------------------------------------------------------------- machine */

  private enterOpen(highlight: 'selected' | 'first' | 'last' | 'none'): void {
    this.state = 'open'
    // Zag sets the placement synchronously on effect start
    this.currentPlacement = this.props.positioning.placement
    const collection = this.props.collection
    const hasSelected = this.value.length > 0
    if (highlight === 'selected' && hasSelected) {
      this.setHighlight(collection.sort(this.value)[0])
    } else if (highlight === 'first') {
      this.setHighlight(hasSelected ? collection.sort(this.value)[0] : collection.firstValue)
    } else if (highlight === 'last') {
      this.setHighlight(hasSelected ? collection.sort(this.value)[0] : collection.lastValue)
    }
    this.setInitialFocus()
    // effects attach one frame later (Zag `defer: true`) so bindPart has
    // written the part ids by the time the elements are looked up
    const frame = requestAnimationFrame(() => {
      if (this.state !== 'open' || !this.started) return
      const contentEl = this.getEl('content')
      if (contentEl) {
        this.openCleanups.push(
          createDismissableLayer(contentEl, {
            onDismiss: (event) => {
              const focusable = event?.type === 'pointerdown' && isFocusableTarget(event.target)
              this.recordEvent('CLOSE')
              this.doClose(focusable ? 'idle' : 'focused', !focusable)
            },
            exclude: () => [this.getEl('trigger')],
          }),
        )
      }
      this.openCleanups.push(
        trackPlacement(
          () => this.getEl('trigger'),
          () => this.getEl('positioner'),
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
      // Zag marks the open as virtual modality so the first scroll runs even
      // when the open came from a pointer click
      setInteractionModality('virtual')
      this.scrollHighlightedIntoView()
    })
    this.openCleanups.push(() => cancelAnimationFrame(frame))
  }

  private doOpen(highlight: 'selected' | 'first' | 'last' | 'none'): void {
    if (this.state === 'open') return
    this.props.onOpenChange?.({ open: true, value: this.value })
    this.enterOpen(highlight)
    this.notify()
  }

  /**
   * Close from open. `focusTrigger=false` leaves focus where a press put it
   * (Zag's `restoreFocus` detail) or where a click already has it.
   */
  private doClose(nextState: 'focused' | 'idle', focusTrigger: boolean): void {
    if (this.state !== 'open') return
    this.props.onOpenChange?.({ open: false, value: this.value })
    this.disposeOpenEffects()
    // Zag's exit action: scroll the list back to the top for the next open
    this.getEl('content')?.scrollTo?.(0, 0)
    this.state = nextState
    if (focusTrigger) {
      requestAnimationFrame(() => this.getEl('trigger')?.focus({ preventScroll: true }))
    }
    this.setHighlight(null)
    this.notify()
  }

  private disposeOpenEffects(): void {
    this.openCleanups.forEach((fn) => fn())
    this.openCleanups = []
  }

  /** Zag's getInitialFocus: autofocus marker, first tabbable, else content. */
  private setInitialFocus(): void {
    requestAnimationFrame(() => {
      if (this.state !== 'open') return
      const contentEl = this.getEl('content')
      if (!contentEl) return
      const target =
        contentEl.querySelector<HTMLElement>('[data-autofocus],[autofocus]') ??
        getTabbables(contentEl)[0] ??
        contentEl
      target.focus({ preventScroll: true })
    })
  }

  private scrollHighlightedIntoView(): void {
    if (this.highlightedValue == null) return
    const contentEl = this.getEl('content')
    const itemEl = document.getElementById(
      `select:${this.props.id}:option:${this.highlightedValue}`,
    )
    if (!contentEl || !itemEl) return
    if (contentEl.scrollHeight > contentEl.clientHeight) {
      itemEl.scrollIntoView?.({ block: 'nearest' })
    }
  }

  /* ------------------------------------------------------- interactions */

  private onTriggerClick(): void {
    if (!this.isInteractive) return
    this.recordEvent('TRIGGER.CLICK')
    if (this.state === 'open') {
      // click closes back to focused; the click itself keeps the trigger focused
      this.doClose('focused', false)
      return
    }
    this.doOpen('selected')
  }

  /** Select the previous/next/first/last/matching item without opening. */
  private selectClosed(target: 'previous' | 'next' | 'first' | 'last'): void {
    const collection = this.props.collection
    const current = this.value[0]
    let next: string | null | undefined
    if (target === 'first') next = collection.firstValue
    else if (target === 'last') next = collection.lastValue
    else if (this.value.length > 0) {
      next =
        target === 'previous'
          ? collection.getPreviousValue(current)
          : collection.getNextValue(current)
    } else {
      next = target === 'previous' ? collection.lastValue : collection.firstValue
    }
    if (next) this.setValueInternal([next])
  }

  private selectHighlighted(value?: string): void {
    const v = value ?? this.highlightedValue
    if (v == null || !this.props.collection.has(v)) return
    this.props.onSelect?.({ value: v })
    this.setValueInternal([v])
  }

  private onItemClick(value: string): void {
    if (this.state !== 'open') return
    this.recordEvent('ITEM.CLICK')
    if (this.props.closeOnSelect) {
      this.selectHighlighted(value)
      this.doClose('focused', true)
    } else {
      this.selectHighlighted(value)
    }
  }

  private highlightMove(direction: 'next' | 'previous' | 'first' | 'last'): void {
    const collection = this.props.collection
    const current = this.highlightedValue
    if (direction === 'first') return this.setHighlight(collection.firstValue ?? null)
    if (direction === 'last') return this.setHighlight(collection.lastValue ?? null)
    if (current == null) {
      return this.setHighlight(
        (direction === 'next' ? collection.firstValue : collection.lastValue) ?? null,
      )
    }
    if (this.props.loopFocus) {
      if (direction === 'next' && current === collection.lastValue) {
        return this.setHighlight(collection.firstValue ?? null)
      }
      if (direction === 'previous' && current === collection.firstValue) {
        return this.setHighlight(collection.lastValue ?? null)
      }
    }
    const next =
      direction === 'next'
        ? collection.getNextValue(current, 1, this.props.loopFocus)
        : collection.getPreviousValue(current, 1, this.props.loopFocus)
    if (next != null) this.setHighlight(next)
  }

  private onTriggerKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return
    if (!this.isInteractive) return
    if (this.state === 'open') return
    const key = getEventKey(event, { dir: this.props.dir, orientation: 'vertical' })
    let handled = true
    switch (key) {
      case 'ArrowUp':
        this.recordEvent('TRIGGER.ARROW_UP')
        this.doOpen('last')
        break
      case 'ArrowDown':
        if (event.altKey) {
          this.recordEvent('OPEN')
          this.doOpen('none')
        } else {
          this.recordEvent('TRIGGER.ARROW_DOWN')
          this.doOpen('first')
        }
        break
      case 'ArrowLeft':
        this.recordEvent('TRIGGER.ARROW_LEFT')
        this.selectClosed('previous')
        break
      case 'ArrowRight':
        this.recordEvent('TRIGGER.ARROW_RIGHT')
        this.selectClosed('next')
        break
      case 'Home':
        this.recordEvent('TRIGGER.HOME')
        this.selectClosed('first')
        break
      case 'End':
        this.recordEvent('TRIGGER.END')
        this.selectClosed('last')
        break
      case 'Enter':
        this.recordEvent('TRIGGER.ENTER')
        this.doOpen('first')
        break
      case 'Space':
        if (this.isTypingAhead) {
          this.recordEvent('TRIGGER.TYPEAHEAD')
          this.typeaheadSelect(event.key)
        } else {
          this.recordEvent('TRIGGER.ENTER')
          this.doOpen('first')
        }
        break
      default:
        handled = false
    }
    if (handled) {
      event.preventDefault()
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      this.recordEvent('TRIGGER.TYPEAHEAD')
      this.typeaheadSelect(event.key)
      event.preventDefault()
    }
  }

  private typeaheadSelect(key: string): void {
    const value = this.props.collection.search(key, {
      state: this.typeaheadState,
      currentValue: this.value[0] ?? null,
    })
    if (value == null) return
    this.setValueInternal([value])
  }

  private typeaheadHighlight(key: string): void {
    const value = this.props.collection.search(key, {
      state: this.typeaheadState,
      currentValue: this.highlightedValue,
    })
    if (value == null) return
    this.setHighlight(value)
  }

  private onContentKeydown(event: KeyboardEvent): void {
    if (!this.isInteractive) return
    if (this.state !== 'open') return
    const currentTarget = event.currentTarget as HTMLElement | null
    if (!(event.target instanceof Node) || !currentTarget?.contains(event.target)) return
    if (event.key === 'Tab') {
      // Zag's isValidTabEvent: options are never tabbable, so Tab is trapped
      const tabbables = getTabbables(currentTarget)
      const first = tabbables[0]
      const last = tabbables[tabbables.length - 1]
      const valid =
        (first || last) &&
        !(document.activeElement === first && event.shiftKey) &&
        !(document.activeElement === last && !event.shiftKey)
      if (!valid) {
        event.preventDefault()
        return
      }
    }
    let handled = true
    switch (getEventKey(event)) {
      case 'ArrowUp':
        this.recordEvent('CONTENT.ARROW_UP')
        this.highlightMove('previous')
        break
      case 'ArrowDown':
        this.recordEvent('CONTENT.ARROW_DOWN')
        this.highlightMove('next')
        break
      case 'Home':
        this.recordEvent('CONTENT.HOME')
        this.highlightMove('first')
        break
      case 'End':
        this.recordEvent('CONTENT.END')
        this.highlightMove('last')
        break
      case 'Enter':
        this.onItemClick(this.highlightedValue as string)
        break
      case 'Space':
        if (this.isTypingAhead) {
          this.recordEvent('CONTENT.TYPEAHEAD')
          this.typeaheadHighlight(event.key)
        } else {
          this.onItemClick(this.highlightedValue as string)
        }
        break
      default:
        handled = false
    }
    if (handled) {
      event.preventDefault()
      return
    }
    if (isEditableElement(event.target)) return
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      this.recordEvent('CONTENT.TYPEAHEAD')
      this.typeaheadHighlight(event.key)
      event.preventDefault()
    }
  }

  /* ----------------------------------------------------------------- dom */

  private getEl(
    part: 'trigger' | 'content' | 'positioner' | 'label' | 'control',
  ): HTMLElement | null {
    return document.getElementById(`select:${this.props.id}:${part}`)
  }

  /* ----------------------------------------------------------------- api */

  private getItemState(props: SelectItemProps): SelectItemState {
    const collection = this.props.collection
    const value = collection.getItemValue(props.item)
    if (value == null) {
      throw new Error(`[select] No value found for item ${JSON.stringify(props.item)}`)
    }
    return {
      value,
      disabled: Boolean(this.props.disabled || collection.getItemDisabled(props.item)),
      highlighted: this.highlightedValue === value,
      selected: this.value.includes(value),
    }
  }

  private buildApi(): SelectApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const id = this.props.id
    const partId = (part: string) => `select:${id}:${part}`
    return {
      get open() {
        return self.state === 'open'
      },
      get focused() {
        return self.state === 'focused'
      },
      get empty() {
        return self.value.length === 0
      },
      get value() {
        return self.value
      },
      get valueAsString() {
        return self.props.collection.stringifyItems(self.selectedItems)
      },
      get hasSelectedItems() {
        return self.value.length > 0
      },
      get highlightedValue() {
        return self.highlightedValue
      },
      get highlightedItem() {
        return self.highlightedItem
      },
      get selectedItems() {
        return self.selectedItems
      },
      get collection() {
        return self.props.collection
      },
      multiple: false,
      get disabled() {
        return !!self.props.disabled
      },
      focus() {
        self.getEl('trigger')?.focus({ preventScroll: true })
      },
      setOpen(nextOpen: boolean) {
        const open = self.state === 'open'
        if (open === nextOpen) return
        if (nextOpen) {
          self.recordEvent('OPEN')
          self.doOpen('none')
        } else {
          self.recordEvent('CLOSE')
          self.doClose('focused', true)
        }
      },
      reposition(options = {}) {
        if (self.state !== 'open') return
        trackPlacement(
          () => self.getEl('trigger'),
          () => self.getEl('positioner'),
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
      selectValue(value: string) {
        self.recordEvent('ITEM.SELECT')
        self.selectHighlighted(value)
      },
      setValue(value: string[]) {
        self.recordEvent('VALUE.SET')
        self.setValueInternal(value)
      },
      clearValue(value?: string) {
        if (value) {
          self.recordEvent('ITEM.CLEAR')
          self.setValueInternal(self.value.filter((v) => v !== value))
        } else {
          self.recordEvent('VALUE.CLEAR')
          self.setValueInternal([])
        }
      },
      setHighlightValue(value: string) {
        self.recordEvent('HIGHLIGHTED_VALUE.SET')
        self.setHighlight(value)
      },
      clearHighlightValue() {
        self.recordEvent('HIGHLIGHTED_VALUE.CLEAR')
        self.setHighlight(null)
      },
      getItemState(props: SelectItemProps) {
        return self.getItemState(props)
      },
      getRootProps() {
        return {
          'data-scope': 'select',
          'data-part': 'root',
          dir: self.props.dir,
          id: `select:${id}`,
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-readonly': dataAttr(!!self.props.readOnly),
        }
      },
      getLabelProps() {
        return {
          dir: self.props.dir,
          id: partId('label'),
          'data-scope': 'select',
          'data-part': 'label',
          'data-disabled': dataAttr(!!self.props.disabled),
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-readonly': dataAttr(!!self.props.readOnly),
          'data-required': dataAttr(!!self.props.required),
          for: partId('select'),
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            if (self.props.disabled) return
            self.getEl('trigger')?.focus({ preventScroll: true })
          },
        }
      },
      getControlProps() {
        const open = self.state === 'open'
        return {
          'data-scope': 'select',
          'data-part': 'control',
          dir: self.props.dir,
          id: partId('control'),
          'data-state': open ? 'open' : 'closed',
          'data-focus': dataAttr(self.state === 'focused'),
          'data-disabled': dataAttr(!!self.props.disabled),
          'data-invalid': dataAttr(!!self.props.invalid),
        }
      },
      getValueTextProps() {
        return {
          'data-scope': 'select',
          'data-part': 'value-text',
          dir: self.props.dir,
          'data-disabled': dataAttr(!!self.props.disabled),
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-focus': dataAttr(self.state === 'focused'),
        }
      },
      getTriggerProps() {
        const open = self.state === 'open'
        return {
          id: partId('trigger'),
          disabled: !!self.props.disabled,
          dir: self.props.dir,
          type: 'button',
          role: 'combobox',
          'aria-controls': partId('content'),
          'aria-expanded': open,
          'aria-haspopup': 'listbox',
          'data-state': open ? 'open' : 'closed',
          'aria-invalid': !!self.props.invalid,
          'aria-required': !!self.props.required,
          'aria-labelledby': partId('label'),
          'data-scope': 'select',
          'data-part': 'trigger',
          'data-disabled': dataAttr(!!self.props.disabled),
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-readonly': dataAttr(!!self.props.readOnly),
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          'data-placeholder-shown': dataAttr(self.value.length === 0),
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            self.onTriggerClick()
          },
          onfocusin() {
            self.recordEvent('TRIGGER.FOCUS')
            if (self.state === 'idle') {
              self.state = 'focused'
              self.notify()
            }
          },
          onfocusout() {
            self.recordEvent('TRIGGER.BLUR')
            if (self.state === 'focused') {
              self.state = 'idle'
              self.notify()
            }
          },
          onkeydown(event: KeyboardEvent) {
            self.onTriggerKeydown(event)
          },
        }
      },
      getIndicatorProps() {
        const open = self.state === 'open'
        return {
          'data-scope': 'select',
          'data-part': 'indicator',
          dir: self.props.dir,
          'aria-hidden': true,
          'data-state': open ? 'open' : 'closed',
          'data-disabled': dataAttr(!!self.props.disabled),
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-readonly': dataAttr(!!self.props.readOnly),
        }
      },
      getPositionerProps() {
        return {
          'data-scope': 'select',
          'data-part': 'positioner',
          dir: self.props.dir,
          id: partId('positioner'),
          style: getFloatingStyleString(self.currentPlacement, self.props.positioning),
        }
      },
      getContentProps() {
        const open = self.state === 'open'
        const activeId = self.highlightedValue
          ? `select:${id}:option:${self.highlightedValue}`
          : undefined
        return {
          hidden: !open,
          dir: self.props.dir,
          id: partId('content'),
          role: 'listbox',
          'data-scope': 'select',
          'data-part': 'content',
          'data-state': open ? 'open' : 'closed',
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          'data-activedescendant': activeId,
          'aria-activedescendant': activeId,
          'aria-labelledby': partId('label'),
          tabindex: 0,
          onkeydown(event: KeyboardEvent) {
            self.onContentKeydown(event)
          },
        }
      },
      getItemProps(props: SelectItemProps) {
        const itemState = self.getItemState(props)
        return {
          id: `select:${id}:option:${itemState.value}`,
          role: 'option',
          'data-scope': 'select',
          'data-part': 'item',
          dir: self.props.dir,
          'data-value': itemState.value,
          'aria-selected': itemState.selected,
          'data-state': itemState.selected ? 'checked' : 'unchecked',
          'data-highlighted': dataAttr(itemState.highlighted),
          'data-disabled': dataAttr(itemState.disabled),
          'aria-disabled': ariaAttr(itemState.disabled),
          onpointermove(event: PointerEvent) {
            if (itemState.disabled || event.pointerType !== 'mouse') return
            if (itemState.value === self.highlightedValue) return
            self.recordEvent('ITEM.POINTER_MOVE')
            if (self.state === 'open') self.setHighlight(itemState.value)
          },
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            if (itemState.disabled) return
            self.onItemClick(itemState.value)
          },
          onpointerleave(event: PointerEvent) {
            if (itemState.disabled) return
            if (props.persistFocus) return
            if (event.pointerType !== 'mouse') return
            if (!self.wasPointerEventBeforeLast()) return
            self.recordEvent('ITEM.POINTER_LEAVE')
            if (self.state === 'open') self.setHighlight(null)
          },
        }
      },
      getItemTextProps(props: SelectItemProps) {
        const itemState = self.getItemState(props)
        return {
          'data-scope': 'select',
          'data-part': 'item-text',
          'data-state': itemState.selected ? 'checked' : 'unchecked',
          'data-disabled': dataAttr(itemState.disabled),
          'data-highlighted': dataAttr(itemState.highlighted),
        }
      },
      getItemIndicatorProps(props: SelectItemProps) {
        const itemState = self.getItemState(props)
        return {
          'aria-hidden': true,
          'data-scope': 'select',
          'data-part': 'item-indicator',
          'data-state': itemState.selected ? 'checked' : 'unchecked',
          hidden: !itemState.selected,
        }
      },
      getItemGroupProps(props: { id: string }) {
        return {
          'data-scope': 'select',
          'data-part': 'item-group',
          'data-disabled': dataAttr(!!self.props.disabled),
          id: `select:${id}:optgroup:${props.id}`,
          'aria-labelledby': `select:${id}:optgroup-label:${props.id}`,
          role: 'group',
          dir: self.props.dir,
        }
      },
      getItemGroupLabelProps(props: { htmlFor: string }) {
        return {
          'data-scope': 'select',
          'data-part': 'item-group-label',
          id: `select:${id}:optgroup-label:${props.htmlFor}`,
          dir: self.props.dir,
          role: 'presentation',
        }
      },
    }
  }
}

export const createNativeSelectBehavior = (): NativeSelectBehavior => new NativeSelectBehavior()
