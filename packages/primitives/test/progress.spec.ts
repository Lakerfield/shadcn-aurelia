/**
 * Dual-engine progress suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired the way the
 * registry component does it (root + range), plus the track for the
 * progressbar ARIA contract.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createProgressBehavior,
  createZagProgressBehavior,
  type ProgressBehavior,
  type ProgressProps,
} from '../src/behaviors'

const engines = [
  ['native', createProgressBehavior],
  ['zag', createZagProgressBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: ProgressBehavior
  root: HTMLDivElement
  track: HTMLDivElement
  range: HTMLDivElement
  dispose: () => void
}

function mount(create: () => ProgressBehavior, props: Partial<ProgressProps> = {}): Mounted {
  const behavior = create()
  const root = document.createElement('div')
  const track = document.createElement('div')
  const range = document.createElement('div')
  track.append(range)
  root.append(track)
  document.body.append(root)

  behavior.init({ id: `prog-${++seq}`, dir: 'ltr', ...props })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    bindPart(behavior, track, (api) => api.getTrackProps()),
    bindPart(behavior, range, (api) => api.getRangeProps()),
  ]
  return {
    behavior,
    root,
    track,
    range,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      root.remove()
    },
  }
}

/** Flush Zag's queueMicrotask sends. */
const settle = () => vi.advanceTimersByTimeAsync(20)

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

describe.each(engines)('progress engine: %s', (_name, create) => {
  it('renders the initial value: percent var, range width, progressbar ARIA', async () => {
    const t = track(mount(create, { defaultValue: 30 }))
    await settle()
    expect(t.root.getAttribute('data-state')).toBe('loading')
    expect(t.root.getAttribute('data-value')).toBe('30')
    expect(t.root.getAttribute('data-max')).toBe('100')
    expect(t.root.style.getPropertyValue('--percent')).toBe('30')
    expect(t.range.style.width).toBe('30%')
    expect(t.track.getAttribute('role')).toBe('progressbar')
    expect(t.track.getAttribute('aria-valuemin')).toBe('0')
    expect(t.track.getAttribute('aria-valuemax')).toBe('100')
    expect(t.track.getAttribute('aria-valuenow')).toBe('30')
    expect(t.track.getAttribute('aria-label')).toBe('30%')
  })

  it('defaults to the midpoint when no defaultValue is given', async () => {
    const t = track(mount(create, { max: 200 }))
    await settle()
    expect(t.root.getAttribute('data-value')).toBe('100')
    expect(t.root.style.getPropertyValue('--percent')).toBe('50')
  })

  it('setValue updates; max value flips data-state to complete; clamps above max', async () => {
    const t = track(mount(create, { defaultValue: 10 }))
    await settle()
    t.behavior.api!.setValue(80)
    await settle()
    expect(t.range.style.width).toBe('80%')
    expect(t.root.getAttribute('data-state')).toBe('loading')
    t.behavior.api!.setValue(250)
    await settle()
    expect(t.root.getAttribute('data-value')).toBe('100')
    expect(t.root.getAttribute('data-state')).toBe('complete')
  })

  it('null value renders the indeterminate state without percent styling', async () => {
    const t = track(mount(create, { defaultValue: 40 }))
    await settle()
    t.behavior.api!.setValue(null)
    await settle()
    expect(t.root.getAttribute('data-state')).toBe('indeterminate')
    expect(t.root.hasAttribute('data-value')).toBe(false)
    expect(t.root.style.getPropertyValue('--percent')).toBe('')
    expect(t.range.style.width).toBe('')
    expect(t.track.hasAttribute('aria-valuenow')).toBe(false)
    expect(t.track.getAttribute('aria-label')).toBe('loading...')
  })

  it('respects a custom min/max window', async () => {
    const t = track(mount(create, { min: 100, max: 300, defaultValue: 150 }))
    await settle()
    expect(t.root.style.getPropertyValue('--percent')).toBe('25')
    expect(t.track.getAttribute('aria-valuemin')).toBe('100')
    expect(t.track.getAttribute('aria-valuemax')).toBe('300')
  })
})

describe('zag ↔ native progress attribute contract', () => {
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

  async function snapshot(create: () => ProgressBehavior) {
    const t = mount(create, { id: 'contract', defaultValue: 66 })
    await vi.advanceTimersByTimeAsync(20)
    const partsOf = () => ({
      root: attrsOf(t.root),
      track: attrsOf(t.track),
      range: attrsOf(t.range),
    })
    const loading = partsOf()
    t.behavior.api!.setValue(100)
    await vi.advanceTimersByTimeAsync(20)
    const complete = partsOf()
    t.behavior.api!.setValue(null)
    await vi.advanceTimersByTimeAsync(20)
    const indeterminate = partsOf()
    t.dispose()
    await vi.runAllTimersAsync()
    return { loading, complete, indeterminate }
  }

  it('emits identical attributes and styles in loading, complete and indeterminate states', async () => {
    const zag = await snapshot(createZagProgressBehavior)
    const native = await snapshot(createProgressBehavior)
    expect(native.loading).toEqual(zag.loading)
    expect(native.complete).toEqual(zag.complete)
    expect(native.indeterminate).toEqual(zag.indeterminate)
  })
})
