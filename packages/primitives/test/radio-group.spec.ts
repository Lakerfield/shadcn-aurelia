/**
 * Dual-engine radio-group suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine. Parts are wired exactly the way
 * the registry component does it: `bindPart` applying the prop bags.
 * Arrow-key roving between radios is the BROWSER's native behavior for
 * same-name inputs (neither engine implements it), so it isn't tested here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createRadioGroupBehavior,
  createZagRadioGroupBehavior,
  type RadioGroupBehavior,
  type RadioGroupProps,
} from '../src/behaviors'

const engines = [
  ['native', createRadioGroupBehavior],
  ['zag', createZagRadioGroupBehavior],
] as const

let seq = 0

interface Item {
  item: HTMLLabelElement
  input: HTMLInputElement
  control: HTMLSpanElement
}

interface Mounted {
  behavior: RadioGroupBehavior
  root: HTMLDivElement
  items: Record<string, Item>
  valueChanges: Array<string | null>
  dispose: () => void
}

function mount(
  create: () => RadioGroupBehavior,
  props: Partial<RadioGroupProps> = {},
  values: string[] = ['a', 'b', 'c'],
  disabledValues: string[] = [],
): Mounted {
  const behavior = create()
  const root = document.createElement('div')
  document.body.append(root)
  const items: Record<string, Item> = {}
  for (const value of values) {
    const item = document.createElement('label')
    const input = document.createElement('input')
    const control = document.createElement('span')
    item.append(input, control)
    root.append(item)
    items[value] = { item, input, control }
  }

  const valueChanges: Array<string | null> = []
  behavior.init({
    id: `rg-${++seq}`,
    dir: 'ltr',
    onValueChange: (d: { value: string | null }) => valueChanges.push(d.value),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    ...values.flatMap((value) => {
      const itemProps = { value, disabled: disabledValues.includes(value) || undefined }
      return [
        bindPart(behavior, items[value].item, (api) => api.getItemProps(itemProps)),
        bindPart(behavior, items[value].input, (api) => api.getItemHiddenInputProps(itemProps)),
        bindPart(behavior, items[value].control, (api) => api.getItemControlProps(itemProps)),
      ]
    }),
  ]
  return {
    behavior,
    root,
    items,
    valueChanges,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      root.remove()
    },
  }
}

const pressTab = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
const flush = () => vi.advanceTimersByTimeAsync(50)

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

describe.each(engines)('radio-group engine: %s', (_name, create) => {
  it('renders the radiogroup wiring: role, shared input name, labels', async () => {
    const t = track(mount(create))
    await flush()
    expect(t.root.getAttribute('role')).toBe('radiogroup')
    expect(t.root.getAttribute('aria-orientation')).toBe('vertical')
    const names = Object.values(t.items).map(({ input }) => input.getAttribute('name'))
    expect(new Set(names).size).toBe(1)
    expect(names[0]).toBeTruthy()
    for (const [value, { item, input }] of Object.entries(t.items)) {
      expect(input.getAttribute('type')).toBe('radio')
      expect(input.getAttribute('value')).toBe(value)
      expect(item.getAttribute('for')).toBe(input.id)
    }
  })

  it('clicking an input selects it and unchecks the rest', async () => {
    const t = track(mount(create))
    await flush()
    t.items.b.input.click()
    await flush()
    expect(t.items.b.control.getAttribute('data-state')).toBe('checked')
    expect(t.items.a.control.getAttribute('data-state')).toBe('unchecked')
    expect(t.valueChanges).toEqual(['b'])

    t.items.c.input.click()
    await flush()
    expect(t.items.b.control.getAttribute('data-state')).toBe('unchecked')
    expect(t.items.c.control.getAttribute('data-state')).toBe('checked')
    expect(t.items.b.input.checked).toBe(false)
    expect(t.items.c.input.checked).toBe(true)
    expect(t.valueChanges).toEqual(['b', 'c'])
  })

  it('defaultValue starts selected without firing the callback', async () => {
    const t = track(mount(create, { defaultValue: 'a' }))
    await flush()
    expect(t.items.a.control.getAttribute('data-state')).toBe('checked')
    expect(t.items.a.input.checked).toBe(true)
    expect(t.valueChanges).toEqual([])
  })

  it('setValue syncs the input properties', async () => {
    const t = track(mount(create))
    await flush()
    t.behavior.api!.setValue('c')
    await flush()
    expect(t.items.c.input.checked).toBe(true)
    expect(t.items.c.control.getAttribute('data-state')).toBe('checked')
    expect(t.valueChanges).toEqual(['c'])
  })

  it('keyboard focus marks data-focus and data-focus-visible on the item parts', async () => {
    const t = track(mount(create))
    await flush()
    pressTab()
    t.items.a.input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await flush()
    expect(t.items.a.control.getAttribute('data-focus')).toBe('')
    expect(t.items.a.control.getAttribute('data-focus-visible')).toBe('')
    expect(t.items.b.control.hasAttribute('data-focus')).toBe(false)
    t.items.a.input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await flush()
    expect(t.items.a.control.hasAttribute('data-focus')).toBe(false)
  })

  it('hovering an item marks data-hover; pressing marks data-active', async () => {
    const t = track(mount(create))
    await flush()
    t.items.a.item.dispatchEvent(new Event('pointermove', { bubbles: true }))
    await flush()
    expect(t.items.a.control.getAttribute('data-hover')).toBe('')
    t.items.a.item.dispatchEvent(new Event('pointerleave'))
    await flush()
    expect(t.items.a.control.hasAttribute('data-hover')).toBe(false)

    t.items.a.item.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0 }),
    )
    await flush()
    expect(t.items.a.control.getAttribute('data-active')).toBe('')
    t.items.a.item.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flush()
    expect(t.items.a.control.hasAttribute('data-active')).toBe(false)
  })

  it('disabled items render a disabled input and data-disabled parts', async () => {
    const t = track(mount(create, {}, ['a', 'b', 'c'], ['b']))
    await flush()
    expect(t.items.b.input.hasAttribute('disabled')).toBe(true)
    expect(t.items.b.control.getAttribute('data-disabled')).toBe('')
    expect(t.items.a.input.hasAttribute('disabled')).toBe(false)
  })

  it('group disabled marks the root and every item', async () => {
    const t = track(mount(create, { disabled: true }))
    await flush()
    expect(t.root.getAttribute('data-disabled')).toBe('')
    expect(t.root.getAttribute('aria-disabled')).toBe('true')
    expect(t.items.a.input.hasAttribute('disabled')).toBe(true)
  })

  it('focus() targets the checked input, falling back to the first enabled', async () => {
    const t = track(mount(create, { defaultValue: 'b' }))
    await flush()
    t.behavior.api!.focus()
    expect(document.activeElement).toBe(t.items.b.input)
  })
})

describe('zag ↔ native radio-group attribute contract', () => {
  const attrsOf = (el: Element): Record<string, string> =>
    Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

  async function snapshot(create: () => RadioGroupBehavior) {
    const t = mount(create, { id: 'contract', defaultValue: 'a' })
    await vi.advanceTimersByTimeAsync(50)
    const snap = () => ({
      root: attrsOf(t.root),
      itemA: attrsOf(t.items.a.item),
      inputA: attrsOf(t.items.a.input),
      controlA: attrsOf(t.items.a.control),
      itemB: attrsOf(t.items.b.item),
      inputB: attrsOf(t.items.b.input),
      controlB: attrsOf(t.items.b.control),
    })
    const initial = snap()
    t.items.b.input.click()
    await vi.advanceTimersByTimeAsync(50)
    const selectedB = snap()
    pressTab()
    t.items.b.input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(50)
    const focused = snap()
    t.items.b.input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(50)
    const blurred = snap()
    t.dispose()
    await vi.runAllTimersAsync()
    return { initial, selectedB, focused, blurred }
  }

  it('emits identical attributes in initial, selected, focused and blurred states', async () => {
    // sequential mounts — same `id`, so the DOM ids collide if simultaneous
    const zag = await snapshot(createZagRadioGroupBehavior)
    const native = await snapshot(createRadioGroupBehavior)
    expect(native.initial).toEqual(zag.initial)
    expect(native.selectedB).toEqual(zag.selectedB)
    expect(native.focused).toEqual(zag.focused)
    expect(native.blurred).toEqual(zag.blurred)
  })
})
