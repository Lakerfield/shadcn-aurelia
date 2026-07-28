/**
 * Dual-engine switch suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine. Parts are wired exactly the way
 * the registry component does it: `bindPart` applying the prop bags.
 * See checkbox.spec.ts for why press tracking is a native-only test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createSwitchBehavior,
  createZagSwitchBehavior,
  type SwitchBehavior,
  type SwitchProps,
} from '../src/behaviors'

const engines = [
  ['native', createSwitchBehavior],
  ['zag', createZagSwitchBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: SwitchBehavior
  root: HTMLLabelElement
  input: HTMLInputElement
  control: HTMLSpanElement
  thumb: HTMLSpanElement
  checkedChanges: boolean[]
  dispose: () => void
}

function mount(create: () => SwitchBehavior, props: Partial<SwitchProps> = {}): Mounted {
  const behavior = create()
  const root = document.createElement('label')
  const input = document.createElement('input')
  const control = document.createElement('span')
  const thumb = document.createElement('span')
  control.appendChild(thumb)
  root.append(input, control)
  document.body.append(root)

  const checkedChanges: boolean[] = []
  behavior.init({
    id: `sw-${++seq}`,
    dir: 'ltr',
    onCheckedChange: (d: { checked: boolean }) => checkedChanges.push(d.checked),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    bindPart(behavior, input, (api) => api.getHiddenInputProps()),
    bindPart(behavior, control, (api) => api.getControlProps()),
    bindPart(behavior, thumb, (api) => api.getThumbProps()),
  ]
  return {
    behavior,
    root,
    input,
    control,
    thumb,
    checkedChanges,
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

describe.each(engines)('switch engine: %s', (_name, create) => {
  it('starts unchecked with the ARIA/input wiring in place', async () => {
    const t = track(mount(create))
    await flush()
    expect(t.input.getAttribute('type')).toBe('checkbox')
    expect(t.input.checked).toBe(false)
    expect(t.root.getAttribute('for')).toBe(t.input.id)
    expect(t.control.getAttribute('data-state')).toBe('unchecked')
    expect(t.thumb.getAttribute('data-state')).toBe('unchecked')
    expect(t.control.getAttribute('aria-hidden')).toBe('true')
    expect(t.thumb.getAttribute('aria-hidden')).toBe('true')
  })

  it('clicking the input toggles the switch', async () => {
    const t = track(mount(create))
    await flush()
    t.input.click()
    await flush()
    expect(t.control.getAttribute('data-state')).toBe('checked')
    expect(t.thumb.getAttribute('data-state')).toBe('checked')
    expect(t.checkedChanges).toEqual([true])

    t.input.click()
    await flush()
    expect(t.control.getAttribute('data-state')).toBe('unchecked')
    expect(t.checkedChanges).toEqual([true, false])
  })

  it('setChecked syncs the input property and fires the change callback', async () => {
    const t = track(mount(create))
    await flush()
    t.behavior.api!.setChecked(true)
    await flush()
    expect(t.input.checked).toBe(true)
    expect(t.control.getAttribute('data-state')).toBe('checked')
    expect(t.checkedChanges).toEqual([true])
    // no-op set does not re-fire
    t.behavior.api!.setChecked(true)
    await flush()
    expect(t.checkedChanges).toEqual([true])
  })

  it('defaultChecked starts checked without firing the callback', async () => {
    const t = track(mount(create, { defaultChecked: true }))
    await flush()
    expect(t.control.getAttribute('data-state')).toBe('checked')
    expect(t.checkedChanges).toEqual([])
  })

  it('keyboard focus marks data-focus and data-focus-visible', async () => {
    const t = track(mount(create))
    await flush()
    pressTab()
    t.input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await flush()
    expect(t.control.getAttribute('data-focus')).toBe('')
    expect(t.control.getAttribute('data-focus-visible')).toBe('')
    t.input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await flush()
    expect(t.control.hasAttribute('data-focus')).toBe(false)
  })

  it('disabled marks every part and the input', async () => {
    const t = track(mount(create, { disabled: true }))
    await flush()
    expect(t.root.getAttribute('data-disabled')).toBe('')
    expect(t.thumb.getAttribute('data-disabled')).toBe('')
    expect(t.input.hasAttribute('disabled')).toBe(true)
  })
})

describe('switch native-only behavior (dead with the Zag adapter wiring)', () => {
  it('pressing the root marks data-active until pointerup', async () => {
    const t = track(mount(createSwitchBehavior))
    await flush()
    t.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(t.control.getAttribute('data-active')).toBe('')
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flush()
    expect(t.control.hasAttribute('data-active')).toBe(false)
  })
})

describe('zag ↔ native switch attribute contract', () => {
  const attrsOf = (el: Element): Record<string, string> =>
    Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

  async function snapshot(create: () => SwitchBehavior) {
    const t = mount(create, { id: 'contract' })
    await vi.advanceTimersByTimeAsync(50)
    const snap = () => ({
      root: attrsOf(t.root),
      input: attrsOf(t.input),
      control: attrsOf(t.control),
      thumb: attrsOf(t.thumb),
    })
    const unchecked = snap()
    t.input.click()
    await vi.advanceTimersByTimeAsync(50)
    const checked = snap()
    pressTab()
    t.input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(50)
    const focused = snap()
    t.input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    t.input.click()
    await vi.advanceTimersByTimeAsync(50)
    const rechecked = snap()
    t.dispose()
    await vi.runAllTimersAsync()
    return { unchecked, checked, focused, rechecked }
  }

  it('emits identical attributes in unchecked, checked, focused and reunchecked states', async () => {
    // sequential mounts — same `id`, so the DOM ids collide if simultaneous
    const zag = await snapshot(createZagSwitchBehavior)
    const native = await snapshot(createSwitchBehavior)
    expect(native.unchecked).toEqual(zag.unchecked)
    expect(native.checked).toEqual(zag.checked)
    expect(native.focused).toEqual(zag.focused)
    expect(native.rechecked).toEqual(zag.rechecked)
  })
})
