/**
 * Native tabs engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/tabs` behind the facade: the prop bags
 * emit the exact attribute, ARIA and event contract the Zag connect produced
 * (keys pre-normalized the way `@zag-js/vanilla` would), verified by the
 * dual-engine suite in `test/tabs.spec.ts`.
 *
 * Behavior model (same as the Zag machine): a flat idle ↔ focused pair with
 * roving tabindex — the selected trigger is the only tab stop, Arrow keys
 * move focus across enabled triggers (`[role=tab][data-ownedby='<listId>']`
 * in document order, wrapping when `loopFocus`), and in `automatic`
 * activation mode focusing a tab also selects it (deferred a frame, exactly
 * like Zag's raf'd `selectFocusedTab`). The selected content panel gets
 * `tabindex="0"` only when it contains nothing focusable (`syncTabIndex`).
 *
 * Not ported (unused by the registry component): controlled `value` prop,
 * the indicator part (shadcn tabs style the trigger itself), `deselectable`,
 * anchor-trigger `navigate`, `composite: false` and `translations`.
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import { getEventKey, isSafari } from './keyboard'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type TabsProps = {
  /** Unique machine id — element ids derive from it (`tabs:{id}`). */
  id: string
  dir?: 'ltr' | 'rtl'
  orientation?: 'horizontal' | 'vertical'
  activationMode?: 'automatic' | 'manual'
  loopFocus?: boolean
  defaultValue?: string | null
  onValueChange?: (details: { value: string }) => void
  onFocusChange?: (details: { focusedValue: string | null }) => void
}

export interface TabsTriggerProps {
  value: string
  disabled?: boolean
}

export interface TabsTriggerState {
  selected: boolean
  focused: boolean
  disabled: boolean
}

export interface TabsApi {
  value: string | null
  focusedValue: string | null
  setValue(value: string): void
  clearValue(): void
  syncTabIndex(): void
  focus(): void
  getTriggerState(props: TabsTriggerProps): TabsTriggerState
  getRootProps(): Record<string, unknown>
  getListProps(): Record<string, unknown>
  getTriggerProps(props: TabsTriggerProps): Record<string, unknown>
  getContentProps(props: { value: string }): Record<string, unknown>
}

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

const raf = (fn: () => void): (() => void) => {
  const id = requestAnimationFrame(fn)
  return () => cancelAnimationFrame(id)
}

/** Zag's focusable query, used to decide whether a panel needs tabindex=0. */
const focusableSelector =
  "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], button:not([disabled]), [tabindex], iframe, object, embed, area[href], audio[controls], video[controls], [contenteditable]:not([contenteditable='false']), details > summary:first-of-type"

/** Zag's isFocusable: matches the selector, not inert, and actually visible. */
const hasFocusableChild = (container: HTMLElement): boolean =>
  Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).some(
    (el) =>
      !el.closest('[inert]') &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0),
  )

export class NativeTabsBehavior implements BehaviorSource<TabsApi> {
  api: TabsApi | null = null

  private props!: TabsProps & {
    dir: 'ltr' | 'rtl'
    orientation: 'horizontal' | 'vertical'
    activationMode: 'automatic' | 'manual'
    loopFocus: boolean
  }
  private state: 'idle' | 'focused' = 'idle'
  private value: string | null = null
  private focusedValue: string | null = null
  private readonly listeners = new Set<() => void>()
  private readonly rafCleanups = new Set<() => void>()
  private started = false

  init(props: TabsProps): void {
    if (!props.id) throw new Error('[tabs] `id` is required')
    this.props = {
      dir: 'ltr',
      orientation: 'horizontal',
      activationMode: 'automatic',
      loopFocus: true,
      ...props,
    }
    this.value = props.defaultValue ?? null
    this.focusedValue = props.defaultValue ?? null
  }

  updateProps(props: Partial<TabsProps>): void {
    this.props = { ...this.props, ...props }
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.api = this.buildApi()
    this.syncContentTabIndex()
    this.notify()
  }

  stop(): void {
    if (!this.started) return
    this.started = false
    this.rafCleanups.forEach((fn) => fn())
    this.rafCleanups.clear()
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

  /* ------------------------------------------------------------- machine */

  private schedule(fn: () => void): void {
    const cleanup = raf(() => {
      this.rafCleanups.delete(cleanup)
      if (this.started) fn()
    })
    this.rafCleanups.add(cleanup)
  }

  private setValue(next: string | null): void {
    if (this.value === next) return
    this.value = next
    // Zag's bindable onChange fires for every change, including clearValue's null
    this.props.onValueChange?.({ value: next as string })
    this.syncContentTabIndex()
    this.notify()
  }

  private setFocusedValue(next: string | null): void {
    if (this.focusedValue === next) return
    this.focusedValue = next
    this.props.onFocusChange?.({ focusedValue: next })
    this.notify()
  }

  private tabFocus(value: string): void {
    this.state = 'focused'
    this.setFocusedValue(value)
    this.notify()
  }

  private tabBlur(): void {
    this.state = 'idle'
    this.setFocusedValue(null)
    this.notify()
  }

  private tabClick(value: string): void {
    this.state = 'focused'
    this.setFocusedValue(value)
    this.setValue(value)
  }

  /** Arrow/Home/End navigation — moves focus, then selects in automatic mode. */
  private navigate(target: 'next' | 'prev' | 'first' | 'last'): void {
    const els = this.getTriggerEls()
    let el: HTMLElement | undefined | null
    if (target === 'first') el = els[0]
    else if (target === 'last') el = els.at(-1)
    else {
      if (!this.focusedValue) return
      const idx = els.findIndex((e) => e.id === this.triggerId(this.focusedValue!))
      const { loopFocus } = this.props
      if (target === 'next') {
        el = loopFocus ? els[(idx + 1) % els.length] : els[Math.min(idx + 1, els.length - 1)]
      } else {
        if (idx === -1) el = loopFocus ? els.at(-1) : null
        else el = loopFocus ? els[(idx - 1 + els.length) % els.length] : els[Math.max(0, idx - 1)]
      }
    }
    this.schedule(() => el?.focus())
    if (this.props.activationMode === 'automatic') {
      // Zag's raf'd selectFocusedTab: reads focusedValue AFTER the focus above
      // landed (focusing dispatches focusin → tabFocus → setFocusedValue)
      this.schedule(() => {
        if (this.focusedValue) this.setValue(this.focusedValue)
      })
    }
  }

  /** Zag's syncTabIndex: panels without focusable children become tab stops. */
  private syncContentTabIndex(): void {
    this.schedule(() => {
      if (!this.value) return
      const contentEl = document.getElementById(this.contentId(this.value))
      if (!contentEl) return
      if (hasFocusableChild(contentEl)) {
        contentEl.removeAttribute('tabindex')
      } else {
        contentEl.setAttribute('tabindex', '0')
      }
    })
  }

  /* ----------------------------------------------------------------- dom */

  private get rootId(): string {
    return `tabs:${this.props.id}`
  }
  private get listId(): string {
    return `tabs:${this.props.id}:list`
  }
  private contentId(value: string): string {
    return `tabs:${this.props.id}:content-${value}`
  }
  private triggerId(value: string): string {
    return `tabs:${this.props.id}:trigger-${value}`
  }

  private getTriggerEls(): HTMLElement[] {
    const listEl = document.getElementById(this.listId)
    const selector = `[role=tab][data-ownedby='${CSS.escape(this.listId)}']:not([disabled])`
    return Array.from(listEl?.querySelectorAll<HTMLElement>(selector) ?? [])
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): TabsApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const getTriggerState = (props: TabsTriggerProps): TabsTriggerState => ({
      selected: self.value === props.value,
      focused: self.focusedValue === props.value,
      disabled: !!props.disabled,
    })
    return {
      get value() {
        return self.value
      },
      get focusedValue() {
        return self.focusedValue
      },
      setValue(value: string) {
        self.setValue(value)
      },
      clearValue() {
        self.setValue(null)
      },
      syncTabIndex() {
        self.syncContentTabIndex()
      },
      focus() {
        if (!self.value) return
        document.getElementById(self.triggerId(self.value))?.focus()
      },
      getTriggerState,
      getRootProps() {
        return {
          'data-scope': 'tabs',
          'data-part': 'root',
          id: self.rootId,
          'data-orientation': self.props.orientation,
          'data-focus': dataAttr(self.state === 'focused'),
          dir: self.props.dir,
        }
      },
      getListProps() {
        return {
          'data-scope': 'tabs',
          'data-part': 'list',
          id: self.listId,
          role: 'tablist',
          dir: self.props.dir,
          'data-focus': dataAttr(self.state === 'focused'),
          'aria-orientation': self.props.orientation,
          'data-orientation': self.props.orientation,
          onkeydown(event: KeyboardEvent) {
            if (event.defaultPrevented) return
            if (event.isComposing) return
            const currentTarget = event.currentTarget as HTMLElement | null
            if (!currentTarget?.contains(event.target as Node | null)) return
            const isHorizontal = self.props.orientation === 'horizontal'
            const keyMap: Record<string, () => void> = {
              ArrowDown() {
                if (isHorizontal) return
                self.navigate('next')
              },
              ArrowUp() {
                if (isHorizontal) return
                self.navigate('prev')
              },
              ArrowLeft() {
                if (!isHorizontal) return
                self.navigate('prev')
              },
              ArrowRight() {
                if (!isHorizontal) return
                self.navigate('next')
              },
              Home() {
                self.navigate('first')
              },
              End() {
                self.navigate('last')
              },
            }
            const key = getEventKey(event, {
              dir: self.props.dir,
              orientation: self.props.orientation,
            })
            const exec = keyMap[key]
            if (exec) {
              event.preventDefault()
              exec()
            }
          },
        }
      },
      getTriggerProps(props: TabsTriggerProps) {
        const { value, disabled } = props
        const triggerState = getTriggerState(props)
        return {
          'data-scope': 'tabs',
          'data-part': 'trigger',
          role: 'tab',
          type: 'button',
          disabled,
          dir: self.props.dir,
          'data-orientation': self.props.orientation,
          'data-disabled': dataAttr(!!disabled),
          'aria-disabled': disabled,
          'data-value': value,
          'aria-selected': triggerState.selected,
          'data-selected': dataAttr(triggerState.selected),
          'data-focus': dataAttr(triggerState.focused),
          'aria-controls': triggerState.selected ? self.contentId(value) : undefined,
          'data-ownedby': self.listId,
          id: self.triggerId(value),
          tabindex: triggerState.selected ? 0 : -1,
          onfocusin() {
            self.tabFocus(value)
          },
          onfocusout(event: FocusEvent) {
            const target = event.relatedTarget as HTMLElement | null
            if (target?.getAttribute('role') !== 'tab') self.tabBlur()
          },
          onclick(event: MouseEvent) {
            if (event.defaultPrevented) return
            if (disabled) return
            if (isSafari()) (event.currentTarget as HTMLElement | null)?.focus()
            self.tabClick(value)
          },
        }
      },
      getContentProps(props: { value: string }) {
        const { value } = props
        const selected = self.value === value
        return {
          'data-scope': 'tabs',
          'data-part': 'content',
          dir: self.props.dir,
          id: self.contentId(value),
          tabindex: 0,
          'aria-labelledby': self.triggerId(value),
          role: 'tabpanel',
          'data-ownedby': self.listId,
          'data-selected': dataAttr(selected),
          'data-orientation': self.props.orientation,
          hidden: !selected,
        }
      },
    }
  }
}

export const createNativeTabsBehavior = (): NativeTabsBehavior => new NativeTabsBehavior()
