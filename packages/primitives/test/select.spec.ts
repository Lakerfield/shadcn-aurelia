/**
 * Dual-engine select suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: trigger button in the page, the
 * positioner > content > item* subtree portaled to <body>, the item list in
 * a `createListCollection`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createListCollection,
  createSelectBehavior,
  createZagSelectBehavior,
  type SelectBehavior,
  type SelectProps,
} from '../src/behaviors'

const engines = [
  ['native', createSelectBehavior],
  ['zag', createZagSelectBehavior],
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
  { value: 'cherry', label: 'Cherry', disabled: true },
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
  behavior: SelectBehavior
  trigger: HTMLButtonElement
  positioner: HTMLDivElement
  content: HTMLDivElement
  items: Map<string, HTMLDivElement>
  indicators: Map<string, HTMLSpanElement>
  group: HTMLDivElement
  valueChanges: string[][]
  openChanges: boolean[]
  highlightChanges: Array<string | null>
  dispose: () => void
}

function mount(create: () => SelectBehavior, props: Partial<SelectProps> = {}): Mounted {
  const behavior = create()
  const trigger = document.createElement('button')
  const positioner = document.createElement('div')
  const content = document.createElement('div')
  const group = document.createElement('div')
  positioner.append(content)
  content.append(group)
  document.body.append(trigger, positioner)

  const valueChanges: string[][] = []
  const openChanges: boolean[] = []
  const highlightChanges: Array<string | null> = []
  behavior.init({
    id: `sel-${++seq}`,
    dir: 'ltr',
    collection: buildCollection(),
    onValueChange: (d) => valueChanges.push(d.value),
    onOpenChange: (d) => openChanges.push(d.open),
    onHighlightChange: (d) => highlightChanges.push(d.highlightedValue),
    ...props,
  })
  behavior.start()

  const items = new Map<string, HTMLDivElement>()
  const indicators = new Map<string, HTMLSpanElement>()
  const disposers = [
    bindPart(behavior, trigger, (api) => api.getTriggerProps()),
    bindPart(behavior, positioner, (api) => api.getPositionerProps()),
    bindPart(behavior, content, (api) => api.getContentProps()),
    bindPart(behavior, group, (api) => api.getItemGroupProps({ id: 'fruits' })),
  ]
  for (const item of ITEMS) {
    const el = document.createElement('div')
    const indicator = document.createElement('span')
    el.append(indicator)
    group.append(el)
    items.set(item.value, el)
    indicators.set(item.value, indicator)
    disposers.push(
      bindPart(behavior, el, (api) => api.getItemProps({ item })),
      bindPart(behavior, indicator, (api) => api.getItemIndicatorProps({ item })),
    )
  }

  return {
    behavior,
    trigger,
    positioner,
    content,
    items,
    indicators,
    group,
    valueChanges,
    openChanges,
    highlightChanges,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      trigger.remove()
      positioner.remove()
    },
  }
}

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
const keydown = (el: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
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

describe.each(engines)('select engine: %s', (_name, create) => {
  it('starts closed with the trigger fully wired', async () => {
    const t = track(mount(create))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.trigger.getAttribute('role')).toBe('combobox')
    expect(t.trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(t.trigger.getAttribute('aria-expanded')).toBe('false')
    expect(t.trigger.getAttribute('aria-controls')).toBe(t.content.id)
    expect(t.trigger.getAttribute('data-state')).toBe('closed')
    expect(t.trigger.hasAttribute('data-placeholder-shown')).toBe(true)
    expect(t.content.getAttribute('role')).toBe('listbox')
    expect(t.group.getAttribute('role')).toBe('group')
  })

  it('trigger click opens without a highlight when nothing is selected', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('true')
    expect(t.content.hasAttribute('aria-activedescendant')).toBe(false)
    // jsdom has no layout, so the initial focus lands on the content itself
    expect(document.activeElement).toBe(t.content)
    expect(t.openChanges).toEqual([true])
  })

  it('trigger click highlights the first selected item', async () => {
    const t = track(mount(create, { defaultValue: ['banana'] }))
    await settle()
    expect(t.trigger.hasAttribute('data-placeholder-shown')).toBe(false)
    expect(t.behavior.api!.valueAsString).toBe('Banana')
    click(t.trigger)
    await settle()
    expect(t.items.get('banana')!.hasAttribute('data-highlighted')).toBe(true)
    expect(t.content.getAttribute('aria-activedescendant')).toBe(t.items.get('banana')!.id)
    expect(t.items.get('banana')!.getAttribute('aria-selected')).toBe('true')
    expect(t.items.get('banana')!.getAttribute('data-state')).toBe('checked')
    expect(t.indicators.get('banana')!.hidden).toBe(false)
    expect(t.indicators.get('apple')!.hidden).toBe(true)
  })

  it('ArrowDown on the focused trigger opens and highlights the first item', async () => {
    const t = track(mount(create))
    await settle()
    t.trigger.focus()
    await settle()
    keydown(t.trigger, 'ArrowDown')
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.items.get('apple')!.hasAttribute('data-highlighted')).toBe(true)
    expect(t.highlightChanges).toEqual(['apple'])
  })

  it('ArrowUp on the focused trigger opens and highlights the last item', async () => {
    const t = track(mount(create))
    await settle()
    t.trigger.focus()
    await settle()
    keydown(t.trigger, 'ArrowUp')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
  })

  it('arrows move the highlight in the open content, skipping disabled items', async () => {
    const t = track(mount(create))
    await settle()
    t.trigger.focus()
    await settle()
    keydown(t.trigger, 'ArrowDown')
    await settle()
    keydown(t.content, 'ArrowDown')
    await settle()
    expect(t.items.get('banana')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.content, 'ArrowDown')
    await settle()
    keydown(t.content, 'ArrowDown')
    await settle()
    // cherry is disabled — the highlight jumps from blueberry to date
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.content, 'Home')
    await settle()
    expect(t.items.get('apple')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.content, 'End')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
    // no loop by default: ArrowDown at the end stays put
    keydown(t.content, 'ArrowDown')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
  })

  it('Enter selects the highlighted item, closes and refocuses the trigger', async () => {
    const t = track(mount(create))
    await settle()
    t.trigger.focus()
    await settle()
    keydown(t.trigger, 'ArrowDown')
    await settle()
    keydown(t.content, 'ArrowDown')
    await settle()
    keydown(t.content, 'Enter')
    await settle()
    expect(t.valueChanges).toEqual([['banana']])
    expect(t.behavior.api!.value).toEqual(['banana'])
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false])
    expect(document.activeElement).toBe(t.trigger)
  })

  it('item click selects and closes', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    click(t.items.get('blueberry')!)
    await settle()
    expect(t.valueChanges).toEqual([['blueberry']])
    expect(t.content.hidden).toBe(true)
    expect(t.behavior.api!.valueAsString).toBe('Blueberry')
  })

  it('Escape closes and returns focus to the trigger', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    pressEscape()
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false])
    expect(document.activeElement).toBe(t.trigger)
  })

  it('outside press closes; focus only returns for non-focusable targets', async () => {
    const plain = document.createElement('div')
    const focusable = document.createElement('button')
    document.body.append(plain, focusable)
    const t = track(mount(create))
    await settle()

    click(t.trigger)
    await settle()
    plain.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(document.activeElement).toBe(t.trigger)

    click(t.trigger)
    await settle()
    focusable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(t.content.hidden).toBe(true)
    // jsdom fails Zag's focusable-visibility check (offsetParent is always
    // null), so the Zag engine restores focus anyway; real browsers don't —
    // covered by the browser pass
    if (_name === 'native') expect(document.activeElement).not.toBe(t.trigger)

    plain.remove()
    focusable.remove()
  })

  it('ArrowRight/ArrowLeft on the closed trigger step the selection', async () => {
    const t = track(mount(create, { defaultValue: ['apple'] }))
    await settle()
    t.trigger.focus()
    await settle()
    keydown(t.trigger, 'ArrowRight')
    await settle()
    expect(t.behavior.api!.value).toEqual(['banana'])
    keydown(t.trigger, 'ArrowLeft')
    await settle()
    expect(t.behavior.api!.value).toEqual(['apple'])
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([])
  })

  it('Home/End on the closed trigger select the first/last item', async () => {
    const t = track(mount(create))
    await settle()
    t.trigger.focus()
    await settle()
    keydown(t.trigger, 'End')
    await settle()
    expect(t.behavior.api!.value).toEqual(['date'])
    keydown(t.trigger, 'Home')
    await settle()
    expect(t.behavior.api!.value).toEqual(['apple'])
  })

  it('typeahead on the closed trigger selects matches, cycling on repeats', async () => {
    const t = track(mount(create))
    await settle()
    t.trigger.focus()
    await settle()
    keydown(t.trigger, 'b')
    await settle()
    expect(t.behavior.api!.value).toEqual(['banana'])
    keydown(t.trigger, 'b')
    await settle()
    expect(t.behavior.api!.value).toEqual(['blueberry'])
    // let the typeahead buffer expire, then match a different prefix
    await vi.advanceTimersByTimeAsync(400)
    keydown(t.trigger, 'd')
    await settle()
    expect(t.behavior.api!.value).toEqual(['date'])
  })

  it('typeahead in the open content highlights without selecting', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    keydown(t.content, 'd')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
    expect(t.valueChanges).toEqual([])
  })

  it('setValue/clearValue drive the selection programmatically', async () => {
    const t = track(mount(create))
    await settle()
    t.behavior.api!.setValue(['banana'])
    await settle()
    expect(t.valueChanges).toEqual([['banana']])
    expect(t.behavior.api!.hasSelectedItems).toBe(true)
    t.behavior.api!.clearValue()
    await settle()
    expect(t.valueChanges).toEqual([['banana'], []])
    expect(t.behavior.api!.empty).toBe(true)
  })

  it('setOpen drives the same transitions as clicking', async () => {
    const t = track(mount(create))
    await settle()
    t.behavior.api!.setOpen(true)
    await settle()
    expect(t.content.hidden).toBe(false)
    // programmatic open does not highlight
    expect(t.content.hasAttribute('aria-activedescendant')).toBe(false)
    t.behavior.api!.setOpen(false)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false])
  })

  it('loopFocus wraps the highlight at both ends', async () => {
    const t = track(mount(create, { loopFocus: true }))
    await settle()
    t.trigger.focus()
    await settle()
    keydown(t.trigger, 'ArrowUp')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.content, 'ArrowDown')
    await settle()
    expect(t.items.get('apple')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.content, 'ArrowUp')
    await settle()
    expect(t.items.get('date')!.hasAttribute('data-highlighted')).toBe(true)
  })
})

describe('zag ↔ native select attribute contract', () => {
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

  async function snapshot(create: () => SelectBehavior) {
    const t = mount(create, { id: 'contract' })
    await vi.advanceTimersByTimeAsync(50)
    const partsOf = () => ({
      trigger: attrsOf(t.trigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
      group: attrsOf(t.group),
      itemApple: attrsOf(t.items.get('apple')!),
      itemCherry: attrsOf(t.items.get('cherry')!),
      indicatorApple: attrsOf(t.indicators.get('apple')!),
    })
    const closed = partsOf()
    t.trigger.focus()
    t.trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(50)
    t.content.dispatchEvent(
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
    const zag = await snapshot(createZagSelectBehavior)
    const native = await snapshot(createSelectBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.open).toEqual(zag.open)
    expect(native.selected).toEqual(zag.selected)
  })
})
