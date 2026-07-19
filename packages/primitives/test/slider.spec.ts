/**
 * Dual-engine slider suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: root/control/track/range via bindPart,
 * one thumb (+ hidden input) per initial value, `thumbSize` passed so no DOM
 * measurement runs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createSliderBehavior,
  createZagSliderBehavior,
  type SliderBehavior,
  type SliderProps,
} from '../src/behaviors'

const engines = [
  ['native', createSliderBehavior],
  ['zag', createZagSliderBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: SliderBehavior
  root: HTMLDivElement
  control: HTMLDivElement
  trackEl: HTMLDivElement
  range: HTMLDivElement
  thumbs: HTMLDivElement[]
  inputs: HTMLInputElement[]
  valueChanges: number[][]
  dispose: () => void
}

function mount(create: () => SliderBehavior, props: Partial<SliderProps> = {}): Mounted {
  const behavior = create()
  const root = document.createElement('div')
  const control = document.createElement('div')
  const trackEl = document.createElement('div')
  const range = document.createElement('div')
  trackEl.append(range)
  control.append(trackEl)
  root.append(control)
  document.body.append(root)

  const valueChanges: number[][] = []
  const defaultValue = props.defaultValue ?? [50]
  behavior.init({
    id: `sld-${++seq}`,
    dir: 'ltr',
    thumbSize: { width: 16, height: 16 },
    onValueChange: (d: { value: number[] }) => valueChanges.push(d.value),
    ...props,
    defaultValue,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    bindPart(behavior, control, (api) => api.getControlProps()),
    bindPart(behavior, trackEl, (api) => api.getTrackProps()),
    bindPart(behavior, range, (api) => api.getRangeProps()),
  ]
  const thumbs: HTMLDivElement[] = []
  const inputs: HTMLInputElement[] = []
  defaultValue.forEach((_, index) => {
    const thumb = document.createElement('div')
    const input = document.createElement('input')
    thumb.append(input)
    control.append(thumb)
    thumbs.push(thumb)
    inputs.push(input)
    disposers.push(
      bindPart(behavior, thumb, (api) => api.getThumbProps({ index })),
      bindPart(behavior, input, (api) => api.getHiddenInputProps({ index })),
    )
  })
  return {
    behavior,
    root,
    control,
    trackEl,
    range,
    thumbs,
    inputs,
    valueChanges,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      root.remove()
    },
  }
}

const keydown = (el: HTMLElement, key: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
/** Flush Zag's queueMicrotask sends and pending rafs. */
const settle = () => vi.advanceTimersByTimeAsync(50)

/** Give the control a real layout box so pointer math works in jsdom. */
function fakeControlRect(control: HTMLElement, width = 216, height = 20): void {
  control.getBoundingClientRect = () =>
    ({ left: 0, top: 0, x: 0, y: 0, width, height, right: width, bottom: height, toJSON: () => ({}) }) as DOMRect
}

const pointerDown = (el: HTMLElement, clientX: number, clientY = 10) =>
  el.dispatchEvent(
    new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX, clientY }),
  )

const mounted: Mounted[] = []
const track = (m: Mounted) => (mounted.push(m), m)

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'],
  })
})

afterEach(async () => {
  mounted.splice(0).forEach((m) => m.dispose())
  await vi.runAllTimersAsync()
  vi.useRealTimers()
})

describe.each(engines)('slider engine: %s', (_name, create) => {
  it('renders the initial value with full ARIA and positioning variables', async () => {
    const t = track(mount(create))
    await settle()
    const thumb = t.thumbs[0]
    expect(thumb.getAttribute('role')).toBe('slider')
    expect(thumb.getAttribute('aria-valuenow')).toBe('50')
    expect(thumb.getAttribute('aria-valuemin')).toBe('0')
    expect(thumb.getAttribute('aria-valuemax')).toBe('100')
    expect(thumb.getAttribute('aria-orientation')).toBe('horizontal')
    expect(thumb.getAttribute('tabindex')).toBe('0')
    expect(t.root.style.getPropertyValue('--slider-thumb-offset-0')).toBe('calc(50% - 0px)')
    expect(t.root.style.getPropertyValue('--slider-range-start')).toBe('0%')
    expect(t.root.style.getPropertyValue('--slider-range-end')).toBe('50%')
    expect(t.root.style.getPropertyValue('--slider-thumb-width')).toBe('16px')
    expect(t.inputs[0].getAttribute('value')).toBe('50')
    expect(t.inputs[0].getAttribute('type')).toBe('text')
    expect(t.inputs[0].hidden).toBe(true)
  })

  it('snaps the initial value to the step grid', async () => {
    const t = track(mount(create, { defaultValue: [33], step: 10 }))
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('30')
  })

  it('focus + arrow keys step the value; shift uses largeStep; Home/End jump', async () => {
    const t = track(mount(create, { defaultValue: [50], step: 2 }))
    await settle()
    t.thumbs[0].focus()
    await settle()
    expect(t.root.getAttribute('data-focus')).toBe('')
    expect(t.thumbs[0].getAttribute('data-focus')).toBe('')

    keydown(t.thumbs[0], 'ArrowRight')
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('52')

    keydown(t.thumbs[0], 'ArrowLeft')
    keydown(t.thumbs[0], 'ArrowLeft')
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('48')

    // shift+arrow steps by largeStep (10×step = 20) AND snaps to that grid:
    // 48 + 20 = 68 → snapped to the 20-grid → 60 (Zag semantics)
    keydown(t.thumbs[0], 'ArrowRight', { shiftKey: true })
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('60')

    keydown(t.thumbs[0], 'End')
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('100')
    keydown(t.thumbs[0], 'Home')
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('0')
    expect(t.valueChanges.at(-1)).toEqual([0])
  })

  it('RTL swaps ArrowLeft/ArrowRight and mirrors the range side styles', async () => {
    const t = track(mount(create, { dir: 'rtl', defaultValue: [50] }))
    await settle()
    expect(t.range.style.right).toBe('var(--slider-range-start)')
    expect(t.range.style.left).toBe('var(--slider-range-end)')
    t.thumbs[0].focus()
    await settle()
    keydown(t.thumbs[0], 'ArrowLeft')
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('51')
    keydown(t.thumbs[0], 'ArrowRight')
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('50')
  })

  it('multi-thumb range: neighbours clamp each other and set aria bounds', async () => {
    const t = track(mount(create, { defaultValue: [20, 80] }))
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuemax')).toBe('80')
    expect(t.thumbs[1].getAttribute('aria-valuemin')).toBe('20')
    expect(t.root.style.getPropertyValue('--slider-range-start')).toBe('20%')
    expect(t.root.style.getPropertyValue('--slider-range-end')).toBe('20%')

    // pushing thumb 0 above thumb 1 clamps at the neighbour
    t.behavior.api!.setThumbValue(0, 95)
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('80')
    expect(t.inputs[0].getAttribute('value')).toBe('80')
  })

  it('setValue snaps to step, fires onValueChange and syncs hidden inputs', async () => {
    const t = track(mount(create, { defaultValue: [50], step: 5 }))
    await settle()
    const inputEvents: string[] = []
    t.inputs[0].addEventListener('input', () => inputEvents.push(t.inputs[0].value))
    t.behavior.api!.setValue([62])
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('60')
    expect(t.valueChanges.at(-1)).toEqual([60])
    expect(t.inputs[0].value).toBe('60')
    expect(inputEvents).toContain('60')
  })

  it('pointerdown on the control jumps the closest thumb and starts dragging', async () => {
    const t = track(mount(create, { defaultValue: [50] }))
    await settle()
    fakeControlRect(t.control) // width 216 → effective 200 with 16px thumb inset
    pointerDown(t.control, 8 + 150) // 150/200 = 75%
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('75')
    expect(t.root.getAttribute('data-dragging')).toBe('')
    expect(t.thumbs[0].getAttribute('data-dragging')).toBe('')

    // move to 25%, then release → focus state
    document.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 8 + 50, clientY: 10, buttons: 1 }),
    )
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('25')
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 8 + 50, clientY: 10 }))
    await settle()
    expect(t.root.hasAttribute('data-dragging')).toBe(false)
    expect(t.root.getAttribute('data-focus')).toBe('')
  })

  it('disabled: no tabindex, data-disabled everywhere, keys and pointers ignored', async () => {
    const t = track(mount(create, { defaultValue: [50], disabled: true }))
    await settle()
    expect(t.root.getAttribute('data-disabled')).toBe('')
    expect(t.thumbs[0].getAttribute('data-disabled')).toBe('')
    expect(t.thumbs[0].hasAttribute('tabindex')).toBe(false)
    expect(t.thumbs[0].getAttribute('aria-disabled')).toBe('true')
    fakeControlRect(t.control)
    pointerDown(t.control, 8 + 150)
    keydown(t.thumbs[0], 'ArrowRight')
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('50')
    expect(t.valueChanges).toEqual([])
  })

  it('form reset restores the initial value', async () => {
    const form = document.createElement('form')
    document.body.append(form)
    const t = track(mount(create, { defaultValue: [40] }))
    form.append(t.root)
    await settle()
    t.behavior.api!.setValue([90])
    await settle()
    expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('90')
    form.dispatchEvent(new Event('reset', { bubbles: true }))
    await settle()
    if (_name === 'native') {
      expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('40')
    } else {
      // Zag's trackFormControl is a machine-level effect: it runs synchronously
      // in start(), before bindPart has written the root id, so it never finds
      // the form — the restore is silently dead in the adapter wiring (same
      // Phase 8 finding as checkbox). The native engine defers one frame and
      // delivers the feature.
      expect(t.thumbs[0].getAttribute('aria-valuenow')).toBe('90')
    }
    form.remove()
  })
})

describe('zag ↔ native slider attribute contract', () => {
  const attrsOf = (el: Element): Record<string, unknown> => {
    const attrs: Record<string, unknown> = Object.fromEntries(
      [...el.attributes].filter((a) => a.name !== 'style').map((a) => [a.name, a.value]),
    )
    const style: Record<string, string> = {}
    const cssStyle = (el as HTMLElement).style
    for (let i = 0; i < cssStyle.length; i++) {
      const prop = cssStyle.item(i)
      style[prop] = cssStyle.getPropertyValue(prop)
    }
    attrs.style = style
    return attrs
  }

  async function snapshot(create: () => SliderBehavior, props: Partial<SliderProps> = {}) {
    const t = mount(create, { id: 'contract', defaultValue: [25, 75], ...props })
    await vi.advanceTimersByTimeAsync(50)
    const partsOf = () => ({
      root: attrsOf(t.root),
      control: attrsOf(t.control),
      track: attrsOf(t.trackEl),
      range: attrsOf(t.range),
      thumb0: attrsOf(t.thumbs[0]),
      thumb1: attrsOf(t.thumbs[1] ?? t.thumbs[0]),
      input0: attrsOf(t.inputs[0]),
    })
    const idle = partsOf()
    t.thumbs[0].focus()
    await vi.advanceTimersByTimeAsync(50)
    const focused = partsOf()
    t.thumbs[0].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    )
    await vi.advanceTimersByTimeAsync(50)
    const stepped = partsOf()
    t.thumbs[0].blur()
    await vi.advanceTimersByTimeAsync(50)
    const blurred = partsOf()
    t.dispose()
    await vi.runAllTimersAsync()
    return { idle, focused, stepped, blurred }
  }

  it('emits identical attributes and styles across idle, focused, stepped and blurred states', async () => {
    const zag = await snapshot(createZagSliderBehavior)
    const native = await snapshot(createSliderBehavior)
    expect(native.idle).toEqual(zag.idle)
    expect(native.focused).toEqual(zag.focused)
    expect(native.stepped).toEqual(zag.stepped)
    expect(native.blurred).toEqual(zag.blurred)
  })

  it('emits identical attributes in RTL', async () => {
    const zag = await snapshot(createZagSliderBehavior, { dir: 'rtl', defaultValue: [30] })
    const native = await snapshot(createSliderBehavior, { dir: 'rtl', defaultValue: [30] })
    expect(native.idle).toEqual(zag.idle)
    expect(native.focused).toEqual(zag.focused)
    expect(native.stepped).toEqual(zag.stepped)
  })
})
