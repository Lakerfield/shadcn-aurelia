/**
 * Dual-engine tooltip suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: `bindPart` applying the prop bags.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createTooltipBehavior,
  createZagTooltipBehavior,
  type TooltipBehavior,
  type TooltipProps,
} from '../src/behaviors'

const engines = [
  ['native', createTooltipBehavior],
  ['zag', createZagTooltipBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: TooltipBehavior
  trigger: HTMLButtonElement
  positioner: HTMLDivElement
  content: HTMLDivElement
  openChanges: boolean[]
  dispose: () => void
}

function mount(create: () => TooltipBehavior, props: Partial<TooltipProps> = {}): Mounted {
  const behavior = create()
  const trigger = document.createElement('button')
  const positioner = document.createElement('div')
  const content = document.createElement('div')
  positioner.appendChild(content)
  document.body.append(trigger, positioner)

  const openChanges: boolean[] = []
  behavior.init({
    id: `tip-${++seq}`,
    dir: 'ltr',
    positioning: { placement: 'top' },
    onOpenChange: (d: { open: boolean }) => openChanges.push(d.open),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, trigger, (api) => api.getTriggerProps()),
    bindPart(behavior, positioner, (api) => api.getPositionerProps()),
    bindPart(behavior, content, (api) => api.getContentProps()),
  ]
  return {
    behavior,
    trigger,
    positioner,
    content,
    openChanges,
    dispose() {
      // close first so the module-level "one visible tooltip" store resets
      behavior.api?.setOpen(false)
      disposers.forEach((d) => d())
      behavior.stop()
      trigger.remove()
      positioner.remove()
    },
  }
}

/** Set keyboard interaction modality in both engines' global trackers. */
const pressTab = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

/** Set pointer interaction modality in both engines' global trackers. */
const usePointer = () => {
  document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  document.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
}

const hover = (el: HTMLElement) => el.dispatchEvent(new Event('pointermove', { bubbles: true }))
const unhover = (el: HTMLElement) => el.dispatchEvent(new Event('pointerleave'))
const flush = () => vi.advanceTimersByTimeAsync(0)

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

describe.each(engines)('tooltip engine: %s', (_name, create) => {
  it('opens after the 400ms open delay on hover, not before', async () => {
    const t = track(mount(create))
    hover(t.trigger)
    await vi.advanceTimersByTimeAsync(399)
    expect(t.content.hasAttribute('hidden')).toBe(true)
    expect(t.trigger.getAttribute('data-state')).toBe('closed')

    await vi.advanceTimersByTimeAsync(1)
    expect(t.content.hasAttribute('hidden')).toBe(false)
    expect(t.content.getAttribute('data-state')).toBe('open')
    expect(t.trigger.getAttribute('data-state')).toBe('open')
    expect(t.trigger.getAttribute('data-expanded')).toBe('')
    expect(t.trigger.getAttribute('aria-describedby')).toBe(t.content.id)
    expect(t.openChanges).toEqual([true])
  })

  it('leaving the trigger closes after the 150ms close delay (visible while closing)', async () => {
    const t = track(mount(create))
    hover(t.trigger)
    await vi.advanceTimersByTimeAsync(400)
    unhover(t.trigger)
    await vi.advanceTimersByTimeAsync(100)
    // still "open" during the closing state
    expect(t.content.getAttribute('data-state')).toBe('open')
    await vi.advanceTimersByTimeAsync(50)
    expect(t.content.getAttribute('data-state')).toBe('closed')
    expect(t.content.hasAttribute('hidden')).toBe(true)
    expect(t.openChanges).toEqual([true, false])
  })

  it('leaving during the open delay cancels the pending open', async () => {
    const t = track(mount(create))
    hover(t.trigger)
    await vi.advanceTimersByTimeAsync(200)
    unhover(t.trigger)
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.content.hasAttribute('hidden')).toBe(true)
  })

  it('re-entering while closing reopens without a new delay', async () => {
    const t = track(mount(create))
    hover(t.trigger)
    await vi.advanceTimersByTimeAsync(400)
    unhover(t.trigger)
    await vi.advanceTimersByTimeAsync(100)
    hover(t.trigger)
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('open')
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.content.getAttribute('data-state')).toBe('open')
  })

  it('keyboard focus opens instantly; blur closes', async () => {
    const t = track(mount(create))
    pressTab()
    t.trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('open')
    expect(t.openChanges).toEqual([true])

    t.trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('closed')
    expect(t.openChanges).toEqual([true, false])
  })

  it('pointer-modality focus does not open', async () => {
    const t = track(mount(create))
    usePointer()
    t.trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.content.hasAttribute('hidden')).toBe(true)
  })

  it('Escape closes', async () => {
    const t = track(mount(create))
    t.behavior.api!.setOpen(true)
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('open')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('closed')
  })

  it('scrolling closes', async () => {
    const t = track(mount(create))
    t.behavior.api!.setOpen(true)
    await flush()
    window.dispatchEvent(new Event('scroll'))
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('closed')
  })

  it('click closes and hover stays closed until the pointer leaves', async () => {
    const t = track(mount(create))
    hover(t.trigger)
    await vi.advanceTimersByTimeAsync(400)
    expect(t.content.getAttribute('data-state')).toBe('open')

    t.trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('closed')

    // pointer never left: further moves must NOT reopen
    hover(t.trigger)
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.content.getAttribute('data-state')).toBe('closed')

    // after leaving, hover opens again (with delay)
    unhover(t.trigger)
    hover(t.trigger)
    await vi.advanceTimersByTimeAsync(400)
    expect(t.content.getAttribute('data-state')).toBe('open')
  })

  it('pointerdown closes', async () => {
    const t = track(mount(create))
    hover(t.trigger)
    await vi.advanceTimersByTimeAsync(400)
    t.trigger.dispatchEvent(new MouseEvent('pointerdown', { button: 0, bubbles: true }))
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('closed')
  })

  it('disabled ignores hover and focus', async () => {
    const t = track(mount(create, { disabled: true }))
    hover(t.trigger)
    pressTab()
    t.trigger.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.content.hasAttribute('hidden')).toBe(true)
  })

  it('only one tooltip is visible; switching to a warm trigger is instant', async () => {
    const a = track(mount(create))
    const b = track(mount(create))

    hover(a.trigger)
    await vi.advanceTimersByTimeAsync(400)
    expect(a.content.getAttribute('data-state')).toBe('open')

    // pointer moves to B while A is visible → B opens with NO delay
    unhover(a.trigger)
    hover(b.trigger)
    await flush()
    expect(b.content.getAttribute('data-state')).toBe('open')
    expect(b.content.getAttribute('data-instant')).toBe('')
    expect(a.content.getAttribute('data-state')).toBe('closed')
  })

  it('defaultOpen starts open and setOpen(false) closes immediately', async () => {
    const t = track(mount(create, { defaultOpen: true }))
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('open')
    t.behavior.api!.setOpen(false)
    await flush()
    expect(t.content.getAttribute('data-state')).toBe('closed')
    expect(t.openChanges).toEqual([false])
  })

  it('positions the positioner off-screen until open, then via --x/--y', async () => {
    const t = track(mount(create))
    expect(t.positioner.style.transform).toBe('translate3d(0, -100vh, 0)')
    expect(t.positioner.style.pointerEvents).toBe('none')

    t.behavior.api!.setOpen(true)
    await vi.advanceTimersByTimeAsync(50)
    expect(t.positioner.style.transform).toBe('translate3d(var(--x), var(--y), 0)')
    expect(t.positioner.style.getPropertyValue('--x')).toMatch(/px$/)
    expect(t.positioner.style.getPropertyValue('--y')).toMatch(/px$/)
    expect(t.content.getAttribute('data-side')).toBe('top')
    expect(t.content.getAttribute('data-placement')).toBe('top')
  })
})

describe('zag ↔ native attribute contract', () => {
  const attrsOf = (el: Element): Record<string, string> =>
    Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

  async function snapshot(create: () => TooltipBehavior) {
    const t = mount(create, { id: 'contract' })
    const closed = {
      trigger: attrsOf(t.trigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
    }
    t.behavior.api!.setOpen(true)
    await vi.advanceTimersByTimeAsync(50)
    const open = {
      trigger: attrsOf(t.trigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
    }
    t.behavior.api!.setOpen(false)
    await flush()
    const closedAgain = {
      trigger: attrsOf(t.trigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
    }
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, open, closedAgain }
  }

  it('emits identical attributes and styles in closed, open and reclosed states', async () => {
    // sequential mounts — same `id`, so the DOM ids collide if simultaneous
    const zag = await snapshot(createZagTooltipBehavior)
    const native = await snapshot(createTooltipBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.open).toEqual(zag.open)
    expect(native.closedAgain).toEqual(zag.closedAgain)
  })
})
