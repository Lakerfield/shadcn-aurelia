/**
 * Native switch engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/switch` behind the facade: the prop bags
 * emit the exact attribute, ARIA, style and event contract the Zag connect
 * produced (keys pre-normalized the way `@zag-js/vanilla` would), verified by
 * the dual-engine suite in `test/switch.spec.ts`.
 *
 * Structurally the checkbox engine minus `indeterminate`, plus a thumb part:
 * a visually-hidden `<input type=checkbox>` carries the interaction, the
 * engine mirrors state into `data-*` attributes on root/control/thumb/label.
 * See `native/checkbox.ts` for the model notes (trusted vs programmatic
 * changes, press tracking, form reset).
 *
 * Not ported (unused by the registry component): controlled `checked` prop,
 * per-part `ids` overrides, fieldset-disabled tracking.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import {
  ensureInteractionModalityTracking,
  isFocusVisible,
} from '../internal/interaction-modality'
import { isSafari } from './keyboard'
import {
  dispatchInputCheckedEvent,
  setElementChecked,
  trackFormReset,
  trackPress,
  visuallyHiddenStyle,
} from './form'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type SwitchProps = {
  /** Unique machine id — element ids derive from it (`switch:{id}`). */
  id: string
  dir?: 'ltr' | 'rtl'
  defaultChecked?: boolean
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  readOnly?: boolean
  name?: string
  form?: string
  value?: string
  onCheckedChange?: (details: { checked: boolean }) => void
}

export interface SwitchApi {
  checked: boolean
  disabled: boolean
  focused: boolean
  setChecked(checked: boolean): void
  toggleChecked(): void
  getRootProps(): Record<string, unknown>
  getLabelProps(): Record<string, unknown>
  getThumbProps(): Record<string, unknown>
  getControlProps(): Record<string, unknown>
  getHiddenInputProps(): Record<string, unknown>
}

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

export class NativeSwitchBehavior implements BehaviorSource<SwitchApi> {
  api: SwitchApi | null = null

  private props!: SwitchProps & { value: string }
  private checked = false
  private initialChecked = false
  private focused = false
  private focusVisible = false
  private active = false
  private hovered = false
  private readonly listeners = new Set<() => void>()
  private cleanups: Array<() => void> = []
  private started = false

  init(props: SwitchProps): void {
    if (!props.id) throw new Error('[switch] `id` is required')
    this.props = { value: 'on', ...props }
    this.checked = props.defaultChecked ?? false
    this.initialChecked = this.checked
  }

  updateProps(props: Partial<SwitchProps>): void {
    const wasDisabled = !!this.props.disabled
    this.props = { ...this.props, ...props }
    if (!wasDisabled && this.props.disabled && this.focused) {
      this.focused = false
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

  private setContext(partial: Partial<{ focused: boolean; focusVisible: boolean; active: boolean; hovered: boolean }>): void {
    Object.assign(this, partial)
    this.notify()
  }

  /** CHECKED.SET — untrusted (programmatic) changes re-dispatch on the input. */
  private setChecked(next: boolean, trusted: boolean): void {
    const changed = this.checked !== next
    if (changed) {
      this.checked = next
      setElementChecked(this.getHiddenInputEl(), next)
      this.props.onCheckedChange?.({ checked: next })
      this.notify()
    }
    if (!trusted) {
      queueMicrotask(() => dispatchInputCheckedEvent(this.getHiddenInputEl(), this.checked))
    }
  }

  /* ----------------------------------------------------------------- dom */

  private get rootId(): string {
    return `switch:${this.props.id}`
  }
  private get labelId(): string {
    return `switch:${this.props.id}:label`
  }
  private get thumbId(): string {
    return `switch:${this.props.id}:thumb`
  }
  private get controlId(): string {
    return `switch:${this.props.id}:control`
  }
  private get hiddenInputId(): string {
    return `switch:${this.props.id}:input`
  }
  private getRootEl(): HTMLElement | null {
    return document.getElementById(this.rootId)
  }
  private getHiddenInputEl(): HTMLInputElement | null {
    return document.getElementById(this.hiddenInputId) as HTMLInputElement | null
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): SwitchApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const getDataAttrs = () => {
      const disabled = !!self.props.disabled
      return {
        'data-active': dataAttr(!disabled && self.active),
        'data-focus': dataAttr(!disabled && self.focused),
        'data-focus-visible': dataAttr(!disabled && self.focusVisible),
        'data-readonly': dataAttr(!!self.props.readOnly),
        'data-hover': dataAttr(self.hovered),
        'data-disabled': dataAttr(disabled),
        'data-state': self.checked ? 'checked' : 'unchecked',
        'data-invalid': dataAttr(!!self.props.invalid),
        'data-required': dataAttr(!!self.props.required),
      }
    }
    return {
      get checked() {
        return self.checked
      },
      get disabled() {
        return !!self.props.disabled
      },
      get focused() {
        return !self.props.disabled && self.focused
      },
      setChecked(checked: boolean) {
        self.setChecked(checked, false)
      },
      toggleChecked() {
        self.setChecked(!self.checked, false)
      },
      getRootProps() {
        return {
          'data-scope': 'switch',
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
            if (self.props.disabled) return
            if (event.target === self.getHiddenInputEl()) event.stopPropagation()
            if (isSafari()) self.getHiddenInputEl()?.focus()
          },
        }
      },
      getLabelProps() {
        return {
          'data-scope': 'switch',
          'data-part': 'label',
          ...getDataAttrs(),
          dir: self.props.dir,
          id: self.labelId,
        }
      },
      getThumbProps() {
        return {
          'data-scope': 'switch',
          'data-part': 'thumb',
          ...getDataAttrs(),
          dir: self.props.dir,
          id: self.thumbId,
          'aria-hidden': true,
        }
      },
      getControlProps() {
        return {
          'data-scope': 'switch',
          'data-part': 'control',
          ...getDataAttrs(),
          dir: self.props.dir,
          id: self.controlId,
          'aria-hidden': true,
        }
      },
      getHiddenInputProps() {
        return {
          id: self.hiddenInputId,
          type: 'checkbox',
          required: self.props.required,
          checked: self.checked,
          disabled: !!self.props.disabled,
          'aria-labelledby': self.labelId,
          'aria-invalid': self.props.invalid,
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

export const createNativeSwitchBehavior = (): NativeSwitchBehavior => new NativeSwitchBehavior()
