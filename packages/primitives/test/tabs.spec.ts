/**
 * Dual-engine tabs suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: `bindPart` applying the prop bags.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createTabsBehavior,
  createZagTabsBehavior,
  type TabsBehavior,
  type TabsProps,
} from '../src/behaviors'

const engines = [
  ['native', createTabsBehavior],
  ['zag', createZagTabsBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: TabsBehavior
  root: HTMLDivElement
  list: HTMLDivElement
  triggers: Record<string, HTMLButtonElement>
  contents: Record<string, HTMLDivElement>
  valueChanges: string[]
  dispose: () => void
}

function mount(
  create: () => TabsBehavior,
  props: Partial<TabsProps> = {},
  values: string[] = ['a', 'b', 'c'],
  disabledValues: string[] = [],
): Mounted {
  const behavior = create()
  const root = document.createElement('div')
  const list = document.createElement('div')
  root.append(list)
  document.body.append(root)
  const triggers: Record<string, HTMLButtonElement> = {}
  const contents: Record<string, HTMLDivElement> = {}
  for (const value of values) {
    triggers[value] = document.createElement('button')
    list.append(triggers[value])
    contents[value] = document.createElement('div')
    root.append(contents[value])
  }

  const valueChanges: string[] = []
  behavior.init({
    id: `tabs-${++seq}`,
    dir: 'ltr',
    defaultValue: 'a',
    onValueChange: (d: { value: string }) => valueChanges.push(d.value),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    bindPart(behavior, list, (api) => api.getListProps()),
    ...values.flatMap((value) => {
      const disabled = disabledValues.includes(value) || undefined
      return [
        bindPart(behavior, triggers[value], (api) => api.getTriggerProps({ value, disabled })),
        bindPart(behavior, contents[value], (api) => api.getContentProps({ value })),
      ]
    }),
  ]
  return {
    behavior,
    root,
    list,
    triggers,
    contents,
    valueChanges,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      root.remove()
    },
  }
}

/** A real click focuses the button first (focusin), then fires click. */
const clickTab = (el: HTMLElement) => {
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

describe.each(engines)('tabs engine: %s', (_name, create) => {
  it('starts with the default tab selected and roving tabindex', async () => {
    const t = track(mount(create))
    await flush()
    expect(t.list.getAttribute('role')).toBe('tablist')
    expect(t.list.getAttribute('aria-orientation')).toBe('horizontal')
    expect(t.triggers.a.getAttribute('role')).toBe('tab')
    expect(t.triggers.a.getAttribute('aria-selected')).toBe('true')
    expect(t.triggers.a.getAttribute('tabindex')).toBe('0')
    expect(t.triggers.a.getAttribute('aria-controls')).toBe(t.contents.a.id)
    expect(t.triggers.b.getAttribute('aria-selected')).toBe('false')
    expect(t.triggers.b.getAttribute('tabindex')).toBe('-1')
    expect(t.triggers.b.hasAttribute('aria-controls')).toBe(false)
    expect(t.contents.a.hidden).toBe(false)
    expect(t.contents.a.getAttribute('role')).toBe('tabpanel')
    expect(t.contents.a.getAttribute('aria-labelledby')).toBe(t.triggers.a.id)
    expect(t.contents.b.hidden).toBe(true)
  })

  it('clicking a tab selects it and swaps the panels', async () => {
    const t = track(mount(create))
    clickTab(t.triggers.b)
    await flush()
    expect(t.triggers.b.getAttribute('aria-selected')).toBe('true')
    expect(t.triggers.b.getAttribute('data-selected')).toBe('')
    expect(t.triggers.a.getAttribute('aria-selected')).toBe('false')
    expect(t.contents.b.hidden).toBe(false)
    expect(t.contents.a.hidden).toBe(true)
    expect(t.valueChanges).toEqual(['b'])
  })

  it('ArrowRight moves focus and selects in automatic mode, wrapping at the end', async () => {
    const t = track(mount(create))
    t.triggers.a.focus()
    keydown(t.triggers.a, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.triggers.b)
    expect(t.triggers.b.getAttribute('aria-selected')).toBe('true')
    expect(t.valueChanges).toEqual(['b'])

    keydown(t.triggers.b, 'ArrowRight')
    await flush()
    keydown(t.triggers.c, 'ArrowRight')
    await flush()
    // wrapped from the last tab back to the first
    expect(document.activeElement).toBe(t.triggers.a)
    expect(t.triggers.a.getAttribute('aria-selected')).toBe('true')
  })

  it('ArrowLeft moves backwards and wraps to the last tab', async () => {
    const t = track(mount(create))
    t.triggers.a.focus()
    keydown(t.triggers.a, 'ArrowLeft')
    await flush()
    expect(document.activeElement).toBe(t.triggers.c)
    expect(t.triggers.c.getAttribute('aria-selected')).toBe('true')
  })

  it('Home and End jump to the first and last tab', async () => {
    const t = track(mount(create))
    clickTab(t.triggers.b)
    await flush()
    keydown(t.triggers.b, 'End')
    await flush()
    expect(document.activeElement).toBe(t.triggers.c)
    keydown(t.triggers.c, 'Home')
    await flush()
    expect(document.activeElement).toBe(t.triggers.a)
  })

  it('horizontal (default) ignores vertical arrows', async () => {
    const t = track(mount(create))
    t.triggers.a.focus()
    keydown(t.triggers.a, 'ArrowDown')
    await flush()
    expect(document.activeElement).toBe(t.triggers.a)
  })

  it('vertical orientation navigates with up/down', async () => {
    const t = track(mount(create, { orientation: 'vertical' }))
    await flush()
    expect(t.list.getAttribute('aria-orientation')).toBe('vertical')
    t.triggers.a.focus()
    keydown(t.triggers.a, 'ArrowDown')
    await flush()
    expect(document.activeElement).toBe(t.triggers.b)
    keydown(t.triggers.b, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.triggers.b)
  })

  it('RTL swaps the horizontal arrows', async () => {
    const t = track(mount(create, { dir: 'rtl' }))
    t.triggers.a.focus()
    keydown(t.triggers.a, 'ArrowLeft')
    await flush()
    expect(document.activeElement).toBe(t.triggers.b)
  })

  it('manual activation moves focus without selecting', async () => {
    const t = track(mount(create, { activationMode: 'manual' }))
    t.triggers.a.focus()
    keydown(t.triggers.a, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.triggers.b)
    expect(t.triggers.a.getAttribute('aria-selected')).toBe('true')
    expect(t.triggers.b.getAttribute('aria-selected')).toBe('false')
    expect(t.valueChanges).toEqual([])
  })

  it('disabled tabs are skipped by arrow navigation', async () => {
    const t = track(mount(create, {}, ['a', 'b', 'c'], ['b']))
    await flush()
    expect(t.triggers.b.hasAttribute('disabled')).toBe(true)
    t.triggers.a.focus()
    keydown(t.triggers.a, 'ArrowRight')
    await flush()
    expect(document.activeElement).toBe(t.triggers.c)
  })

  it('focus marks the root/list with data-focus; blur clears it', async () => {
    const t = track(mount(create))
    t.triggers.a.focus()
    await flush()
    expect(t.root.getAttribute('data-focus')).toBe('')
    expect(t.list.getAttribute('data-focus')).toBe('')
    expect(t.triggers.a.getAttribute('data-focus')).toBe('')
    t.triggers.a.blur()
    await flush()
    expect(t.root.hasAttribute('data-focus')).toBe(false)
    expect(t.list.hasAttribute('data-focus')).toBe(false)
  })

  it('setValue drives the selection programmatically', async () => {
    const t = track(mount(create))
    t.behavior.api!.setValue('c')
    await flush()
    expect(t.contents.c.hidden).toBe(false)
    expect(t.contents.a.hidden).toBe(true)
    expect(t.valueChanges).toEqual(['c'])
  })

  it('an empty panel becomes a tab stop (tabindex=0), a panel with focusables does not', async () => {
    const t = track(mount(create))
    const input = document.createElement('input')
    // jsdom reports zero size for everything; both engines require visibility
    Object.defineProperty(input, 'offsetWidth', { value: 10 })
    t.contents.b.append(input)
    await flush()
    expect(t.contents.a.getAttribute('tabindex')).toBe('0')
    t.behavior.api!.setValue('b')
    await flush()
    expect(t.contents.b.hasAttribute('tabindex')).toBe(false)
  })
})

describe('zag ↔ native tabs attribute contract', () => {
  const attrsOf = (el: Element): Record<string, string> =>
    Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

  async function snapshot(create: () => TabsBehavior) {
    const t = mount(create, { id: 'contract' })
    await vi.advanceTimersByTimeAsync(50)
    const snap = () => ({
      root: attrsOf(t.root),
      list: attrsOf(t.list),
      triggerA: attrsOf(t.triggers.a),
      triggerB: attrsOf(t.triggers.b),
      contentA: attrsOf(t.contents.a),
      contentB: attrsOf(t.contents.b),
    })
    const initial = snap()
    clickTab(t.triggers.b)
    await vi.advanceTimersByTimeAsync(50)
    const selectedB = snap()
    t.triggers.b.blur()
    await vi.advanceTimersByTimeAsync(50)
    const blurred = snap()
    t.dispose()
    await vi.runAllTimersAsync()
    return { initial, selectedB, blurred }
  }

  it('emits identical attributes in initial, selected and blurred states', async () => {
    // sequential mounts — same `id`, so the DOM ids collide if simultaneous
    const zag = await snapshot(createZagTabsBehavior)
    const native = await snapshot(createTabsBehavior)
    expect(native.initial).toEqual(zag.initial)
    expect(native.selectedB).toEqual(zag.selectedB)
    expect(native.blurred).toEqual(zag.blurred)
  })
})
