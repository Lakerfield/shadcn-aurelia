/**
 * Native radio-group engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/radio-group` behind the facade: the prop
 * bags emit the exact attribute, ARIA, style and event contract the Zag
 * connect produced (keys pre-normalized the way `@zag-js/vanilla` would),
 * verified by the dual-engine suite in `test/radio-group.spec.ts`.
 *
 * Model (Zag's single `idle` state): each item renders a visually-hidden
 * native `<input type=radio>` sharing `name` (prop `name` or the machine id),
 * so the BROWSER provides arrow-key roving and exclusive checking — the
 * engine only mirrors `value`/`focused`/`hovered`/`active` into `data-*`
 * attributes and keeps the input properties in sync. Programmatic `setValue`
 * re-dispatches a bubbling click on inputs whose checked state flips (Zag's
 * dispatchChangeEvent); user clicks are "trusted" and skip the dispatch.
 *
 * Not ported (unused by the registry component): controlled `value` prop,
 * per-part `ids` overrides, the indicator part, fieldset-disabled tracking.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import {
  ensureInteractionModalityTracking,
  isFocusVisible,
} from '../internal/interaction-modality'
import { isSafari } from './keyboard'
import { dispatchInputCheckedEvent, trackFormReset, visuallyHiddenStyle } from './form'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type RadioGroupProps = {
  /** Unique machine id — element ids derive from it (`radio-group:{id}`). */
  id: string
  dir?: 'ltr' | 'rtl'
  orientation?: 'horizontal' | 'vertical'
  name?: string
  form?: string
  disabled?: boolean
  readOnly?: boolean
  invalid?: boolean
  required?: boolean
  defaultValue?: string | null
  onValueChange?: (details: { value: string | null }) => void
}

export interface RadioItemProps {
  value: string
  disabled?: boolean
  invalid?: boolean
}

export interface RadioItemState {
  value: string
  invalid: boolean
  disabled: boolean
  checked: boolean
  focused: boolean
  focusVisible: boolean
  hovered: boolean
  active: boolean
}

export interface RadioGroupApi {
  value: string | null
  focus(): void
  setValue(value: string): void
  clearValue(): void
  getItemState(props: RadioItemProps): RadioItemState
  getRootProps(): Record<string, unknown>
  getLabelProps(): Record<string, unknown>
  getItemProps(props: RadioItemProps): Record<string, unknown>
  getItemTextProps(props: RadioItemProps): Record<string, unknown>
  getItemControlProps(props: RadioItemProps): Record<string, unknown>
  getItemHiddenInputProps(props: RadioItemProps): Record<string, unknown>
}

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

export class NativeRadioGroupBehavior implements BehaviorSource<RadioGroupApi> {
  api: RadioGroupApi | null = null

  private props!: RadioGroupProps & { orientation?: 'horizontal' | 'vertical' }
  private value: string | null = null
  private initialValue: string | null = null
  private activeValue: string | null = null
  private focusedValue: string | null = null
  private focusVisibleValue: string | null = null
  private hoveredValue: string | null = null
  private readonly listeners = new Set<() => void>()
  private cleanups: Array<() => void> = []
  private started = false

  init(props: RadioGroupProps): void {
    if (!props.id) throw new Error('[radio-group] `id` is required')
    this.props = { orientation: 'vertical', ...props }
    this.value = props.defaultValue ?? null
    this.initialValue = this.value
  }

  updateProps(props: Partial<RadioGroupProps>): void {
    this.props = { ...this.props, ...props }
  }

  start(): void {
    if (this.started) return
    this.started = true
    ensureInteractionModalityTracking()
    this.api = this.buildApi()
    // form-reset attaches once the parts carry their ids (after first apply)
    queueMicrotask(() => {
      if (!this.started) return
      const resetCleanup = trackFormReset(this.getRootEl(), () => {
        this.setValue(this.initialValue, true)
      })
      if (resetCleanup) this.cleanups.push(resetCleanup)
    })
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.cleanups.forEach((fn) => fn())
    this.cleanups = []
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

  /** SET_VALUE — untrusted changes re-dispatch on inputs whose state flips. */
  private setValue(next: string | null, trusted: boolean): void {
    if (this.value !== next) {
      this.value = next
      this.syncInputElements()
      this.props.onValueChange?.({ value: next })
      this.notify()
    }
    if (!trusted) {
      for (const input of this.getInputEls()) {
        const checked = input.value === this.value
        if (checked === input.checked) continue
        dispatchInputCheckedEvent(input, checked)
      }
    }
  }

  private setFocused(value: string | null, focusVisible: boolean): void {
    this.focusedValue = value
    this.focusVisibleValue = value != null && focusVisible ? value : null
    this.notify()
  }

  /** Zag's syncInputElements watch: keep every input property in step. */
  private syncInputElements(): void {
    for (const input of this.getInputEls()) {
      input.checked = input.value === this.value
    }
  }

  /* ----------------------------------------------------------------- dom */

  private get rootId(): string {
    return `radio-group:${this.props.id}`
  }
  private get labelId(): string {
    return `radio-group:${this.props.id}:label`
  }
  private itemId(value: string): string {
    return `radio-group:${this.props.id}:radio:${value}`
  }
  private itemHiddenInputId(value: string): string {
    return `radio-group:${this.props.id}:radio:input:${value}`
  }
  private itemControlId(value: string): string {
    return `radio-group:${this.props.id}:radio:control:${value}`
  }
  private itemLabelId(value: string): string {
    return `radio-group:${this.props.id}:radio:label:${value}`
  }
  private getRootEl(): HTMLElement | null {
    return document.getElementById(this.rootId)
  }
  private getItemHiddenInputEl(value: string): HTMLInputElement | null {
    return document.getElementById(this.itemHiddenInputId(value)) as HTMLInputElement | null
  }
  private getInputEls(): HTMLInputElement[] {
    const selector = `input[type=radio][data-ownedby='${CSS.escape(this.rootId)}']:not([disabled])`
    return Array.from(this.getRootEl()?.querySelectorAll<HTMLInputElement>(selector) ?? [])
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): RadioGroupApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const groupDisabled = () => !!self.props.disabled
    const getItemState = (props: RadioItemProps): RadioItemState => ({
      value: props.value,
      invalid: !!props.invalid || !!self.props.invalid,
      disabled: !!props.disabled || groupDisabled(),
      checked: self.value === props.value,
      focused: self.focusedValue === props.value,
      focusVisible: self.focusVisibleValue === props.value,
      hovered: self.hoveredValue === props.value,
      active: self.activeValue === props.value,
    })
    const getItemDataAttrs = (props: RadioItemProps) => {
      const itemState = getItemState(props)
      return {
        'data-focus': dataAttr(itemState.focused),
        'data-focus-visible': dataAttr(itemState.focusVisible),
        'data-disabled': dataAttr(itemState.disabled),
        'data-readonly': dataAttr(!!self.props.readOnly),
        'data-state': itemState.checked ? 'checked' : 'unchecked',
        'data-hover': dataAttr(itemState.hovered),
        'data-invalid': dataAttr(itemState.invalid),
        'data-orientation': self.props.orientation,
      }
    }
    const focus = () => {
      const rootEl = self.getRootEl()
      const nodeToFocus =
        rootEl?.querySelector<HTMLInputElement>('input:not(:disabled):checked') ??
        rootEl?.querySelector<HTMLInputElement>('input:not(:disabled)')
      nodeToFocus?.focus()
    }
    return {
      focus,
      get value() {
        return self.value
      },
      setValue(value: string) {
        self.setValue(value, false)
      },
      clearValue() {
        self.setValue(null, false)
      },
      getItemState,
      getRootProps() {
        return {
          'data-scope': 'radio-group',
          'data-part': 'root',
          role: 'radiogroup',
          id: self.rootId,
          'aria-labelledby': self.labelId,
          'aria-required': self.props.required || undefined,
          'aria-disabled': groupDisabled() || undefined,
          'aria-readonly': self.props.readOnly || undefined,
          'data-orientation': self.props.orientation,
          'data-disabled': dataAttr(groupDisabled()),
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-required': dataAttr(!!self.props.required),
          'aria-orientation': self.props.orientation,
          dir: self.props.dir,
          style: 'position:relative;',
        }
      },
      getLabelProps() {
        return {
          'data-scope': 'radio-group',
          'data-part': 'label',
          dir: self.props.dir,
          'data-orientation': self.props.orientation,
          'data-disabled': dataAttr(groupDisabled()),
          'data-invalid': dataAttr(!!self.props.invalid),
          'data-required': dataAttr(!!self.props.required),
          id: self.labelId,
          onclick: focus,
        }
      },
      getItemProps(props: RadioItemProps) {
        const itemState = getItemState(props)
        return {
          'data-scope': 'radio-group',
          'data-part': 'item',
          dir: self.props.dir,
          id: self.itemId(props.value),
          for: self.itemHiddenInputId(props.value),
          ...getItemDataAttrs(props),
          onpointermove() {
            if (itemState.disabled) return
            if (self.hoveredValue === props.value) return
            self.hoveredValue = props.value
            self.notify()
          },
          onpointerleave() {
            if (itemState.disabled) return
            self.hoveredValue = null
            self.notify()
          },
          onpointerdown(event: PointerEvent) {
            if (itemState.disabled) return
            if (event.button !== 0) return
            // keep focus on the input while re-clicking the checked item
            if (itemState.focused && event.pointerType === 'mouse') event.preventDefault()
            self.activeValue = props.value
            self.notify()
          },
          onpointerup() {
            if (itemState.disabled) return
            self.activeValue = null
            self.notify()
          },
          onclick() {
            if (!itemState.disabled && isSafari()) {
              self.getItemHiddenInputEl(props.value)?.focus()
            }
          },
        }
      },
      getItemTextProps(props: RadioItemProps) {
        return {
          'data-scope': 'radio-group',
          'data-part': 'item-text',
          dir: self.props.dir,
          id: self.itemLabelId(props.value),
          ...getItemDataAttrs(props),
        }
      },
      getItemControlProps(props: RadioItemProps) {
        const itemState = getItemState(props)
        return {
          'data-scope': 'radio-group',
          'data-part': 'item-control',
          dir: self.props.dir,
          id: self.itemControlId(props.value),
          'data-active': dataAttr(itemState.active),
          'aria-hidden': true,
          ...getItemDataAttrs(props),
        }
      },
      getItemHiddenInputProps(props: RadioItemProps) {
        const itemState = getItemState(props)
        return {
          'data-ownedby': self.rootId,
          id: self.itemHiddenInputId(props.value),
          type: 'radio',
          name: self.props.name || self.props.id,
          form: self.props.form,
          value: props.value,
          required: self.props.required,
          'aria-labelledby': self.itemLabelId(props.value),
          'aria-invalid': itemState.invalid || undefined,
          onclick(event: MouseEvent) {
            if (self.props.readOnly) {
              event.preventDefault()
              return
            }
            if ((event.currentTarget as HTMLInputElement).checked) {
              self.setValue(props.value, true)
            }
          },
          onfocusout() {
            self.setFocused(null, false)
          },
          onfocusin() {
            self.setFocused(props.value, isFocusVisible())
          },
          onkeydown(event: KeyboardEvent) {
            if (event.defaultPrevented) return
            if (event.key === ' ') {
              self.activeValue = props.value
              self.notify()
            }
          },
          onkeyup(event: KeyboardEvent) {
            if (event.defaultPrevented) return
            if (event.key === ' ') {
              self.activeValue = null
              self.notify()
            }
          },
          disabled: itemState.disabled || !!self.props.readOnly,
          checked: itemState.checked,
          style: visuallyHiddenStyle,
        }
      },
    }
  }
}

export const createNativeRadioGroupBehavior = (): NativeRadioGroupBehavior =>
  new NativeRadioGroupBehavior()
