/**
 * Dual-engine checkbox suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: `bindPart` applying the prop bags.
 *
 * Press tracking (`data-active`) and form-reset restore are native-only
 * tests: Zag attaches those as machine effects during `start()`, before
 * `bindPart` has applied the element ids, so with our adapter wiring they
 * never found their elements — the native engine defers attachment one
 * microtask and actually delivers them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createCheckboxBehavior,
  createZagCheckboxBehavior,
  type CheckboxBehavior,
  type CheckboxProps,
  type CheckedState,
} from '../src/behaviors'

const engines = [
  ['native', createCheckboxBehavior],
  ['zag', createZagCheckboxBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: CheckboxBehavior
  root: HTMLLabelElement
  input: HTMLInputElement
  control: HTMLSpanElement
  indicator: HTMLSpanElement
  checkedChanges: CheckedState[]
  dispose: () => void
}

function mount(create: () => CheckboxBehavior, props: Partial<CheckboxProps> = {}): Mounted {
  const behavior = create()
  const root = document.createElement('label')
  const input = document.createElement('input')
  const control = document.createElement('span')
  const indicator = document.createElement('span')
  control.appendChild(indicator)
  root.append(input, control)
  document.body.append(root)

  const checkedChanges: CheckedState[] = []
  behavior.init({
    id: `chk-${++seq}`,
    dir: 'ltr',
    onCheckedChange: (d: { checked: CheckedState }) => checkedChanges.push(d.checked),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    bindPart(behavior, input, (api) => api.getHiddenInputProps()),
    bindPart(behavior, control, (api) => api.getControlProps()),
    bindPart(behavior, indicator, (api) => api.getIndicatorProps()),
  ]
  return {
    behavior,
    root,
    input,
    control,
    indicator,
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
const usePointer = () => {
  document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
}
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

describe.each(engines)('checkbox engine: %s', (_name, create) => {
  it('starts unchecked with the ARIA/input wiring in place', async () => {
    const t = track(mount(create))
    await flush()
    expect(t.input.getAttribute('type')).toBe('checkbox')
    expect(t.input.checked).toBe(false)
    expect(t.input.getAttribute('value')).toBe('on')
    expect(t.input.getAttribute('aria-invalid')).toBe('false')
    expect(t.root.getAttribute('for')).toBe(t.input.id)
    expect(t.control.getAttribute('aria-hidden')).toBe('true')
    expect(t.control.getAttribute('data-state')).toBe('unchecked')
    expect(t.indicator.hidden).toBe(true)
  })

  it('clicking the input toggles checked state on every part', async () => {
    const t = track(mount(create))
    await flush()
    t.input.click()
    await flush()
    expect(t.root.getAttribute('data-state')).toBe('checked')
    expect(t.control.getAttribute('data-state')).toBe('checked')
    expect(t.indicator.hidden).toBe(false)
    expect(t.checkedChanges).toEqual([true])

    t.input.click()
    await flush()
    expect(t.control.getAttribute('data-state')).toBe('unchecked')
    expect(t.indicator.hidden).toBe(true)
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
  })

  it('starting indeterminate marks every part and the input property', async () => {
    // programmatic setChecked('indeterminate') round-trips through Zag's
    // dispatched input click and collapses to unchecked in BOTH engines
    // (covered by the contract diff); defaultChecked keeps the state stable
    const t = track(mount(create, { defaultChecked: 'indeterminate' }))
    await flush()
    expect(t.control.getAttribute('data-state')).toBe('indeterminate')
    expect(t.indicator.hidden).toBe(false)
    expect(t.input.checked).toBe(false)
  })

  it('defaultChecked starts checked without firing the callback', async () => {
    const t = track(mount(create, { defaultChecked: true }))
    await flush()
    expect(t.control.getAttribute('data-state')).toBe('checked')
    expect(t.checkedChanges).toEqual([])
  })

  it('keyboard focus marks data-focus and data-focus-visible; pointer only data-focus', async () => {
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

    usePointer()
    t.input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await flush()
    expect(t.control.getAttribute('data-focus')).toBe('')
    expect(t.control.hasAttribute('data-focus-visible')).toBe(false)
  })

  it('hovering the root marks data-hover on every part', async () => {
    const t = track(mount(create))
    await flush()
    t.root.dispatchEvent(new Event('pointermove', { bubbles: true }))
    await flush()
    expect(t.control.getAttribute('data-hover')).toBe('')
    t.root.dispatchEvent(new Event('pointerleave'))
    await flush()
    expect(t.control.hasAttribute('data-hover')).toBe(false)
  })

  it('disabled marks every part and the input', async () => {
    const t = track(mount(create, { disabled: true }))
    await flush()
    expect(t.root.getAttribute('data-disabled')).toBe('')
    expect(t.control.getAttribute('data-disabled')).toBe('')
    expect(t.input.hasAttribute('disabled')).toBe(true)
  })

  it('invalid marks data-invalid and aria-invalid', async () => {
    const t = track(mount(create, { invalid: true }))
    await flush()
    expect(t.control.getAttribute('data-invalid')).toBe('')
    expect(t.input.getAttribute('aria-invalid')).toBe('true')
  })
})

describe('checkbox native-only behavior (dead with the Zag adapter wiring)', () => {
  it('pressing the root marks data-active until pointerup', async () => {
    const t = track(mount(createCheckboxBehavior))
    await flush()
    t.root.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await flush()
    expect(t.control.getAttribute('data-active')).toBe('')
    window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await flush()
    expect(t.control.hasAttribute('data-active')).toBe(false)
  })

  it('a form reset restores the initial checked state', async () => {
    const behavior = createCheckboxBehavior()
    const form = document.createElement('form')
    const root = document.createElement('label')
    const input = document.createElement('input')
    root.append(input)
    form.append(root)
    document.body.append(form)
    behavior.init({ id: `chk-${++seq}` })
    behavior.start()
    const disposers = [
      bindPart(behavior, root, (api) => api.getRootProps()),
      bindPart(behavior, input, (api) => api.getHiddenInputProps()),
    ]
    await flush()
    behavior.api!.setChecked(true)
    await flush()
    expect(input.checked).toBe(true)
    form.dispatchEvent(new Event('reset'))
    await flush()
    expect(input.checked).toBe(false)
    disposers.forEach((d) => d())
    behavior.stop()
    form.remove()
  })
})

describe('zag ↔ native checkbox attribute contract', () => {
  const attrsOf = (el: Element): Record<string, string> =>
    Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

  async function snapshot(create: () => CheckboxBehavior) {
    const t = mount(create, { id: 'contract' })
    await vi.advanceTimersByTimeAsync(50)
    const snap = () => ({
      root: attrsOf(t.root),
      input: attrsOf(t.input),
      control: attrsOf(t.control),
      indicator: attrsOf(t.indicator),
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
    const zag = await snapshot(createZagCheckboxBehavior)
    const native = await snapshot(createCheckboxBehavior)
    expect(native.unchecked).toEqual(zag.unchecked)
    expect(native.checked).toEqual(zag.checked)
    expect(native.focused).toEqual(zag.focused)
    expect(native.rechecked).toEqual(zag.rechecked)
  })
})
