/**
 * Dual-engine hover-card suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: trigger props on a host element, the
 * positioner > content subtree portaled to <body>.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createHoverCardBehavior,
  createZagHoverCardBehavior,
  type HoverCardBehavior,
  type HoverCardProps,
} from '../src/behaviors'

const engines = [
  ['native', createHoverCardBehavior],
  ['zag', createZagHoverCardBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: HoverCardBehavior
  trigger: HTMLAnchorElement
  positioner: HTMLDivElement
  content: HTMLDivElement
  openChanges: boolean[]
  dispose: () => void
}

function mount(create: () => HoverCardBehavior, props: Partial<HoverCardProps> = {}): Mounted {
  const behavior = create()
  const trigger = document.createElement('a')
  trigger.href = '#'
  const positioner = document.createElement('div')
  const content = document.createElement('div')
  positioner.append(content)
  document.body.append(trigger, positioner)

  const openChanges: boolean[] = []
  behavior.init({
    id: `hc-${++seq}`,
    dir: 'ltr',
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
      disposers.forEach((d) => d())
      behavior.stop()
      trigger.remove()
      positioner.remove()
    },
  }
}

const enter = (el: HTMLElement) => el.dispatchEvent(new Event('pointerenter'))
const leave = (el: HTMLElement) => el.dispatchEvent(new Event('pointerleave'))
const focusIn = (el: HTMLElement) => el.dispatchEvent(new Event('focusin', { bubbles: true }))
const focusOut = (el: HTMLElement) => el.dispatchEvent(new Event('focusout', { bubbles: true }))
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
/** Flush microtasks + pending rafs without hitting the open/close delays. */
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

describe.each(engines)('hover-card engine: %s', (_name, create) => {
  it('opens after the 600ms hover delay, not before', async () => {
    const t = track(mount(create))
    enter(t.trigger)
    await vi.advanceTimersByTimeAsync(500)
    expect(t.content.hidden).toBe(true)
    await vi.advanceTimersByTimeAsync(150)
    expect(t.content.hidden).toBe(false)
    expect(t.content.getAttribute('data-state')).toBe('open')
    expect(t.trigger.getAttribute('data-state')).toBe('open')
    expect(t.openChanges).toEqual([true])
  })

  it('leaving during the open delay cancels (Zag fires onOpenChange(false))', async () => {
    const t = track(mount(create))
    enter(t.trigger)
    await vi.advanceTimersByTimeAsync(300)
    leave(t.trigger)
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([false])
  })

  it('closes 300ms after leaving; content stays visible while closing', async () => {
    const t = track(mount(create))
    enter(t.trigger)
    await vi.advanceTimersByTimeAsync(700)
    leave(t.trigger)
    await vi.advanceTimersByTimeAsync(150)
    expect(t.content.hidden).toBe(false)
    await vi.advanceTimersByTimeAsync(250)
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false])
  })

  it('re-entering the content while closing keeps it open without extra events', async () => {
    const t = track(mount(create))
    enter(t.trigger)
    await vi.advanceTimersByTimeAsync(700)
    leave(t.trigger)
    await vi.advanceTimersByTimeAsync(150)
    enter(t.content)
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.content.hidden).toBe(false)
    expect(t.openChanges).toEqual([true])
  })

  it('focus opens after the delay; blur closes a focus-opened card', async () => {
    const t = track(mount(create))
    focusIn(t.trigger)
    await vi.advanceTimersByTimeAsync(700)
    expect(t.content.hidden).toBe(false)
    focusOut(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false])
  })

  it('blur does NOT close a pointer-opened card', async () => {
    const t = track(mount(create))
    enter(t.trigger)
    await vi.advanceTimersByTimeAsync(700)
    focusOut(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(false)
  })

  it('Escape and outside pointerdown dismiss an open card', async () => {
    const t = track(mount(create))
    enter(t.trigger)
    await vi.advanceTimersByTimeAsync(700)
    pressEscape()
    await settle()
    expect(t.content.hidden).toBe(true)

    enter(t.trigger)
    await vi.advanceTimersByTimeAsync(700)
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false, true, false])
  })

  it('setOpen(true) goes through the open delay (Zag semantics); setOpen(false) is instant', async () => {
    const t = track(mount(create))
    t.behavior.api!.setOpen(true)
    await settle()
    expect(t.content.hidden).toBe(true)
    await vi.advanceTimersByTimeAsync(700)
    expect(t.content.hidden).toBe(false)
    t.behavior.api!.setOpen(false)
    await settle()
    expect(t.content.hidden).toBe(true)
  })

  it('disabled ignores every activation', async () => {
    const t = track(mount(create, { disabled: true }))
    enter(t.trigger)
    focusIn(t.trigger)
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([])
  })
})

describe('zag ↔ native hover-card attribute contract', () => {
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

  async function snapshot(create: () => HoverCardBehavior) {
    const t = mount(create, { id: 'contract' })
    await vi.advanceTimersByTimeAsync(50)
    const partsOf = () => ({
      trigger: attrsOf(t.trigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
    })
    const closed = partsOf()
    enter(t.trigger)
    await vi.advanceTimersByTimeAsync(50)
    const opening = partsOf()
    await vi.advanceTimersByTimeAsync(700)
    const open = partsOf()
    leave(t.trigger)
    await vi.advanceTimersByTimeAsync(50)
    const closing = partsOf()
    await vi.advanceTimersByTimeAsync(400)
    const closedAgain = partsOf()
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, opening, open, closing, closedAgain }
  }

  it('emits identical attributes and styles across the full open/close cycle', async () => {
    const zag = await snapshot(createZagHoverCardBehavior)
    const native = await snapshot(createHoverCardBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.opening).toEqual(zag.opening)
    expect(native.open).toEqual(zag.open)
    expect(native.closing).toEqual(zag.closing)
    expect(native.closedAgain).toEqual(zag.closedAgain)
  })
})
