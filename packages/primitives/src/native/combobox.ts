/**
 * Native combobox engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/combobox` behind the facade: the prop bags
 * (control/input/trigger/positioner/content/item/…) emit the exact attribute,
 * ARIA, style and event contract the Zag connect produced (keys
 * pre-normalized the way `@zag-js/vanilla` would), verified by the
 * dual-engine suite in `test/combobox.spec.ts`. Also drives `ui-command`
 * (always-open palette: controlled `open: true` + `disableLayer` +
 * `inputBehavior: 'autohighlight'` + `selectionBehavior: 'clear'`).
 *
 * Model (Zag's four states):
 *   idle ⇄ focused → suggesting ⇄ interacting          (closed | open tags)
 * `suggesting` is the state right after typing (autohighlight re-highlights
 * the first match on every collection change); arrow keys or pointer
 * highlights move to `interacting`, where collection changes keep the
 * highlight. Opening attaches, one frame deferred (Zag `defer: true`):
 *   • a dismissable layer (skipped for `disableLayer`) — Escape closes back
 *     to focused; an outside press or focus-outside closes to idle without
 *     focus restore, reverting a custom input value unless `allowCustomValue`
 *   • floating-ui placement tracking, anchored on the control (else trigger)
 *   • scroll-to-highlighted — the open is marked `virtual` interaction
 *     modality; pointer highlights never scroll (Zag's modality gate)
 * `onInputValueChange` carries Zag's `reason` (`input-change` from typing —
 * the only reason registry filtering narrows on) and selection/clear/revert
 * writes sync the input element's value property (Zag's `syncInputValue`).
 *
 * Not ported (unused by the registry components): `multiple`,
 * `inputBehavior: 'autocomplete'` (inline autofill), `allowCustomValue`
 * *submission* semantics beyond revert-on-close, `alwaysSubmitOnEnter`,
 * anchor items + `navigate`, the clear-trigger and list parts, form
 * integration (name/form), `scrollToIndexFn`, `composite: false` mode, the
 * Apple VoiceOver live region.
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

export type ComboboxInputBehavior = 'none' | 'autohighlight'
export type ComboboxSelectionBehavior = 'replace' | 'clear' | 'preserve'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type ComboboxProps = {
  /** Unique machine id — element ids derive from it (`combobox:{id}:input`). */
  id: string
  collection?: ListCollection<CollectionItem>
  dir?: 'ltr' | 'rtl'
  defaultValue?: string[]
  defaultInputValue?: string
  defaultHighlightedValue?: string | null
  defaultOpen?: boolean
  /** Controlled open (command palette passes a constant `true`). */
  open?: boolean
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  readOnly?: boolean
  placeholder?: string
  autoFocus?: boolean
  /** Open the listbox when the input is clicked. Zag default: false. */
  openOnClick?: boolean
  /** ArrowUp/Down on a closed input opens the listbox. Zag default: true. */
  openOnKeyPress?: boolean
  /** Typing in a closed input opens the listbox. Zag default: true. */
  openOnChange?: boolean
  /** Arrow navigation wraps around. Zag default: true. */
  loopFocus?: boolean
  closeOnSelect?: boolean
  /** Keep a non-matching input value on close instead of reverting. */
  allowCustomValue?: boolean
  /** `autohighlight` highlights the first match on every filter pass. */
  inputBehavior?: ComboboxInputBehavior
  /** What selection writes into the input: item text, nothing, or keep. */
  selectionBehavior?: ComboboxSelectionBehavior
  /** Skip the dismissable layer (inline command palette). */
  disableLayer?: boolean
  positioning?: PositioningOptions
  translations?: { triggerLabel?: string }
  onValueChange?: (details: { value: string[]; items: CollectionItem[] }) => void
  onInputValueChange?: (details: { inputValue: string; reason: string | undefined }) => void
  onHighlightChange?: (details: {
    highlightedValue: string | null
    highlightedItem: CollectionItem | null
  }) => void
  onOpenChange?: (details: { open: boolean; reason: string | undefined; value: string[] }) => void
  onSelect?: (details: { value: string[]; itemValue: string }) => void
}

export interface ComboboxItemProps {
  item: CollectionItem
  /** Keep the highlight when the pointer leaves the item. */
  persistFocus?: boolean
}

export interface ComboboxItemState {
  value: string
  disabled: boolean
  highlighted: boolean
  selected: boolean
}

export interface ComboboxApi {
  open: boolean
  focused: boolean
  inputValue: string
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
  setOpen(open: boolean, reason?: string): void
  reposition(options?: PositioningOptions): void
  selectValue(value: string): void
  setValue(value: string[]): void
  setInputValue(value: string, reason?: string): void
  clearValue(value?: string): void
  setHighlightValue(value: string): void
  clearHighlightValue(): void
  syncSelectedItems(): void
  getItemState(props: ComboboxItemProps): ComboboxItemState
  getRootProps(): Record<string, unknown>
  getLabelProps(): Record<string, unknown>
  getControlProps(): Record<string, unknown>
  getPositionerProps(): Record<string, unknown>
  getInputProps(): Record<string, unknown>
  getTriggerProps(): Record<string, unknown>
  getContentProps(): Record<string, unknown>
  getItemProps(props: ComboboxItemProps): Record<string, unknown>
  getItemTextProps(props: ComboboxItemProps): Record<string, unknown>
  getItemIndicatorProps(props: ComboboxItemProps): Record<string, unknown>
  getItemGroupProps(props: { id: string }): Record<string, unknown>
  getItemGroupLabelProps(props: { htmlFor: string }): Record<string, unknown>
}

interface ResolvedComboboxProps extends Omit<
  ComboboxProps,
  'positioning' | 'collection' | 'translations'
> {
  collection: ListCollection<CollectionItem>
  openOnClick: boolean
  openOnKeyPress: boolean
  openOnChange: boolean
  loopFocus: boolean
  closeOnSelect: boolean
  allowCustomValue: boolean
  inputBehavior: ComboboxInputBehavior
  selectionBehavior: ComboboxSelectionBehavior
  translations: { triggerLabel: string }
  positioning: PositioningOptions & { placement: Placement }
}

type ComboboxState = 'idle' | 'focused' | 'suggesting' | 'interacting'

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)
const ariaAttr = (cond: boolean): 'true' | undefined => (cond ? 'true' : undefined)

const arrayEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i])

const isMacLike = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? '')

export class NativeComboboxBehavior implements BehaviorSource<ComboboxApi> {
  api: ComboboxApi | null = null

  private props!: ResolvedComboboxProps
  private state: ComboboxState = 'idle'
  private value: string[] = []
  private inputValue = ''
  private highlightedValue: string | null = null
  private highlightedItem: CollectionItem | null = null
  private selectedItemMap = new Map<string, CollectionItem>()
  private currentPlacement: Placement | undefined
  // Zag keeps an event history; the item pointerleave guard reads the event
  // BEFORE the last one (`event.previous()`), so a single hover+leave does
  // not clear the highlight — mirror with a two-slot history.
  private readonly recentEvents: string[] = []
  private readonly listeners = new Set<() => void>()
  private openCleanups: Array<() => void> = []
  private startCleanups: Array<() => void> = []
  private started = false

  init(props: ComboboxProps): void {
    if (!props.id) throw new Error('[combobox] `id` is required')
    this.props = {
      openOnClick: false,
      openOnKeyPress: true,
      openOnChange: true,
      loopFocus: true,
      closeOnSelect: true,
      allowCustomValue: false,
      inputBehavior: 'none',
      selectionBehavior: 'replace',
      disableLayer: false,
      ...props,
      collection: props.collection ?? new ListCollection<CollectionItem>({ items: [] }),
      translations: { triggerLabel: 'Toggle suggestions', ...props.translations },
      positioning: {
        placement: 'bottom',
        sameWidth: true,
        ...props.positioning,
      } as ResolvedComboboxProps['positioning'],
    }
    this.value = [...(props.defaultValue ?? [])]
    this.highlightedValue = props.defaultHighlightedValue ?? null
    this.highlightedItem = this.props.collection.find(this.highlightedValue)
    this.syncSelectedItemMap()
    // Zag's initial inputValue: derive from the selection unless given
    let inputValue = props.defaultInputValue ?? ''
    if (!inputValue.trim()) {
      const valueAsString = this.props.collection.stringifyMany(this.value)
      inputValue = {
        preserve: inputValue || valueAsString,
        replace: valueAsString,
        clear: '',
      }[this.props.selectionBehavior]
    }
    this.inputValue = inputValue
  }

  updateProps(props: Partial<ComboboxProps>): void {
    const prevCollection = this.props.collection
    const prevOpen = this.props.open
    this.props = {
      ...this.props,
      ...props,
      collection: props.collection ?? this.props.collection,
      translations: { ...this.props.translations, ...props.translations },
      positioning: {
        ...this.props.positioning,
        ...props.positioning,
      } as ResolvedComboboxProps['positioning'],
    }
    if (!this.started) return
    // Zag watches collection.toString() (content, not identity)
    if (props.collection && props.collection.toString() !== prevCollection.toString()) {
      this.onChildrenChange()
    }
    if ('open' in props && props.open !== prevOpen) {
      if (props.open && !this.isOpen) this.enterOpen('interacting')
      else if (!props.open && this.isOpen) this.exitOpen('focused', true)
      this.notify()
    }
  }

  start(): void {
    if (this.started) return
    this.started = true
    ensureInteractionModalityTracking()
    this.api = this.buildApi()
    if (this.props.open || this.props.defaultOpen) {
      this.state = 'suggesting'
      this.attachOpenEffects()
      this.setInitialFocus()
    } else if (this.props.autoFocus) {
      this.setInitialFocus()
    }
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.disposeOpenEffects()
    this.startCleanups.forEach((fn) => fn())
    this.startCleanups = []
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

  /* ------------------------------------------------------------- derived */

  private get isOpen(): boolean {
    return this.state === 'suggesting' || this.state === 'interacting'
  }

  private get isFocusedTag(): boolean {
    return this.state !== 'idle'
  }

  private get isInteractive(): boolean {
    return !(this.props.readOnly || this.props.disabled)
  }

  private get autoHighlight(): boolean {
    return this.props.inputBehavior === 'autohighlight'
  }

  private get isOpenControlled(): boolean {
    return this.props.open != null
  }

  private get selectedItems(): CollectionItem[] {
    return resolveSelectedItems({
      values: this.value,
      collection: this.props.collection,
      selectedItemMap: this.selectedItemMap,
    })
  }

  private get valueAsString(): string {
    return this.props.collection.stringifyItems(this.selectedItems)
  }

  private get isCustomValue(): boolean {
    return this.inputValue !== this.valueAsString
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

  private setValueInternal(next: string[], reason: string | undefined): void {
    const changed = !arrayEqual(this.value, next)
    if (changed) {
      this.value = next
      const { selectedItems, nextSelectedItemMap } = deriveSelectionState({
        values: next,
        collection: this.props.collection,
        selectedItemMap: this.selectedItemMap,
      })
      this.selectedItemMap = nextSelectedItemMap
      this.props.onValueChange?.({ value: next, items: selectedItems })
    }
    // selection writes the input per selectionBehavior even when unchanged
    this.setInputValueInternal(this.inputValueFor(next), reason)
    if (changed) this.notify()
  }

  private inputValueFor(value: string[]): string {
    return {
      preserve: this.inputValue,
      replace: this.props.collection.stringifyMany(value),
      clear: '',
    }[this.props.selectionBehavior]
  }

  private setInputValueInternal(next: string, reason: string | undefined): void {
    if (this.inputValue === next) return
    this.inputValue = next
    this.props.onInputValueChange?.({ inputValue: next, reason })
    // Zag's syncInputValue watch: non-typing writes land on the element too
    if (reason !== 'input-change') {
      const inputEl = this.getInputEl()
      if (inputEl) {
        inputEl.value = next
        queueMicrotask(() => {
          if (inputEl.ownerDocument.activeElement === inputEl) {
            try {
              inputEl.setSelectionRange(next.length, next.length)
            } catch {
              /* non-text input types */
            }
          }
        })
      }
    }
    this.notify()
  }

  private setHighlight(value: string | null): void {
    if (this.highlightedValue === value) return
    this.highlightedValue = value
    this.highlightedItem = value ? this.props.collection.find(value) : null
    this.props.onHighlightChange?.({
      highlightedValue: value,
      highlightedItem: this.highlightedItem,
    })
    this.notify()
    // Zag re-scrolls on every aria-activedescendant change (attribute
    // observer); the modality gate skips pointer-driven highlights
    if (this.isOpen && getInteractionModality() !== 'pointer') {
      this.scrollHighlightedIntoView()
    }
  }

  private revertInputValue(reason: string | undefined): void {
    const next = {
      replace: this.value.length > 0 ? this.valueAsString : '',
      preserve: this.inputValue,
      clear: '',
    }[this.props.selectionBehavior]
    this.setInputValueInternal(next, reason)
  }

  private selectItem(value: string | null | undefined, reason: string | undefined): void {
    if (value == null) return
    const next = [value]
    this.props.onSelect?.({ value: next, itemValue: value })
    this.setValueInternal(next, reason)
  }

  private selectHighlighted(reason: string): void {
    const highlighted = this.highlightedValue
    if (!highlighted || !this.props.collection.has(highlighted)) return
    this.selectItem(highlighted, reason)
  }

  /* -------------------------------------------------------------- events */

  private recordEvent(type: string): void {
    this.recentEvents.push(type)
    if (this.recentEvents.length > 2) this.recentEvents.shift()
  }

  private wasPointerEventBeforeLast(): boolean {
    return this.recentEvents.length === 2 && this.recentEvents[0].includes('POINTER')
  }

  /* ------------------------------------------------------------- machine */

  private enterOpen(target: 'suggesting' | 'interacting'): void {
    this.state = target
    this.setInitialFocus()
    this.attachOpenEffects()
  }

  private attachOpenEffects(): void {
    // Zag sets the placement synchronously on effect start
    this.currentPlacement = this.props.positioning.placement
    // effects attach one frame later (Zag `defer: true`) so bindPart has
    // written the part ids by the time the elements are looked up
    const frame = requestAnimationFrame(() => {
      if (!this.isOpen || !this.started) return
      const contentEl = this.getEl('content')
      if (contentEl && !this.props.disableLayer) {
        this.openCleanups.push(
          createDismissableLayer(contentEl, {
            onDismiss: (event) => {
              if (event?.type === 'keydown') this.onLayerEscape()
              else this.onInteractOutside()
            },
            exclude: () => [this.getInputEl(), this.getEl('toggle-btn'), this.getEl('control')],
          }),
          this.trackFocusOutside(contentEl),
        )
      }
      this.openCleanups.push(
        trackPlacement(
          () => this.getEl('control') ?? this.getEl('toggle-btn'),
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
      // Zag marks the open as virtual modality so the first scroll runs even
      // when the open came from a pointer click
      setInteractionModality('virtual')
      this.scrollHighlightedIntoView()
    })
    this.openCleanups.push(() => cancelAnimationFrame(frame))
  }

  private disposeOpenEffects(): void {
    this.openCleanups.forEach((fn) => fn())
    this.openCleanups = []
  }

  /** Zag's closed-state entry: scroll back to top + clear the highlight. */
  private exitOpen(target: 'focused' | 'idle', finalFocus: boolean): void {
    this.disposeOpenEffects()
    this.state = target
    const contentEl = this.getEl('content')
    if (contentEl) contentEl.scrollTop = 0
    this.setHighlight(null)
    if (finalFocus) this.setFinalFocus()
  }

  private doOpen(
    target: 'suggesting' | 'interacting',
    reason: string | undefined,
    highlight?: () => void,
  ): void {
    this.props.onOpenChange?.({ open: true, reason, value: this.value })
    if (this.isOpenControlled) return
    if (!this.isOpen) {
      this.enterOpen(target)
      highlight?.()
      this.notify()
    } else {
      highlight?.()
    }
  }

  private doClose(
    target: 'focused' | 'idle',
    reason: string | undefined,
    finalFocus: boolean,
  ): void {
    this.props.onOpenChange?.({ open: false, reason, value: this.value })
    if (this.isOpenControlled) return
    if (!this.isOpen) return
    this.exitOpen(target, finalFocus)
    this.notify()
  }

  private onLayerEscape(): void {
    if (!this.isOpen) return
    this.recordEvent('LAYER.ESCAPE')
    // interacting restores focus to the input; suggesting closes in place
    const finalFocus = this.state === 'interacting'
    this.doClose('focused', 'escape-key', finalFocus)
  }

  private onInteractOutside(): void {
    if (!this.isOpen) return
    this.recordEvent('LAYER.INTERACT_OUTSIDE')
    if (this.isCustomValue && !this.props.allowCustomValue) {
      this.revertInputValue('interact-outside')
    }
    this.doClose('idle', 'interact-outside', false)
  }

  /** Focus moving outside input/content/trigger dismisses (Zag's layer). */
  private trackFocusOutside(contentEl: HTMLElement): () => void {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (contentEl.contains(target)) return
      if (this.getEl('control')?.contains(target)) return
      if (this.getInputEl()?.contains(target)) return
      if (this.getEl('toggle-btn')?.contains(target)) return
      this.onInteractOutside()
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }

  private onChildrenChange(): void {
    this.recordEvent('CHILDREN_CHANGE')
    const collection = this.props.collection
    const highlightedRemoved = !collection.has(this.highlightedValue)
    if (this.state === 'suggesting') {
      if (highlightedRemoved && collection.size > 0 && this.autoHighlight) {
        this.setHighlight(null)
        this.highlightFirstDeferred()
      } else if (highlightedRemoved) {
        this.setHighlight(null)
      } else if (this.autoHighlight) {
        this.highlightFirstDeferred()
      }
    } else if (this.state === 'interacting') {
      if (highlightedRemoved) {
        this.setHighlight(null)
      } else {
        queueMicrotask(() => this.scrollHighlightedIntoView())
      }
    }
    this.notify()
  }

  /** Zag defers this highlight: microtask when the content exists, else raf. */
  private highlightFirstDeferred(): void {
    const exec = this.getEl('content')
      ? queueMicrotask
      : (fn: () => void) => void requestAnimationFrame(fn)
    exec(() => {
      if (!this.started) return
      const value = this.props.collection.firstValue
      if (value) this.setHighlight(value)
    })
  }

  private highlightSelectedDeferred(mode: 'selected' | 'firstOrSelected' | 'lastOrSelected'): void {
    requestAnimationFrame(() => {
      if (!this.started) return
      const collection = this.props.collection
      let value: string | null | undefined
      if (this.value.length > 0) {
        value = collection.sort(this.value)[0]
      } else if (mode === 'firstOrSelected') {
        value = collection.firstValue
      } else if (mode === 'lastOrSelected') {
        value = collection.lastValue
      }
      if (value) this.setHighlight(value)
    })
  }

  private highlightMove(direction: 'next' | 'previous'): void {
    const collection = this.props.collection
    const current = this.highlightedValue
    let value: string | null | undefined
    if (current) {
      value =
        direction === 'next'
          ? collection.getNextValue(current)
          : collection.getPreviousValue(current)
      if (!value && this.props.loopFocus) {
        value = direction === 'next' ? collection.firstValue : collection.lastValue
      }
    } else {
      value = direction === 'next' ? collection.firstValue : collection.lastValue
    }
    if (value) this.setHighlight(value)
  }

  /* ------------------------------------------------------- interactions */

  private onInputClick(): void {
    if (!this.props.openOnClick || !this.isInteractive) return
    if (this.isOpen) return
    this.recordEvent('INPUT.CLICK')
    this.doOpen('interacting', 'input-click', () => this.highlightSelectedDeferred('selected'))
  }

  private onInputFocus(): void {
    this.recordEvent('INPUT.FOCUS')
    if (this.state === 'idle') {
      this.state = 'focused'
      this.notify()
    }
  }

  private onInputBlur(): void {
    this.recordEvent('INPUT.BLUR')
    if (this.state === 'focused') {
      this.state = 'idle'
      this.setHighlight(null)
      this.notify()
    }
  }

  private onInputChange(nextValue: string): void {
    this.recordEvent('INPUT.CHANGE')
    if (this.state === 'idle') {
      return
    }
    if (this.state === 'focused') {
      if (this.props.openOnChange) {
        this.setInputValueInternal(nextValue, 'input-change')
        this.props.onOpenChange?.({ open: true, reason: 'input-change', value: this.value })
        if (!this.isOpenControlled) this.enterOpen('suggesting')
        if (this.autoHighlight) this.highlightFirstDeferred()
        this.notify()
      } else {
        this.setInputValueInternal(nextValue, 'input-change')
      }
      return
    }
    if (this.state === 'interacting') {
      this.state = 'suggesting'
      this.setHighlight(null)
      this.setInputValueInternal(nextValue, 'input-change')
      this.notify()
      return
    }
    // suggesting
    this.setInputValueInternal(nextValue, 'input-change')
  }

  private onTriggerClick(): void {
    if (!this.isInteractive) return
    this.recordEvent('TRIGGER.CLICK')
    if (this.isOpen) {
      this.doClose('focused', 'trigger-click', false)
    } else {
      this.doOpen('interacting', 'trigger-click', () => this.highlightSelectedDeferred('selected'))
      this.setInitialFocus()
    }
  }

  private onInputArrow(direction: 'up' | 'down'): void {
    if (this.isOpen) {
      this.recordEvent(direction === 'down' ? 'INPUT.ARROW_DOWN' : 'INPUT.ARROW_UP')
      if (this.state === 'suggesting') this.state = 'interacting'
      this.highlightMove(direction === 'down' ? 'next' : 'previous')
      this.notify()
      return
    }
    if (this.state !== 'focused') return
    this.recordEvent(direction === 'down' ? 'INPUT.ARROW_DOWN' : 'INPUT.ARROW_UP')
    this.doOpen('interacting', 'arrow-key', () =>
      this.highlightSelectedDeferred(direction === 'down' ? 'firstOrSelected' : 'lastOrSelected'),
    )
  }

  private onInputHomeEnd(edge: 'first' | 'last'): void {
    if (!this.isOpen) return
    this.recordEvent(edge === 'first' ? 'INPUT.HOME' : 'INPUT.END')
    if (this.state === 'suggesting') this.state = 'interacting'
    const collection = this.props.collection
    const value = edge === 'first' ? collection.firstValue : collection.lastValue
    if (value) this.setHighlight(value)
    this.notify()
  }

  private onInputEnter(): void {
    if (!this.isOpen) return
    this.recordEvent('INPUT.ENTER')
    if (this.isCustomValue && this.highlightedValue == null && !this.props.allowCustomValue) {
      this.revertInputValue('item-select')
      this.doClose('focused', 'item-select', false)
      return
    }
    if (this.props.closeOnSelect) {
      this.selectHighlighted('item-select')
      this.doClose('focused', 'item-select', true)
    } else {
      this.selectHighlighted('item-select')
    }
  }

  private onInputEscape(): void {
    this.recordEvent('INPUT.ESCAPE')
    // only meaningful when closed — the open layer handles Escape itself
    if (this.state === 'focused' && this.isCustomValue && !this.props.allowCustomValue) {
      this.revertInputValue('escape-key')
    }
    // command palette (disableLayer): Zag leaves Escape to the input handler,
    // which is a no-op in open states — nothing to do
  }

  private onItemClick(value: string): void {
    if (!this.isOpen) return
    this.recordEvent('ITEM.CLICK')
    if (this.props.closeOnSelect) {
      this.selectItem(value, 'item-select')
      this.doClose('focused', 'item-select', true)
    } else {
      this.selectItem(value, 'item-select')
    }
  }

  private onInputKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) return
    if (!this.isInteractive) return
    if (event.ctrlKey || event.shiftKey || event.isComposing) return
    const isModifierKey = event.ctrlKey || event.metaKey || event.shiftKey
    const open = this.isOpen
    switch (getEventKey(event, { dir: this.props.dir })) {
      case 'ArrowDown':
        if (!this.props.openOnKeyPress && !open) return
        if (event.altKey) {
          this.recordEvent('OPEN')
          if (!open && this.state === 'focused') {
            this.doOpen('interacting', 'arrow-key')
          }
        } else {
          this.onInputArrow('down')
        }
        event.preventDefault()
        break
      case 'ArrowUp':
        if (!this.props.openOnKeyPress && !open) return
        if (event.altKey) {
          this.recordEvent('CLOSE')
          if (open) this.doClose('focused', 'arrow-key', true)
        } else {
          this.onInputArrow('up')
        }
        event.preventDefault()
        break
      case 'Home':
        if (isModifierKey) return
        this.onInputHomeEnd('first')
        if (open) event.preventDefault()
        break
      case 'End':
        if (isModifierKey) return
        this.onInputHomeEnd('last')
        if (open) event.preventDefault()
        break
      case 'Enter': {
        const hasHighlight = this.highlightedValue != null
        const willBeRejected = this.isCustomValue && !this.props.allowCustomValue
        if (open && (hasHighlight || willBeRejected)) event.preventDefault()
        this.onInputEnter()
        break
      }
      case 'Escape':
        this.onInputEscape()
        event.preventDefault()
        break
    }
  }

  /* --------------------------------------------------------------- focus */

  private getInputEl(): HTMLInputElement | null {
    return document.getElementById(`combobox:${this.props.id}:input`) as HTMLInputElement | null
  }

  /** Zag's focusInputEl: focus if needed, then park the caret at the end. */
  private focusInput(): void {
    const inputEl = this.getInputEl()
    if (!inputEl) return
    if (inputEl.ownerDocument.activeElement !== inputEl) {
      inputEl.focus({ preventScroll: true })
    }
    try {
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length)
    } catch {
      /* non-text input types */
    }
  }

  private setInitialFocus(): void {
    requestAnimationFrame(() => {
      if (!this.started) return
      this.focusInput()
    })
  }

  private setFinalFocus(): void {
    requestAnimationFrame(() => {
      if (!this.started) return
      const triggerEl = this.getEl('toggle-btn')
      if (triggerEl?.dataset.focusable == null) this.focusInput()
      else triggerEl.focus({ preventScroll: true })
    })
  }

  private scrollHighlightedIntoView(): void {
    if (this.highlightedValue == null) return
    const contentEl = this.getEl('content')
    if (!contentEl) return
    const itemEl = contentEl.querySelector<HTMLElement>(
      `[role=option][data-value="${CSS.escape(this.highlightedValue)}"]`,
    )
    if (!itemEl) return
    if (contentEl.scrollHeight > contentEl.clientHeight) {
      itemEl.scrollIntoView?.({ block: 'nearest' })
    }
  }

  /* ----------------------------------------------------------------- dom */

  private getEl(part: 'content' | 'control' | 'popper' | 'toggle-btn'): HTMLElement | null {
    return document.getElementById(`combobox:${this.props.id}:${part}`)
  }

  /* ----------------------------------------------------------------- api */

  private getItemState(props: ComboboxItemProps): ComboboxItemState {
    const collection = this.props.collection
    const value = collection.getItemValue(props.item)
    if (value == null) {
      throw new Error(`[combobox] No value found for item ${JSON.stringify(props.item)}`)
    }
    return {
      value,
      disabled: Boolean(this.props.disabled || collection.getItemDisabled(props.item)),
      highlighted: this.highlightedValue === value,
      selected: this.value.includes(value),
    }
  }

  private buildApi(): ComboboxApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const id = this.props.id
    const partId = (part: string) => `combobox:${id}:${part}`
    return {
      get open() {
        return self.isOpen
      },
      get focused() {
        return self.isFocusedTag
      },
      get inputValue() {
        return self.inputValue
      },
      get value() {
        return self.value
      },
      get valueAsString() {
        return self.valueAsString
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
        self.getInputEl()?.focus()
      },
      setOpen(nextOpen: boolean, reason = 'script') {
        if (self.isOpen === nextOpen) return
        if (nextOpen) {
          self.recordEvent('OPEN')
          if (self.state === 'idle' || self.state === 'focused') {
            self.doOpen('interacting', reason)
          }
        } else {
          self.recordEvent('CLOSE')
          self.doClose('focused', reason, true)
        }
      },
      reposition(options = {}) {
        if (!self.isOpen) return
        trackPlacement(
          () => self.getEl('control'),
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
      selectValue(value: string) {
        self.recordEvent('ITEM.SELECT')
        self.selectItem(value, undefined)
      },
      setValue(value: string[]) {
        self.recordEvent('VALUE.SET')
        self.setValueInternal(value, undefined)
      },
      setInputValue(value: string, reason = 'script') {
        self.recordEvent('INPUT_VALUE.SET')
        self.setInputValueInternal(value, reason)
      },
      clearValue(value?: string) {
        if (value != null) {
          self.recordEvent('ITEM.CLEAR')
          self.setValueInternal(
            self.value.filter((v) => v !== value),
            undefined,
          )
          return
        }
        self.recordEvent('VALUE.CLEAR')
        if (self.isOpen) {
          self.setInputValueInternal('', 'clear-trigger')
          self.setValueInternal([], 'clear-trigger')
          self.doClose('focused', 'clear-trigger', true)
        } else if (self.state === 'idle') {
          self.state = 'focused'
          self.setInputValueInternal('', 'clear-trigger')
          self.setValueInternal([], 'clear-trigger')
          self.setInitialFocus()
          self.notify()
        } else {
          self.setInputValueInternal('', 'clear-trigger')
          self.setValueInternal([], 'clear-trigger')
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
      syncSelectedItems() {
        self.recordEvent('SELECTED_ITEMS.SYNC')
        queueMicrotask(() => {
          self.syncSelectedItemMap()
          self.setInputValueInternal(self.inputValueFor(self.value), undefined)
        })
      },
      getItemState(props: ComboboxItemProps) {
        return self.getItemState(props)
      },
      getRootProps() {
        return {
          'data-scope': 'combobox',
          'data-part': 'root',
          dir: self.props.dir,
          id: `combobox:${id}`,
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-readonly': dataAttr(!!self.props.readOnly),
        }
      },
      getLabelProps() {
        return {
          'data-scope': 'combobox',
          'data-part': 'label',
          dir: self.props.dir,
          for: partId('input'),
          id: partId('label'),
          'data-readonly': dataAttr(!!self.props.readOnly),
          'data-disabled': dataAttr(!!self.props.disabled),
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-required': dataAttr(!!self.props.required),
          'data-focus': dataAttr(self.isFocusedTag),
          // composite mode: Zag's label click handler returns immediately
          onclick() {},
        }
      },
      getControlProps() {
        return {
          'data-scope': 'combobox',
          'data-part': 'control',
          dir: self.props.dir,
          id: partId('control'),
          'data-state': self.isOpen ? 'open' : 'closed',
          'data-focus': dataAttr(self.isFocusedTag),
          'data-disabled': dataAttr(!!self.props.disabled),
          'data-invalid': dataAttr(!!self.props.invalid),
        }
      },
      getPositionerProps() {
        return {
          'data-scope': 'combobox',
          'data-part': 'positioner',
          dir: self.props.dir,
          id: partId('popper'),
          style: getFloatingStyleString(self.currentPlacement, self.props.positioning),
        }
      },
      getInputProps() {
        const open = self.isOpen
        return {
          'data-scope': 'combobox',
          'data-part': 'input',
          dir: self.props.dir,
          'aria-invalid': ariaAttr(!!self.props.invalid),
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-autofocus': dataAttr(!!self.props.autoFocus),
          disabled: !!self.props.disabled,
          required: self.props.required,
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'none',
          spellcheck: 'false',
          readonly: !!self.props.readOnly,
          placeholder: self.props.placeholder,
          id: partId('input'),
          type: 'text',
          role: 'combobox',
          value: self.inputValue,
          'aria-autocomplete': 'list',
          'aria-controls': partId('content'),
          'aria-expanded': open,
          'data-state': open ? 'open' : 'closed',
          'aria-activedescendant': self.highlightedValue
            ? `combobox:${id}:option:${self.highlightedValue}`
            : undefined,
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            self.onInputClick()
          },
          onfocusin() {
            if (self.props.disabled) return
            self.onInputFocus()
          },
          onfocusout() {
            if (self.props.disabled) return
            self.onInputBlur()
          },
          oninput(event: Event) {
            self.onInputChange((event.currentTarget as HTMLInputElement).value)
          },
          onkeydown(event: KeyboardEvent) {
            self.onInputKeydown(event)
          },
        }
      },
      getTriggerProps() {
        const open = self.isOpen
        return {
          'data-scope': 'combobox',
          'data-part': 'trigger',
          dir: self.props.dir,
          id: partId('toggle-btn'),
          'aria-haspopup': 'listbox',
          type: 'button',
          tabindex: -1,
          'aria-label': self.props.translations.triggerLabel,
          'aria-expanded': open,
          'data-state': open ? 'open' : 'closed',
          'aria-controls': open ? partId('content') : undefined,
          disabled: !!self.props.disabled,
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-readonly': dataAttr(!!self.props.readOnly),
          'data-disabled': dataAttr(!!self.props.disabled),
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            self.onTriggerClick()
          },
          onpointerdown(event: PointerEvent) {
            if (!self.isInteractive) return
            if (event.pointerType === 'touch') return
            if (event.button !== 0) return
            event.preventDefault()
            queueMicrotask(() => self.focusInput())
          },
        }
      },
      getContentProps() {
        const open = self.isOpen
        return {
          'data-scope': 'combobox',
          'data-part': 'content',
          dir: self.props.dir,
          id: partId('content'),
          role: 'listbox',
          tabindex: -1,
          hidden: !open,
          'data-state': open ? 'open' : 'closed',
          'data-placement': self.currentPlacement,
          'data-side': self.currentPlacement ? getPlacementSide(self.currentPlacement) : undefined,
          'aria-labelledby': partId('label'),
          'data-empty': dataAttr(self.props.collection.size === 0),
          onpointerdown(event: PointerEvent) {
            // keep focus in the input while clicking inside the list
            if (event.button !== 0) return
            event.preventDefault()
          },
        }
      },
      getItemProps(props: ComboboxItemProps) {
        const itemState = self.getItemState(props)
        const value = itemState.value
        return {
          'data-scope': 'combobox',
          'data-part': 'item',
          dir: self.props.dir,
          id: `combobox:${id}:option:${value}`,
          role: 'option',
          tabindex: -1,
          'data-highlighted': dataAttr(itemState.highlighted),
          'data-state': itemState.selected ? 'checked' : 'unchecked',
          'aria-selected': ariaAttr(itemState.selected),
          'aria-disabled': ariaAttr(itemState.disabled),
          'data-disabled': dataAttr(itemState.disabled),
          'data-value': value,
          onpointermove() {
            if (itemState.disabled) return
            if (itemState.highlighted) return
            self.recordEvent('ITEM.POINTER_MOVE')
            if (self.isOpen) {
              if (self.state === 'suggesting') self.state = 'interacting'
              self.setHighlight(value)
              self.notify()
            }
          },
          onpointerleave() {
            if (props.persistFocus) return
            if (itemState.disabled) return
            if (!self.wasPointerEventBeforeLast()) return
            self.recordEvent('ITEM.POINTER_LEAVE')
            if (self.isOpen) self.setHighlight(null)
          },
          onclick(event: MouseEvent) {
            // Zag skips download/new-tab/context-menu clicks (anchor items)
            if (event.button === 2 || (event.ctrlKey && isMacLike())) return
            if (itemState.disabled) return
            self.onItemClick(value)
          },
        }
      },
      getItemTextProps(props: ComboboxItemProps) {
        const itemState = self.getItemState(props)
        return {
          'data-scope': 'combobox',
          'data-part': 'item-text',
          dir: self.props.dir,
          'data-state': itemState.selected ? 'checked' : 'unchecked',
          'data-disabled': dataAttr(itemState.disabled),
          'data-highlighted': dataAttr(itemState.highlighted),
        }
      },
      getItemIndicatorProps(props: ComboboxItemProps) {
        const itemState = self.getItemState(props)
        return {
          'aria-hidden': true,
          'data-scope': 'combobox',
          'data-part': 'item-indicator',
          dir: self.props.dir,
          'data-state': itemState.selected ? 'checked' : 'unchecked',
          hidden: !itemState.selected,
        }
      },
      getItemGroupProps(props: { id: string }) {
        return {
          'data-scope': 'combobox',
          'data-part': 'item-group',
          dir: self.props.dir,
          id: `combobox:${id}:optgroup:${props.id}`,
          'aria-labelledby': `combobox:${id}:optgroup-label:${props.id}`,
          'data-empty': dataAttr(self.props.collection.size === 0),
          role: 'group',
        }
      },
      getItemGroupLabelProps(props: { htmlFor: string }) {
        return {
          'data-scope': 'combobox',
          'data-part': 'item-group-label',
          dir: self.props.dir,
          id: `combobox:${id}:optgroup-label:${props.htmlFor}`,
          role: 'presentation',
        }
      },
    }
  }
}

export const createNativeComboboxBehavior = (): NativeComboboxBehavior =>
  new NativeComboboxBehavior()
