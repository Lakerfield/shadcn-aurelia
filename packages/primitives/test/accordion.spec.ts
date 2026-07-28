/**
 * Dual-engine accordion suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: `bindPart` applying the prop bags.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createAccordionBehavior,
  createZagAccordionBehavior,
  type AccordionBehavior,
  type AccordionProps,
} from '../src/behaviors'

const engines = [
  ['native', createAccordionBehavior],
  ['zag', createZagAccordionBehavior],
] as const

let seq = 0

interface Item {
  item: HTMLDivElement
  trigger: HTMLButtonElement
  content: HTMLDivElement
}

interface Mounted {
  behavior: AccordionBehavior
  root: HTMLDivElement
  items: Record<string, Item>
  valueChanges: string[][]
  dispose: () => void
}

function mount(
  create: () => AccordionBehavior,
  props: Partial<AccordionProps> = {},
  values: string[] = ['a', 'b', 'c'],
  disabledValues: string[] = [],
): Mounted {
  const behavior = create()
  const root = document.createElement('div')
  document.body.append(root)
  const items: Record<string, Item> = {}
  for (const value of values) {
    const item = document.createElement('div')
    const trigger = document.createElement('button')
    const content = document.createElement('div')
    item.append(trigger, content)
    root.append(item)
    items[value] = { item, trigger, content }
  }

  const valueChanges: string[][] = []
  behavior.init({
    id: `acc-${++seq}`,
    dir: 'ltr',
    onValueChange: (d: { value: string[] }) => valueChanges.push(d.value),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    ...values.flatMap((value) => {
      const disabled = disabledValues.includes(value) || undefined
      return [
        bindPart(behavior, items[value].item, (api) => api.getItemProps({ value, disabled })),
        bindPart(behavior, items[value].trigger, (api) =>
          api.getItemTriggerProps({ value, disabled }),
        ),
        bindPart(behavior, items[value].content, (api) =>
          api.getItemContentProps({ value, disabled }),
        ),
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

/** A real click focuses the button first (focusin), then fires click. */
const clickTrigger = (el: HTMLElement) => {
  el.focus()
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}
const keydown = (el: HTMLElement, key: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
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

describe.each(engines)('accordion engine: %s', (_name, create) => {
  it('starts with every item closed and wired for ARIA', async () => {
    const t = track(mount(create))
    await flush()
    for (const { item, trigger, content } of Object.values(t.items)) {
      expect(item.getAttribute('data-state')).toBe('closed')
      expect(trigger.getAttribute('aria-expanded')).toBe('false')
      expect(trigger.getAttribute('aria-controls')).toBe(content.id)
      expect(content.getAttribute('role')).toBe('region')
      expect(content.getAttribute('aria-labelledby')).toBe(trigger.id)
      expect(content.hidden).toBe(true)
    }
  })

  it('clicking a trigger expands its item', async () => {
    const t = track(mount(create))
    clickTrigger(t.items.a.trigger)
    await flush()
    expect(t.items.a.item.getAttribute('data-state')).toBe('open')
    expect(t.items.a.trigger.getAttribute('aria-expanded')).toBe('true')
    expect(t.items.a.content.hidden).toBe(false)
    expect(t.valueChanges).toEqual([['a']])
  })

  it('single mode: opening another item closes the first', async () => {
    const t = track(mount(create))
    clickTrigger(t.items.a.trigger)
    clickTrigger(t.items.b.trigger)
    await flush()
    expect(t.items.a.content.hidden).toBe(true)
    expect(t.items.b.content.hidden).toBe(false)
    expect(t.valueChanges).toEqual([['a'], ['b']])
  })

  it('single non-collapsible: clicking the open item keeps it open', async () => {
    const t = track(mount(create))
    clickTrigger(t.items.a.trigger)
    clickTrigger(t.items.a.trigger)
    await flush()
    expect(t.items.a.content.hidden).toBe(false)
    expect(t.valueChanges).toEqual([['a']])
  })

  it('collapsible: clicking the open item closes it', async () => {
    const t = track(mount(create, { collapsible: true }))
    clickTrigger(t.items.a.trigger)
    clickTrigger(t.items.a.trigger)
    await flush()
    expect(t.items.a.content.hidden).toBe(true)
    expect(t.valueChanges).toEqual([['a'], []])
  })

  it('multiple: items open independently and toggle off', async () => {
    const t = track(mount(create, { multiple: true }))
    clickTrigger(t.items.a.trigger)
    clickTrigger(t.items.b.trigger)
    await flush()
    expect(t.items.a.content.hidden).toBe(false)
    expect(t.items.b.content.hidden).toBe(false)
    clickTrigger(t.items.a.trigger)
    await flush()
    expect(t.items.a.content.hidden).toBe(true)
    expect(t.items.b.content.hidden).toBe(false)
    expect(t.valueChanges).toEqual([['a'], ['a', 'b'], ['b']])
  })

  it('defaultValue starts expanded', async () => {
    const t = track(mount(create, { defaultValue: ['b'] }))
    await flush()
    expect(t.items.b.content.hidden).toBe(false)
    expect(t.items.a.content.hidden).toBe(true)
  })

  it('focused trigger gets data-focus on itself, its item and content', async () => {
    const t = track(mount(create))
    t.items.a.trigger.focus()
    await flush()
    expect(t.items.a.trigger.getAttribute('data-focus')).toBe('')
    expect(t.items.a.item.getAttribute('data-focus')).toBe('')
    t.items.a.trigger.blur()
    await flush()
    expect(t.items.a.trigger.hasAttribute('data-focus')).toBe(false)
  })

  it('ArrowDown/ArrowUp move focus across triggers and wrap', async () => {
    const t = track(mount(create))
    t.items.a.trigger.focus()
    keydown(t.items.a.trigger, 'ArrowDown')
    await flush()
    expect(document.activeElement).toBe(t.items.b.trigger)

    keydown(t.items.b.trigger, 'ArrowUp')
    await flush()
    expect(document.activeElement).toBe(t.items.a.trigger)

    // wraps from first to last and last to first
    keydown(t.items.a.trigger, 'ArrowUp')
    await flush()
    expect(document.activeElement).toBe(t.items.c.trigger)
    keydown(t.items.c.trigger, 'ArrowDown')
    await flush()
    expect(document.activeElement).toBe(t.items.a.trigger)
  })

  it('Home and End jump to the first and last trigger', async () => {
    const t = track(mount(create))
    t.items.b.trigger.focus()
    keydown(t.items.b.trigger, 'End')
    await flush()
    expect(document.activeElement).toBe(t.items.c.trigger)
    keydown(t.items.c.trigger, 'Home')
    await flush()
    expect(document.activeElement).toBe(t.items.a.trigger)
  })

  it('vertical (default) ignores horizontal arrows', async () => {
    const t = track(mount(create))
    t.items.a.trigger.focus()
    keydown(t.items.a.trigger, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.items.a.trigger)
  })

  it('horizontal orientation navigates with left/right and honors RTL', async () => {
    const t = track(mount(create, { orientation: 'horizontal' }))
    t.items.a.trigger.focus()
    keydown(t.items.a.trigger, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.items.b.trigger)
    keydown(t.items.b.trigger, 'ArrowDown')
    await flush()
    expect(document.activeElement).toBe(t.items.b.trigger)

    const rtl = track(mount(create, { orientation: 'horizontal', dir: 'rtl' }))
    rtl.items.a.trigger.focus()
    keydown(rtl.items.a.trigger, 'ArrowLeft')
    await flush()
    expect(document.activeElement).toBe(rtl.items.b.trigger)
  })

  it('disabled items are skipped by arrow navigation', async () => {
    const t = track(mount(create, {}, ['a', 'b', 'c'], ['b']))
    await flush()
    expect(t.items.b.trigger.hasAttribute('disabled')).toBe(true)
    t.items.a.trigger.focus()
    keydown(t.items.a.trigger, 'ArrowDown')
    await flush()
    expect(document.activeElement).toBe(t.items.c.trigger)
  })

  it('setValue drives the open items programmatically', async () => {
    const t = track(mount(create))
    t.behavior.api!.setValue(['c'])
    await flush()
    expect(t.items.c.content.hidden).toBe(false)
    expect(t.valueChanges).toEqual([['c']])
  })
})

describe('zag ↔ native accordion attribute contract', () => {
  const attrsOf = (el: Element): Record<string, string> =>
    Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

  async function snapshot(create: () => AccordionBehavior) {
    const t = mount(create, { id: 'contract', collapsible: true })
    await vi.advanceTimersByTimeAsync(50)
    const snap = () => ({
      root: attrsOf(t.root),
      itemA: attrsOf(t.items.a.item),
      triggerA: attrsOf(t.items.a.trigger),
      contentA: attrsOf(t.items.a.content),
      itemB: attrsOf(t.items.b.item),
      triggerB: attrsOf(t.items.b.trigger),
      contentB: attrsOf(t.items.b.content),
    })
    const closed = snap()
    clickTrigger(t.items.a.trigger)
    await vi.advanceTimersByTimeAsync(50)
    const open = snap()
    clickTrigger(t.items.a.trigger)
    await vi.advanceTimersByTimeAsync(50)
    const reclosed = snap()
    t.items.a.trigger.blur()
    await vi.advanceTimersByTimeAsync(50)
    const blurred = snap()
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, open, reclosed, blurred }
  }

  it('emits identical attributes in closed, open, reclosed and blurred states', async () => {
    // sequential mounts — same `id`, so the DOM ids collide if simultaneous
    const zag = await snapshot(createZagAccordionBehavior)
    const native = await snapshot(createAccordionBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.open).toEqual(zag.open)
    expect(native.reclosed).toEqual(zag.reclosed)
    expect(native.blurred).toEqual(zag.blurred)
  })
})
