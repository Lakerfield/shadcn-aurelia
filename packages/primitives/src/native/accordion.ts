/**
 * Native accordion engine — Phase 8 migration off Zag.
 *
 * Drop-in replacement for `@zag-js/accordion` behind the facade: the prop
 * bags emit the exact attribute, ARIA and event contract the Zag connect
 * produced (keys pre-normalized the way `@zag-js/vanilla` would), verified by
 * the dual-engine suite in `test/accordion.spec.ts`.
 *
 * Behavior model (same as the Zag machine): a flat idle ↔ focused pair —
 * `focusedValue` tracks the trigger that currently has focus, `value` holds
 * the open item values. Toggling follows the WAI-ARIA accordion pattern:
 * single mode replaces the open item (collapsing only when `collapsible`),
 * multiple mode adds/removes. Arrow/Home/End navigation moves focus across
 * enabled triggers, discovered in the DOM via
 * `[data-controls][data-ownedby='<rootId>']:not([disabled])` — identical to
 * Zag's roving query, so document order decides the sequence.
 *
 * Not ported (unused by the registry component): controlled `value` prop and
 * per-part id overrides (`ids`).
 */
import type { BehaviorSource } from '../adapter/zag-behavior'
import { getEventKey, isSafari } from './keyboard'

// type alias (not interface) so it stays assignable to Record<string, unknown>
export type AccordionProps = {
  /** Unique machine id — element ids derive from it (`accordion:{id}`). */
  id: string
  dir?: 'ltr' | 'rtl'
  orientation?: 'horizontal' | 'vertical'
  multiple?: boolean
  collapsible?: boolean
  disabled?: boolean
  defaultValue?: string[]
  onValueChange?: (details: { value: string[] }) => void
  onFocusChange?: (details: { value: string | null }) => void
}

export interface AccordionItemProps {
  value: string
  disabled?: boolean
}

export interface AccordionItemState {
  expanded: boolean
  focused: boolean
  disabled: boolean
}

export interface AccordionApi {
  focusedValue: string | null
  value: string[]
  setValue(value: string[]): void
  getItemState(props: AccordionItemProps): AccordionItemState
  getRootProps(): Record<string, unknown>
  getItemProps(props: AccordionItemProps): Record<string, unknown>
  getItemContentProps(props: AccordionItemProps): Record<string, unknown>
  getItemIndicatorProps(props: AccordionItemProps): Record<string, unknown>
  getItemTriggerProps(props: AccordionItemProps): Record<string, unknown>
}

const dataAttr = (cond: boolean): '' | undefined => (cond ? '' : undefined)

export class NativeAccordionBehavior implements BehaviorSource<AccordionApi> {
  api: AccordionApi | null = null

  private props!: AccordionProps & { orientation: 'horizontal' | 'vertical' }
  /**
   * Zag's idle ↔ focused pair: clicks and Arrow/Home/End navigation are only
   * handled while a trigger has focus (a real click always focuses first).
   */
  private state: 'idle' | 'focused' = 'idle'
  private value: string[] = []
  private focusedValue: string | null = null
  private readonly listeners = new Set<() => void>()
  private started = false

  init(props: AccordionProps): void {
    if (!props.id) throw new Error('[accordion] `id` is required')
    this.props = { orientation: 'vertical', ...props }
    this.value = props.defaultValue ?? []
  }

  updateProps(props: Partial<AccordionProps>): void {
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
    this.state = 'idle'
    this.focusedValue = null
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

  private setValue(next: string[]): void {
    if (this.value.length === next.length && this.value.every((v, i) => v === next[i])) return
    this.value = next
    this.props.onValueChange?.({ value: next })
    this.notify()
  }

  private setFocusedValue(next: string | null): void {
    if (this.focusedValue === next) return
    this.focusedValue = next
    this.props.onFocusChange?.({ value: next })
    this.notify()
  }

  /** TRIGGER.CLICK — expand/collapse following the single/multiple rules. */
  private toggle(itemValue: string): void {
    if (this.state !== 'focused') return
    const expanded = this.value.includes(itemValue)
    const canToggle = !!this.props.collapsible || !!this.props.multiple
    if (expanded && canToggle) {
      this.setValue(this.props.multiple ? this.value.filter((v) => v !== itemValue) : [])
    } else if (!expanded) {
      this.setValue(this.props.multiple ? [...this.value, itemValue] : [itemValue])
    }
  }

  /* ----------------------------------------------------------------- dom */

  private get rootId(): string {
    return `accordion:${this.props.id}`
  }
  private itemId(value: string): string {
    return `accordion:${this.props.id}:item:${value}`
  }
  private contentId(value: string): string {
    return `accordion:${this.props.id}:content:${value}`
  }
  private triggerId(value: string): string {
    return `accordion:${this.props.id}:trigger:${value}`
  }

  /** Enabled triggers in document order — Zag's roving-focus query. */
  private getTriggerEls(): HTMLElement[] {
    const rootEl = document.getElementById(this.rootId)
    const selector = `[data-controls][data-ownedby='${CSS.escape(this.rootId)}']:not([disabled])`
    return Array.from(rootEl?.querySelectorAll<HTMLElement>(selector) ?? [])
  }

  private focusSibling(offset: 1 | -1): void {
    if (this.state !== 'focused' || !this.focusedValue) return
    const els = this.getTriggerEls()
    const idx = els.findIndex((el) => el.id === this.triggerId(this.focusedValue!))
    if (offset === 1) {
      els[(idx + 1) % els.length]?.focus()
    } else {
      els[idx === -1 ? els.length - 1 : (idx - 1 + els.length) % els.length]?.focus()
    }
  }

  /* ----------------------------------------------------------------- api */

  private buildApi(): AccordionApi {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const getItemState = (props: AccordionItemProps): AccordionItemState => ({
      expanded: self.value.includes(props.value),
      focused: self.focusedValue === props.value,
      disabled: Boolean(props.disabled ?? self.props.disabled),
    })
    return {
      get focusedValue() {
        return self.focusedValue
      },
      get value() {
        return self.value
      },
      setValue(value: string[]) {
        let next = value
        if (!self.props.multiple && next.length > 1) next = [next[0]]
        self.setValue(next)
      },
      getItemState,
      getRootProps() {
        return {
          'data-scope': 'accordion',
          'data-part': 'root',
          dir: self.props.dir,
          id: self.rootId,
          'data-orientation': self.props.orientation,
        }
      },
      getItemProps(props: AccordionItemProps) {
        const itemState = getItemState(props)
        return {
          'data-scope': 'accordion',
          'data-part': 'item',
          dir: self.props.dir,
          id: self.itemId(props.value),
          'data-state': itemState.expanded ? 'open' : 'closed',
          'data-focus': dataAttr(itemState.focused),
          'data-disabled': dataAttr(itemState.disabled),
          'data-orientation': self.props.orientation,
        }
      },
      getItemContentProps(props: AccordionItemProps) {
        const itemState = getItemState(props)
        return {
          'data-scope': 'accordion',
          'data-part': 'item-content',
          dir: self.props.dir,
          role: 'region',
          id: self.contentId(props.value),
          'aria-labelledby': self.triggerId(props.value),
          hidden: !itemState.expanded,
          'data-state': itemState.expanded ? 'open' : 'closed',
          'data-disabled': dataAttr(itemState.disabled),
          'data-focus': dataAttr(itemState.focused),
          'data-orientation': self.props.orientation,
        }
      },
      getItemIndicatorProps(props: AccordionItemProps) {
        const itemState = getItemState(props)
        return {
          'data-scope': 'accordion',
          'data-part': 'item-indicator',
          dir: self.props.dir,
          'aria-hidden': true,
          'data-state': itemState.expanded ? 'open' : 'closed',
          'data-disabled': dataAttr(itemState.disabled),
          'data-focus': dataAttr(itemState.focused),
          'data-orientation': self.props.orientation,
        }
      },
      getItemTriggerProps(props: AccordionItemProps) {
        const { value } = props
        const itemState = getItemState(props)
        return {
          'data-scope': 'accordion',
          'data-part': 'item-trigger',
          type: 'button',
          dir: self.props.dir,
          id: self.triggerId(value),
          'aria-controls': self.contentId(value),
          'data-controls': self.contentId(value),
          'aria-expanded': itemState.expanded,
          disabled: itemState.disabled,
          'data-orientation': self.props.orientation,
          'data-state': itemState.expanded ? 'open' : 'closed',
          'data-focus': dataAttr(itemState.focused),
          'data-ownedby': self.rootId,
          onfocusin() {
            if (itemState.disabled) return
            self.state = 'focused'
            self.setFocusedValue(value)
          },
          onfocusout() {
            if (itemState.disabled) return
            self.state = 'idle'
            self.setFocusedValue(null)
          },
          onclick(event: MouseEvent) {
            if (itemState.disabled) return
            if (isSafari()) (event.currentTarget as HTMLElement | null)?.focus()
            self.toggle(value)
          },
          onkeydown(event: KeyboardEvent) {
            if (event.defaultPrevented) return
            if (itemState.disabled) return
            const isHorizontal = self.props.orientation === 'horizontal'
            const keyMap: Record<string, () => void> = {
              ArrowDown() {
                if (isHorizontal) return
                self.focusSibling(1)
              },
              ArrowUp() {
                if (isHorizontal) return
                self.focusSibling(-1)
              },
              ArrowRight() {
                if (!isHorizontal) return
                self.focusSibling(1)
              },
              ArrowLeft() {
                if (!isHorizontal) return
                self.focusSibling(-1)
              },
              Home() {
                if (self.state !== 'focused') return
                self.getTriggerEls()[0]?.focus()
              },
              End() {
                if (self.state !== 'focused') return
                self.getTriggerEls().at(-1)?.focus()
              },
            }
            const key = getEventKey(event, {
              dir: self.props.dir,
              orientation: self.props.orientation,
            })
            const exec = keyMap[key]
            if (exec) {
              exec()
              event.preventDefault()
            }
          },
        }
      },
    }
  }
}

export const createNativeAccordionBehavior = (): NativeAccordionBehavior =>
  new NativeAccordionBehavior()
