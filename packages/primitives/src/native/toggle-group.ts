/**
 * Native toggle-group engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/toggle-group` behind the facade: the prop
 * bags emit the exact attribute, ARIA and event contract the Zag connect
 * produced (keys pre-normalized the way `@zag-js/vanilla` would), verified by
 * the dual-engine suite in `test/toggle-group.spec.ts`.
 *
 * Model (Zag's idle ↔ focused pair): roving focus across the item buttons
 * (`[data-ownedby='<rootId>']:not([data-disabled])`, arrows wrap when
 * `loopFocus`), with the root itself as the initial tab stop — focusing the
 * root forwards to the first toggle. Single mode renders radio semantics
 * (`role=radiogroup`/`radio` + `aria-checked`), multiple mode a plain group
 * with `aria-pressed`. Shift-Tab briefly drops the root's tabindex to -1
 * (`isTabbingBackward`) so focus leaves the group instead of landing on it.
 *
 * Not ported (unused by the registry component): controlled `value` prop,
 * per-part `ids` overrides, `rovingFocus: false`, the toolbar integration
 * (`isWithinToolbar` — computed but unused in current Zag too).
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import { getEventKey, isSafari } from './keyboard'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type ToggleGroupProps = {
  /** Unique machine id — element ids derive from it (`toggle-group:{id}`). */
  id: string
  dir?: 'ltr' | 'rtl'
  orientation?: 'horizontal' | 'vertical'
  multiple?: boolean
  disabled?: boolean
  rovingFocus?: boolean
  loopFocus?: boolean
  deselectable?: boolean
  defaultValue?: string[]
  onValueChange?: (details: { value: string[] }) => void
}

export interface ToggleItemProps {
  value: string
  disabled?: boolean
}

export interface ToggleItemState {
  id: string
  disabled: boolean
  pressed: boolean
  focused: boolean
}

export interface ToggleGroupApi {
  value: string[]
  setValue(value: string[]): void
  getItemState(props: ToggleItemProps): ToggleItemState
  getRootProps(): Record<string, unknown>
  getItemProps(props: ToggleItemProps): Record<string, unknown>
}

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

const raf = (fn: () => void): (() => void) => {
  const id = requestAnimationFrame(fn)
  return () => cancelAnimationFrame(id)
}

export class NativeToggleGroupBehavior implements BehaviorSource<ToggleGroupApi> {
  api: ToggleGroupApi | null = null

  private props!: ToggleGroupProps & {
    orientation: 'horizontal' | 'vertical'
    rovingFocus: boolean
    loopFocus: boolean
    deselectable: boolean
  }
  private state: 'idle' | 'focused' = 'idle'
  private value: string[] = []
  private focusedId: string | null = null
  private isTabbingBackward = false
  private isClickFocus = false
  private readonly listeners = new Set<() => void>()
  private readonly rafCleanups = new Set<() => void>()
  private started = false

  init(props: ToggleGroupProps): void {
    if (!props.id) throw new Error('[toggle-group] `id` is required')
    this.props = {
      orientation: 'horizontal',
      rovingFocus: true,
      loopFocus: true,
      deselectable: true,
      ...props,
    }
    this.value = props.defaultValue ?? []
  }

  updateProps(props: Partial<ToggleGroupProps>): void {
    this.props = { ...this.props, ...props }
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.api = this.buildApi()
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.rafCleanups.forEach((fn) => fn())
    this.rafCleanups.clear()
    this.state = 'idle'
    this.focusedId = null
    this.isTabbingBackward = false
    this.isClickFocus = false
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

  private schedule(fn: () => void): void {
    const cleanup = raf(() => {
      this.rafCleanups.delete(cleanup)
      if (this.started) fn()
    })
    this.rafCleanups.add(cleanup)
  }

  /** Zag's setValue action — array replaces, else single/multiple toggling. */
  private setValue(next: string | string[]): void {
    let value: string[]
    if (Array.isArray(next)) {
      value = next
    } else if (this.props.multiple) {
      value = this.value.includes(next)
        ? this.value.filter((v) => v !== next)
        : [...this.value, next]
    } else {
      const isSelected = this.value.length === 1 && this.value[0] === next
      value = isSelected && this.props.deselectable ? [] : [next]
    }
    this.value = value
    // like Zag's bindable (Object.is): a fresh array always reports a change
    this.props.onValueChange?.({ value })
    this.notify()
  }

  private focusMove(target: 'next' | 'prev' | 'first' | 'last'): void {
    this.schedule(() => {
      const els = this.getToggleEls()
      let el: HTMLElement | undefined | null
      if (target === 'first') el = els[0]
      else if (target === 'last') el = els.at(-1)
      else {
        if (!this.focusedId) return
        const idx = els.findIndex((e) => e.id === this.focusedId)
        const { loopFocus } = this.props
        if (target === 'next') {
          el = loopFocus ? els[(idx + 1) % els.length] : els[Math.min(idx + 1, els.length - 1)]
        } else if (idx === -1) {
          el = loopFocus ? els.at(-1) : null
        } else {
          el = loopFocus ? els[(idx - 1 + els.length) % els.length] : els[Math.max(0, idx - 1)]
        }
      }
      el?.focus({ preventScroll: true })
    })
  }

  /* ----------------------------------------------------------------- dom */

  private get rootId(): string {
    return `toggle-group:${this.props.id}`
  }
  private itemId(value: string): string {
    return `toggle-group:${this.props.id}:${value}`
  }
  private getToggleEls(): HTMLElement[] {
    const rootEl = document.getElementById(this.rootId)
    const selector = `[data-ownedby='${CSS.escape(this.rootId)}']:not([data-disabled])`
    return Array.from(rootEl?.querySelectorAll<HTMLElement>(selector) ?? [])
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): ToggleGroupApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const getItemState = (props: ToggleItemProps): ToggleItemState => ({
      id: self.itemId(props.value),
      disabled: Boolean(props.disabled || self.props.disabled),
      pressed: self.value.includes(props.value),
      focused: self.focusedId === self.itemId(props.value),
    })
    return {
      get value() {
        return self.value
      },
      setValue(value: string[]) {
        self.setValue(value)
      },
      getItemState,
      getRootProps() {
        const isSingle = !self.props.multiple
        return {
          'data-scope': 'toggle-group',
          'data-part': 'root',
          id: self.rootId,
          dir: self.props.dir,
          role: isSingle ? 'radiogroup' : 'group',
          tabindex: self.isTabbingBackward ? -1 : 0,
          'data-disabled': dataAttr(!!self.props.disabled),
          'data-orientation': self.props.orientation,
          'data-focus': dataAttr(self.focusedId != null),
          style: 'outline:none;',
          onmousedown() {
            if (self.props.disabled) return
            self.isClickFocus = true
          },
          onfocusin(event: FocusEvent) {
            if (self.props.disabled) return
            if (event.currentTarget !== event.target) return
            if (self.isClickFocus) return
            if (self.isTabbingBackward) return
            if (self.state === 'idle') {
              self.state = 'focused'
              self.isClickFocus = false
              self.focusMove('first')
              self.notify()
            }
          },
          onfocusout(event: FocusEvent) {
            const target = event.relatedTarget as Node | null
            if (target && (event.currentTarget as HTMLElement).contains(target)) return
            if (self.props.disabled) return
            if (self.state === 'focused') {
              self.state = 'idle'
              self.isTabbingBackward = false
              self.focusedId = null
              self.isClickFocus = false
              self.notify()
            }
          },
        }
      },
      getItemProps(props: ToggleItemProps) {
        const itemState = getItemState(props)
        const isSingle = !self.props.multiple
        const rovingTabIndex = itemState.focused ? 0 : -1
        return {
          'data-scope': 'toggle-group',
          'data-part': 'item',
          id: itemState.id,
          type: 'button',
          'data-ownedby': self.rootId,
          'data-focus': dataAttr(itemState.focused),
          disabled: itemState.disabled,
          tabindex: self.props.rovingFocus ? rovingTabIndex : undefined,
          role: isSingle ? 'radio' : undefined,
          'aria-checked': isSingle ? itemState.pressed : undefined,
          'aria-pressed': isSingle ? undefined : itemState.pressed,
          'data-disabled': dataAttr(itemState.disabled),
          'data-orientation': self.props.orientation,
          dir: self.props.dir,
          'data-state': itemState.pressed ? 'on' : 'off',
          onfocusin() {
            if (itemState.disabled) return
            self.state = 'focused'
            self.focusedId = itemState.id
            self.notify()
          },
          onclick(event: MouseEvent) {
            if (itemState.disabled) return
            self.setValue(props.value)
            if (isSafari()) {
              ;(event.currentTarget as HTMLElement).focus({ preventScroll: true })
            }
          },
          onkeydown(event: KeyboardEvent) {
            if (event.defaultPrevented) return
            const currentTarget = event.currentTarget as HTMLElement | null
            if (!currentTarget?.contains(event.target as Node | null)) return
            if (itemState.disabled) return
            const { rovingFocus } = self.props
            const isHorizontal = self.props.orientation === 'horizontal'
            const keyMap: Record<string, () => void> = {
              Tab() {
                // Zag literal: any Tab press marks backward-tabbing; blur clears
                if (self.state === 'focused') {
                  const first = self.getToggleEls()[0]
                  if (self.focusedId !== first?.id) self.state = 'idle'
                  self.isTabbingBackward = true
                  self.notify()
                }
              },
              ArrowLeft() {
                if (!rovingFocus || !isHorizontal) return
                if (self.state === 'focused') self.focusMove('prev')
              },
              ArrowRight() {
                if (!rovingFocus || !isHorizontal) return
                if (self.state === 'focused') self.focusMove('next')
              },
              ArrowUp() {
                if (!rovingFocus || isHorizontal) return
                if (self.state === 'focused') self.focusMove('prev')
              },
              ArrowDown() {
                if (!rovingFocus || isHorizontal) return
                if (self.state === 'focused') self.focusMove('next')
              },
              Home() {
                if (!rovingFocus) return
                if (self.state === 'focused') self.focusMove('first')
              },
              End() {
                if (!rovingFocus) return
                if (self.state === 'focused') self.focusMove('last')
              },
            }
            const exec = keyMap[getEventKey(event)]
            if (exec) {
              exec()
              if (event.key !== 'Tab') event.preventDefault()
            }
          },
        }
      },
    }
  }
}

export const createNativeToggleGroupBehavior = (): NativeToggleGroupBehavior =>
  new NativeToggleGroupBehavior()
