/**
 * Native checkbox engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/checkbox` behind the facade: the prop bags
 * emit the exact attribute, ARIA, style and event contract the Zag connect
 * produced (keys pre-normalized the way `@zag-js/vanilla` would), verified by
 * the dual-engine suite in `test/checkbox.spec.ts`.
 *
 * Model (Zag's single `ready` state): a visually-hidden native
 * `<input type=checkbox>` carries all interaction — the label root forwards
 * clicks to it, and the engine mirrors `checked`/`focused`/`hovered`/`active`
 * into `data-*` attributes on every part. Programmatic `setChecked` syncs the
 * input and re-dispatches a bubbling click (Zag's dispatchChangeEvent) so
 * external listeners observe the change; user clicks are "trusted" and skip
 * the dispatch. `data-active` press tracking covers both pointer (root) and
 * Space-on-input, and form resets restore the initial checked state.
 *
 * Not ported (unused by the registry component): controlled `checked` prop,
 * per-part `ids` overrides, fieldset-disabled tracking.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import {
  ensureInteractionModalityTracking,
  isFocusVisible,
} from '../internal/interaction-modality'
import {
  dispatchInputCheckedEvent,
  setElementChecked,
  trackFormReset,
  trackPress,
  visuallyHiddenStyle,
} from './form'

export type CheckedState = boolean | 'indeterminate'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type CheckboxProps = {
  /** Unique machine id — element ids derive from it (`checkbox:{id}`). */
  id: string
  dir?: 'ltr' | 'rtl'
  defaultChecked?: CheckedState
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  readOnly?: boolean
  name?: string
  form?: string
  value?: string
  onCheckedChange?: (details: { checked: CheckedState }) => void
}

export interface CheckboxApi {
  checked: boolean
  disabled: boolean
  indeterminate: boolean
  focused: boolean
  checkedState: CheckedState
  setChecked(checked: CheckedState): void
  toggleChecked(): void
  getRootProps(): Record<string, unknown>
  getLabelProps(): Record<string, unknown>
  getControlProps(): Record<string, unknown>
  getIndicatorProps(): Record<string, unknown>
  getHiddenInputProps(): Record<string, unknown>
}

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

export class NativeCheckboxBehavior implements BehaviorSource<CheckboxApi> {
  api: CheckboxApi | null = null

  private props!: CheckboxProps & { value: string }
  private checkedState: CheckedState = false
  private initialChecked: CheckedState = false
  private focused = false
  private focusVisible = false
  private active = false
  private hovered = false
  private readonly listeners = new Set<() => void>()
  private cleanups: Array<() => void> = []
  private started = false

  init(props: CheckboxProps): void {
    if (!props.id) throw new Error('[checkbox] `id` is required')
    this.props = { value: 'on', ...props }
    this.checkedState = props.defaultChecked ?? false
    this.initialChecked = this.checkedState
  }

  updateProps(props: Partial<CheckboxProps>): void {
    const wasDisabled = !!this.props.disabled
    this.props = { ...this.props, ...props }
    if (!wasDisabled && this.props.disabled && this.focused) {
      this.focused = false
      this.focusVisible = false
      this.notify()
    }
  }

  start(): void {
    if (this.started) return
    this.started = true
    ensureInteractionModalityTracking()
    this.api = this.buildApi()
    // effects attach once, mirroring Zag's root effects (skipped when disabled)
    queueMicrotask(() => {
      if (!this.started) return
      if (!this.props.disabled) {
        this.cleanups.push(
          trackPress({
            pointerNode: this.getRootEl(),
            keyboardNode: this.getHiddenInputEl(),
            isValidKey: (event) => event.key === ' ',
            onPress: () => this.setContext({ active: false }),
            onPressStart: () => this.setContext({ active: true }),
            onPressEnd: () => this.setContext({ active: false }),
          }),
        )
      }
      const resetCleanup = trackFormReset(this.getHiddenInputEl(), () => {
        this.setChecked(this.initialChecked, true)
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

  private get isChecked(): boolean {
    return this.checkedState === 'indeterminate' ? false : !!this.checkedState
  }

  private setContext(partial: Partial<{ focused: boolean; focusVisible: boolean; active: boolean; hovered: boolean }>): void {
    Object.assign(this, partial)
    this.notify()
  }

  /** CHECKED.SET — untrusted (programmatic) changes re-dispatch on the input. */
  private setChecked(next: CheckedState, trusted: boolean): void {
    const changed = this.checkedState !== next
    if (changed) {
      this.checkedState = next
      this.syncInputElement()
      this.props.onCheckedChange?.({ checked: next })
      this.notify()
    }
    if (!trusted) {
      queueMicrotask(() => dispatchInputCheckedEvent(this.getHiddenInputEl(), this.isChecked))
    }
  }

  /** Zag's syncInputElement watch: keep property AND attribute in step. */
  private syncInputElement(): void {
    const inputEl = this.getHiddenInputEl()
    if (!inputEl) return
    setElementChecked(inputEl, this.isChecked)
    inputEl.indeterminate = this.checkedState === 'indeterminate'
  }

  /* ----------------------------------------------------------------- dom */

  private get rootId(): string {
    return `checkbox:${this.props.id}`
  }
  private get labelId(): string {
    return `checkbox:${this.props.id}:label`
  }
  private get controlId(): string {
    return `checkbox:${this.props.id}:control`
  }
  private get hiddenInputId(): string {
    return `checkbox:${this.props.id}:input`
  }
  private getRootEl(): HTMLElement | null {
    return document.getElementById(this.rootId)
  }
  private getHiddenInputEl(): HTMLInputElement | null {
    return document.getElementById(this.hiddenInputId) as HTMLInputElement | null
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): CheckboxApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const getDataAttrs = () => {
      const disabled = !!self.props.disabled
      return {
        'data-active': dataAttr(self.active),
        'data-focus': dataAttr(!disabled && self.focused),
        'data-focus-visible': dataAttr(!disabled && self.focusVisible),
        'data-readonly': dataAttr(!!self.props.readOnly),
        'data-hover': dataAttr(self.hovered),
        'data-disabled': dataAttr(disabled),
        'data-state':
          self.checkedState === 'indeterminate'
            ? 'indeterminate'
            : self.isChecked
              ? 'checked'
              : 'unchecked',
        'data-invalid': dataAttr(!!self.props.invalid),
        'data-required': dataAttr(!!self.props.required),
      }
    }
    return {
      get checked() {
        return self.isChecked
      },
      get disabled() {
        return !!self.props.disabled
      },
      get indeterminate() {
        return self.checkedState === 'indeterminate'
      },
      get focused() {
        return !self.props.disabled && self.focused
      },
      get checkedState() {
        return self.checkedState
      },
      setChecked(checked: CheckedState) {
        self.setChecked(checked, false)
      },
      toggleChecked() {
        self.setChecked(self.checkedState === 'indeterminate' ? true : !self.isChecked, false)
      },
      getRootProps() {
        return {
          'data-scope': 'checkbox',
          'data-part': 'root',
          ...getDataAttrs(),
          dir: self.props.dir,
          id: self.rootId,
          for: self.hiddenInputId,
          onpointermove() {
            if (self.props.disabled) return
            self.setContext({ hovered: true })
          },
          onpointerleave() {
            if (self.props.disabled) return
            self.setContext({ hovered: false })
          },
          onclick(event: MouseEvent) {
            if (event.target === self.getHiddenInputEl()) event.stopPropagation()
          },
        }
      },
      getLabelProps() {
        return {
          'data-scope': 'checkbox',
          'data-part': 'label',
          ...getDataAttrs(),
          dir: self.props.dir,
          id: self.labelId,
        }
      },
      getControlProps() {
        return {
          'data-scope': 'checkbox',
          'data-part': 'control',
          ...getDataAttrs(),
          dir: self.props.dir,
          id: self.controlId,
          'aria-hidden': true,
        }
      },
      getIndicatorProps() {
        return {
          'data-scope': 'checkbox',
          'data-part': 'indicator',
          ...getDataAttrs(),
          dir: self.props.dir,
          hidden: self.checkedState !== 'indeterminate' && !self.isChecked,
        }
      },
      getHiddenInputProps() {
        return {
          id: self.hiddenInputId,
          type: 'checkbox',
          required: self.props.required,
          checked: self.isChecked,
          disabled: !!self.props.disabled,
          'aria-labelledby': self.labelId,
          'aria-invalid': !!self.props.invalid,
          name: self.props.name,
          form: self.props.form,
          value: self.props.value,
          style: visuallyHiddenStyle,
          onfocusin() {
            self.setContext({ focused: true, focusVisible: isFocusVisible() })
          },
          onfocusout() {
            self.setContext({ focused: false, focusVisible: false })
          },
          onclick(event: MouseEvent) {
            if (self.props.readOnly) {
              event.preventDefault()
              return
            }
            const checked = (event.currentTarget as HTMLInputElement).checked
            self.setChecked(checked, true)
          },
        }
      },
    }
  }
}

export const createNativeCheckboxBehavior = (): NativeCheckboxBehavior =>
  new NativeCheckboxBehavior()
