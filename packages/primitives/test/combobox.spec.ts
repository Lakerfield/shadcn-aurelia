/**
 * Dual-engine combobox suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired the way the
 * registry components do it: control > input (+ trigger) in the page, the
 * positioner > content > item* subtree portaled to <body>. The command
 * palette mode (controlled `open: true` + `disableLayer` + autohighlight +
 * clear-on-select) gets its own tests including the registry-style filter
 * wiring through `updateProps({ collection })`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createComboboxBehavior,
  createListCollection,
  createZagComboboxBehavior,
  type ComboboxBehavior,
  type ComboboxProps,
} from '../src/behaviors'

const engines = [
  ['native', createComboboxBehavior],
  ['zag', createZagComboboxBehavior],
] as const

interface Item {
  value: string
  label: string
  disabled?: boolean
}

const ITEMS: Item[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'blueberry', label: 'Blueberry' },
  { value: 'date', label: 'Date' },
]

const buildCollection = (items: Item[] = ITEMS) =>
  createListCollection({
    items,
    itemToValue: (item) => item.value,
    itemToString: (item) => item.label,
    isItemDisabled: (item) => !!item.disabled,
  })

let seq = 0

interface Mounted {
  behavior: ComboboxBehavior
  control: HTMLDivElement
  input: HTMLInputElement
  trigger: HTMLButtonElement
  positioner: HTMLDivElement
  content: HTMLDivElement
  items: Map<string, HTMLDivElement>
  indicators: Map<string, HTMLSpanElement>
  valueChanges: string[][]
  inputChanges: Array<{ inputValue: string; reason: string | undefined }>
  openChanges: boolean[]
  dispose: () => void
}

function mount(create: () => ComboboxBehavior, props: Partial<ComboboxProps> = {}): Mounted {
  const behavior = create()
  const control = document.createElement('div')
  const input = document.createElement('input')
  const trigger = document.createElement('button')
  const positioner = document.createElement('div')
  const content = document.createElement('div')
  control.append(input, trigger)
  positioner.append(content)
  document.body.append(control, positioner)

  const valueChanges: string[][] = []
  const inputChanges: Array<{ inputValue: string; reason: string | undefined }> = []
  const openChanges: boolean[] = []
  behavior.init({
    id: `cbx-${++seq}`,
    dir: 'ltr',
    collection: buildCollection(),
    onValueChange: (d) => valueChanges.push(d.value),
    onInputValueChange: (d) => inputChanges.push({ inputValue: d.inputValue, reason: d.reason }),
    onOpenChange: (d) => openChanges.push(d.open),
    ...props,
  })
  behavior.start()

  const items = new Map<string, HTMLDivElement>()
  const indicators = new Map<string, HTMLSpanElement>()
  const disposers = [
    bindPart(behavior, control, (api) => api.getControlProps()),
    bindPart(behavior, input, (api) => api.getInputProps()),
    bindPart(behavior, trigger, (api) => api.getTriggerProps()),
    bindPart(behavior, positioner, (api) => api.getPositionerProps()),
    bindPart(behavior, content, (api) => api.getContentProps()),
  ]
  for (const item of ITEMS) {
    const el = document.createElement('div')
    const indicator = document.createElement('span')
    el.append(indicator)
    content.append(el)
    items.set(item.value, el)
    indicators.set(item.value, indicator)
    disposers.push(
      bindPart(behavior, el, (api) => api.getItemProps({ item })),
      bindPart(behavior, indicator, (api) => api.getItemIndicatorProps({ item })),
    )
  }

  return {
    behavior,
    control,
    input,
    trigger,
    positioner,
    content,
    items,
    indicators,
    valueChanges,
    inputChanges,
    openChanges,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      control.remove()
      positioner.remove()
    },
  }
}

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
const keydown = (el: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
const type = (input: HTMLInputElement, text: string) => {
  input.value = text
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
// cancelable, like a real browser keydown — Zag's layer preventDefaults the
// escape so it doesn't fall through to the interact-outside dismiss
const pressEscape = () =>
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  )
/** Flush microtasks, rafs and the Zag dismissable-layer attach delay. */
const settle = () => vi.advanceTimersByTimeAsync(50)

const mounted: Mounted[] = []
const track = (m: Mounted) => (mounted.push(m), m)

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ],
  })
})

afterEach(async () => {
  mounted.splice(0).forEach((m) => m.dispose())
  await vi.runAllTimersAsync()
  vi.useRealTimers()
})

describe.each(engines)('combobox engine: %s', (_name, create) => {
  it('starts closed with the input fully wired', async () => {
    const t = track(mount(create, { placeholder: 'Search…' }))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.input.getAttribute('role')).toBe('combobox')
    expect(t.input.getAttribute('aria-expanded')).toBe('false')
    expect(t.input.getAttribute('aria-autocomplete')).toBe('list')
    expect(t.input.getAttribute('aria-controls')).toBe(t.content.id)
    expect(t.input.getAttribute('autocomplete')).toBe('off')
    expect(t.input.getAttribute('spellcheck')).toBe('false')
    expect(t.input.getAttribute('placeholder')).toBe('Search…')
    expect(t.trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(t.trigger.getAttribute('tabindex')).toBe('-1')
    expect(t.content.getAttribute('role')).toBe('listbox')
  })

  it('typing opens the listbox and reports input-change', async () => {
    const t = track(mount(create))
    await settle()
    t.input.focus()
    await settle()
    type(t.input, 'ba')
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.input.getAttribute('aria-expanded')).toBe('true')
    expect(t.control.getAttribute('data-state')).toBe('open')
    expect(t.inputChanges).toEqual([{ inputValue: 'ba', reason: 'input-change' }])
    expect(t.openChanges).toEqual([true])
    // inputBehavior 'none': typing does not auto-highlight
    expect(t.input.hasAttribute('aria-activedescendant')).toBe(false)
  })

  it('ArrowDown on the focused input opens and highlights the first item', async () => {
    const t = track(mount(create))
    await settle()
    t.input.focus()
    await settle()
    keydown(t.input, 'ArrowDown')
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.items.get('apple')!.hasAttribute('data-highlighted')).toBe(true)
    expect(t.input.getAttribute('aria-activedescendant')).toBe(t.items.get('apple')!.id)
  })

  it('arrows navigate with loopFocus wrapping by default', async () => {
    const t = track(mount(create))
    await settle()
    t.input.focus()
    await settle()
    keydown(t.input, 'ArrowUp')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.input, 'ArrowDown')
    await settle()
    expect(t.items.get('apple')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.input, 'ArrowUp')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.input, 'End')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.input, 'Home')
    await settle()
    expect(t.items.get('apple')!.hasAttribute('data-highlighted')).toBe(true)
  })

  it('Enter selects the highlighted item, fills the input and closes', async () => {
    const t = track(mount(create))
    await settle()
    t.input.focus()
    await settle()
    keydown(t.input, 'ArrowDown')
    await settle()
    keydown(t.input, 'ArrowDown')
    await settle()
    keydown(t.input, 'Enter')
    await settle()
    expect(t.valueChanges).toEqual([['banana']])
    expect(t.behavior.api!.inputValue).toBe('Banana')
    expect(t.input.value).toBe('Banana')
    expect(t.content.hidden).toBe(true)
    expect(t.inputChanges.at(-1)).toEqual({ inputValue: 'Banana', reason: 'item-select' })
    expect(t.items.get('banana')!.getAttribute('data-state')).toBe('checked')
    expect(t.items.get('banana')!.getAttribute('aria-selected')).toBe('true')
    expect(t.indicators.get('banana')!.hidden).toBe(false)
  })

  it('item click selects and closes, keeping focus in the input', async () => {
    const t = track(mount(create))
    await settle()
    t.input.focus()
    await settle()
    keydown(t.input, 'ArrowDown')
    await settle()
    click(t.items.get('blueberry')!)
    await settle()
    expect(t.valueChanges).toEqual([['blueberry']])
    expect(t.input.value).toBe('Blueberry')
    expect(t.content.hidden).toBe(true)
    expect(document.activeElement).toBe(t.input)
  })

  it('trigger click toggles the listbox', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.openChanges).toEqual([true])
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false])
  })

  it('openOnClick opens from an input click', async () => {
    const t = track(mount(create, { openOnClick: true }))
    await settle()
    t.input.focus()
    await settle()
    click(t.input)
    await settle()
    expect(t.content.hidden).toBe(false)
  })

  it('Escape closes; a second Escape reverts a custom input value', async () => {
    const t = track(mount(create))
    await settle()
    t.input.focus()
    await settle()
    type(t.input, 'xyz')
    await settle()
    pressEscape()
    await settle()
    expect(t.content.hidden).toBe(true)
    // open-state Escape closes without touching the input value
    expect(t.behavior.api!.inputValue).toBe('xyz')
    keydown(t.input, 'Escape')
    await settle()
    expect(t.behavior.api!.inputValue).toBe('')
    expect(t.input.value).toBe('')
  })

  it('outside press closes and reverts a custom value to the selection', async () => {
    const outside = document.createElement('div')
    document.body.append(outside)
    const t = track(mount(create, { defaultValue: ['banana'] }))
    await settle()
    expect(t.behavior.api!.inputValue).toBe('Banana')
    t.input.focus()
    await settle()
    type(t.input, 'blue')
    await settle()
    outside.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.behavior.api!.inputValue).toBe('Banana')
    expect(t.input.value).toBe('Banana')
    expect(t.inputChanges.at(-1)).toEqual({ inputValue: 'Banana', reason: 'interact-outside' })
    outside.remove()
  })

  it('Enter with a custom value and no highlight reverts and closes', async () => {
    const t = track(mount(create))
    await settle()
    t.input.focus()
    await settle()
    type(t.input, 'nonsense')
    await settle()
    keydown(t.input, 'Enter')
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.behavior.api!.inputValue).toBe('')
    expect(t.valueChanges).toEqual([])
  })

  it('registry-style filtering narrows the collection through updateProps', async () => {
    const t = track(mount(create))
    // wire the registry filter loop: typing → filter → updateProps
    const applyFilter = (query: string) => {
      const q = query.trim().toLowerCase()
      const next = q === '' ? ITEMS : ITEMS.filter((i) => i.label.toLowerCase().includes(q))
      t.behavior.updateProps({ collection: buildCollection(next) })
      t.behavior.notify()
    }
    const unsub = t.behavior.subscribe(() => {})
    await settle()
    t.input.focus()
    await settle()
    type(t.input, 'blue')
    applyFilter('blue')
    await settle()
    expect(t.behavior.api!.collection.size).toBe(1)
    expect(t.content.hasAttribute('data-empty')).toBe(false)
    // ArrowDown highlights the only match
    keydown(t.input, 'ArrowDown')
    await settle()
    expect(t.items.get('blueberry')!.hasAttribute('data-highlighted')).toBe(true)
    // filtering everything out flags the content empty and drops the highlight
    type(t.input, 'bluex')
    applyFilter('bluex')
    await settle()
    expect(t.behavior.api!.collection.size).toBe(0)
    expect(t.content.hasAttribute('data-empty')).toBe(true)
    expect(t.behavior.api!.highlightedValue).toBe(null)
    unsub()
  })

  it('setValue/setInputValue drive the state programmatically', async () => {
    const t = track(mount(create))
    await settle()
    t.behavior.api!.setValue(['apple'])
    await settle()
    expect(t.valueChanges).toEqual([['apple']])
    expect(t.behavior.api!.inputValue).toBe('Apple')
    expect(t.behavior.api!.valueAsString).toBe('Apple')
    t.behavior.api!.setInputValue('hello', 'script')
    await settle()
    expect(t.behavior.api!.inputValue).toBe('hello')
    expect(t.inputChanges.at(-1)).toEqual({ inputValue: 'hello', reason: 'script' })
  })
})

describe.each(engines)('command palette mode: %s', (_name, create) => {
  const commandProps: Partial<ComboboxProps> = {
    open: true,
    disableLayer: true,
    inputBehavior: 'autohighlight',
    selectionBehavior: 'clear',
  }

  it('starts open without an onOpenChange echo', async () => {
    const t = track(mount(create, commandProps))
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.input.getAttribute('aria-expanded')).toBe('true')
    expect(t.openChanges).toEqual([])
  })

  it('typing filters and auto-highlights the first match', async () => {
    const t = track(mount(create, commandProps))
    const applyFilter = (query: string) => {
      const q = query.trim().toLowerCase()
      const next = q === '' ? ITEMS : ITEMS.filter((i) => i.label.toLowerCase().includes(q))
      t.behavior.updateProps({ collection: buildCollection(next) })
      t.behavior.notify()
    }
    await settle()
    t.input.focus()
    await settle()
    type(t.input, 'b')
    applyFilter('b')
    await settle()
    expect(t.items.get('banana')!.hasAttribute('data-highlighted')).toBe(true)
    type(t.input, 'blue')
    applyFilter('blue')
    await settle()
    expect(t.items.get('blueberry')!.hasAttribute('data-highlighted')).toBe(true)
  })

  it('Enter selects, clears the input and stays open (controlled)', async () => {
    const t = track(mount(create, commandProps))
    await settle()
    t.input.focus()
    await settle()
    keydown(t.input, 'ArrowDown')
    await settle()
    keydown(t.input, 'Enter')
    await settle()
    expect(t.valueChanges).toEqual([['apple']])
    // selectionBehavior 'clear': the input resets after selecting
    expect(t.behavior.api!.inputValue).toBe('')
    // controlled open: the machine reports the close intent but stays open
    expect(t.content.hidden).toBe(false)
    expect(t.openChanges).toEqual([false])
  })

  it('item click dispatches the selection and stays open', async () => {
    const t = track(mount(create, commandProps))
    await settle()
    click(t.items.get('date')!)
    await settle()
    expect(t.valueChanges).toEqual([['date']])
    expect(t.content.hidden).toBe(false)
  })
})

describe('zag ↔ native combobox attribute contract', () => {
  /** Zag's layer stack writes internal style metadata — parse + strip. */
  const INTERNAL_STYLE_PROPS = new Set([
    '--layer-index',
    '--nested-layer-count',
    '--z-index',
    'pointer-events',
  ])

  const attrsOf = (el: Element): Record<string, unknown> => {
    const attrs: Record<string, unknown> = Object.fromEntries(
      [...el.attributes].filter((a) => a.name !== 'style').map((a) => [a.name, a.value]),
    )
    const style: Record<string, string> = {}
    const cssStyle = (el as HTMLElement).style
    for (let i = 0; i < cssStyle.length; i++) {
      const prop = cssStyle.item(i)
      if (INTERNAL_STYLE_PROPS.has(prop)) continue
      style[prop] = cssStyle.getPropertyValue(prop)
    }
    attrs.style = style
    return attrs
  }

  async function snapshot(create: () => ComboboxBehavior) {
    const t = mount(create, { id: 'contract', placeholder: 'Search…' })
    await vi.advanceTimersByTimeAsync(50)
    const partsOf = () => ({
      control: attrsOf(t.control),
      input: attrsOf(t.input),
      trigger: attrsOf(t.trigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
      itemApple: attrsOf(t.items.get('apple')!),
      indicatorApple: attrsOf(t.indicators.get('apple')!),
    })
    const closed = partsOf()
    t.input.focus()
    await vi.advanceTimersByTimeAsync(50)
    t.input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    )
    await vi.advanceTimersByTimeAsync(50)
    const open = partsOf()
    t.items.get('apple')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(50)
    const selected = partsOf()
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, open, selected }
  }

  it('emits identical attributes and styles in closed, open and selected states', async () => {
    const zag = await snapshot(createZagComboboxBehavior)
    const native = await snapshot(createComboboxBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.open).toEqual(zag.open)
    expect(native.selected).toEqual(zag.selected)
  })
})
