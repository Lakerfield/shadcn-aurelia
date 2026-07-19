/**
 * Dual-engine toggle-group suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine. Parts are wired exactly the way
 * the registry component does it: `bindPart` applying the prop bags.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createToggleGroupBehavior,
  createZagToggleGroupBehavior,
  type ToggleGroupBehavior,
  type ToggleGroupProps,
} from '../src/behaviors'

const engines = [
  ['native', createToggleGroupBehavior],
  ['zag', createZagToggleGroupBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: ToggleGroupBehavior
  root: HTMLDivElement
  items: Record<string, HTMLButtonElement>
  valueChanges: string[][]
  dispose: () => void
}

function mount(
  create: () => ToggleGroupBehavior,
  props: Partial<ToggleGroupProps> = {},
  values: string[] = ['a', 'b', 'c'],
  disabledValues: string[] = [],
): Mounted {
  const behavior = create()
  const root = document.createElement('div')
  document.body.append(root)
  const items: Record<string, HTMLButtonElement> = {}
  for (const value of values) {
    items[value] = document.createElement('button')
    root.append(items[value])
  }

  const valueChanges: string[][] = []
  behavior.init({
    id: `tg-${++seq}`,
    dir: 'ltr',
    onValueChange: (d: { value: string[] }) => valueChanges.push(d.value),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    ...values.map((value) =>
      bindPart(behavior, items[value], (api) =>
        api.getItemProps({ value, disabled: disabledValues.includes(value) || undefined }),
      ),
    ),
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

/** A real click focuses the button first (focusin), then fires click. */
const clickItem = (el: HTMLElement) => {
  el.focus()
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}
const keydown = (el: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
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

describe.each(engines)('toggle-group engine: %s', (_name, create) => {
  it('single mode renders radio semantics with roving tabindex', async () => {
    const t = track(mount(create))
    await flush()
    expect(t.root.getAttribute('role')).toBe('radiogroup')
    expect(t.root.getAttribute('tabindex')).toBe('0')
    for (const item of Object.values(t.items)) {
      expect(item.getAttribute('role')).toBe('radio')
      expect(item.getAttribute('aria-checked')).toBe('false')
      expect(item.hasAttribute('aria-pressed')).toBe(false)
      expect(item.getAttribute('data-state')).toBe('off')
      expect(item.getAttribute('tabindex')).toBe('-1')
    }
  })

  it('multiple mode renders group semantics with aria-pressed', async () => {
    const t = track(mount(create, { multiple: true }))
    await flush()
    expect(t.root.getAttribute('role')).toBe('group')
    for (const item of Object.values(t.items)) {
      expect(item.hasAttribute('aria-checked')).toBe(false)
      expect(item.getAttribute('aria-pressed')).toBe('false')
    }
  })

  it('single mode: clicking selects one, reclicking deselects (deselectable)', async () => {
    const t = track(mount(create))
    await flush()
    clickItem(t.items.b)
    await flush()
    expect(t.items.b.getAttribute('data-state')).toBe('on')
    expect(t.items.b.getAttribute('aria-checked')).toBe('true')
    expect(t.valueChanges).toEqual([['b']])

    clickItem(t.items.a)
    await flush()
    expect(t.items.b.getAttribute('data-state')).toBe('off')
    expect(t.items.a.getAttribute('data-state')).toBe('on')

    clickItem(t.items.a)
    await flush()
    expect(t.items.a.getAttribute('data-state')).toBe('off')
    expect(t.valueChanges).toEqual([['b'], ['a'], []])
  })

  it('multiple mode: items toggle independently', async () => {
    const t = track(mount(create, { multiple: true }))
    await flush()
    clickItem(t.items.a)
    clickItem(t.items.b)
    await flush()
    expect(t.items.a.getAttribute('aria-pressed')).toBe('true')
    expect(t.items.b.getAttribute('aria-pressed')).toBe('true')
    clickItem(t.items.a)
    await flush()
    expect(t.items.a.getAttribute('aria-pressed')).toBe('false')
    expect(t.valueChanges).toEqual([['a'], ['a', 'b'], ['b']])
  })

  it('defaultValue starts pressed without firing the callback', async () => {
    const t = track(mount(create, { defaultValue: ['c'] }))
    await flush()
    expect(t.items.c.getAttribute('data-state')).toBe('on')
    expect(t.valueChanges).toEqual([])
  })

  it('the focused item becomes the tab stop (data-focus + tabindex 0)', async () => {
    const t = track(mount(create))
    await flush()
    t.items.b.focus()
    await flush()
    expect(t.items.b.getAttribute('data-focus')).toBe('')
    expect(t.items.b.getAttribute('tabindex')).toBe('0')
    expect(t.items.a.getAttribute('tabindex')).toBe('-1')
    expect(t.root.getAttribute('data-focus')).toBe('')
  })

  it('arrows move focus across items and wrap; Home/End jump', async () => {
    const t = track(mount(create))
    await flush()
    t.items.a.focus()
    keydown(t.items.a, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.items.b)

    keydown(t.items.b, 'ArrowLeft')
    await flush()
    expect(document.activeElement).toBe(t.items.a)

    keydown(t.items.a, 'ArrowLeft')
    await flush()
    expect(document.activeElement).toBe(t.items.c)

    keydown(t.items.c, 'Home')
    await flush()
    expect(document.activeElement).toBe(t.items.a)
    keydown(t.items.a, 'End')
    await flush()
    expect(document.activeElement).toBe(t.items.c)
  })

  it('vertical orientation navigates with up/down instead', async () => {
    const t = track(mount(create, { orientation: 'vertical' }))
    await flush()
    t.items.a.focus()
    keydown(t.items.a, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.items.a)
    keydown(t.items.a, 'ArrowDown')
    await flush()
    expect(document.activeElement).toBe(t.items.b)
  })

  it('disabled items are skipped by arrow navigation', async () => {
    const t = track(mount(create, {}, ['a', 'b', 'c'], ['b']))
    await flush()
    expect(t.items.b.hasAttribute('disabled')).toBe(true)
    t.items.a.focus()
    keydown(t.items.a, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.items.c)
  })

  it('focusing the root itself forwards focus to the first toggle', async () => {
    const t = track(mount(create))
    await flush()
    t.root.dispatchEvent(new FocusEvent('focusin', { bubbles: false }))
    await flush()
    expect(document.activeElement).toBe(t.items.a)
  })

  it('Tab from a non-first item drops the root tab stop until the next focus cycle', async () => {
    const t = track(mount(create))
    await flush()
    t.items.b.focus()
    await flush()
    keydown(t.items.b, 'Tab', { shiftKey: true })
    await flush()
    expect(t.root.getAttribute('tabindex')).toBe('-1')
    // Zag clears isTabbingBackward only via ROOT.BLUR from the focused state:
    // a fresh item focus re-enters `focused`, leaving again restores the stop
    t.items.a.focus()
    await flush()
    t.items.a.blur()
    t.root.dispatchEvent(new FocusEvent('focusout', { bubbles: false }))
    await flush()
    expect(t.root.getAttribute('tabindex')).toBe('0')
  })

  it('setValue drives the pressed items programmatically', async () => {
    const t = track(mount(create, { multiple: true }))
    await flush()
    t.behavior.api!.setValue(['a', 'c'])
    await flush()
    expect(t.items.a.getAttribute('data-state')).toBe('on')
    expect(t.items.c.getAttribute('data-state')).toBe('on')
    expect(t.valueChanges).toEqual([['a', 'c']])
  })
})

describe('zag ↔ native toggle-group attribute contract', () => {
  const attrsOf = (el: Element): Record<string, string> =>
    Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

  async function snapshot(create: () => ToggleGroupBehavior) {
    const t = mount(create, { id: 'contract' })
    await vi.advanceTimersByTimeAsync(50)
    const snap = () => ({
      root: attrsOf(t.root),
      itemA: attrsOf(t.items.a),
      itemB: attrsOf(t.items.b),
    })
    const initial = snap()
    clickItem(t.items.b)
    await vi.advanceTimersByTimeAsync(50)
    const selectedB = snap()
    t.items.b.blur()
    t.root.dispatchEvent(new FocusEvent('focusout', { bubbles: false }))
    await vi.advanceTimersByTimeAsync(50)
    const blurred = snap()
    t.dispose()
    await vi.runAllTimersAsync()
    return { initial, selectedB, blurred }
  }

  it('emits identical attributes in initial, selected and blurred states', async () => {
    // sequential mounts — same `id`, so the DOM ids collide if simultaneous
    const zag = await snapshot(createZagToggleGroupBehavior)
    const native = await snapshot(createToggleGroupBehavior)
    expect(native.initial).toEqual(zag.initial)
    expect(native.selectedB).toEqual(zag.selectedB)
    expect(native.blurred).toEqual(zag.blurred)
  })
})
