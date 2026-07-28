/**
 * Dual-engine collapsible suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: `bindPart` applying the prop bags.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createCollapsibleBehavior,
  createZagCollapsibleBehavior,
  type CollapsibleBehavior,
  type CollapsibleProps,
} from '../src/behaviors'

const engines = [
  ['native', createCollapsibleBehavior],
  ['zag', createZagCollapsibleBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: CollapsibleBehavior
  root: HTMLDivElement
  trigger: HTMLButtonElement
  content: HTMLDivElement
  openChanges: boolean[]
  dispose: () => void
}

function mount(create: () => CollapsibleBehavior, props: Partial<CollapsibleProps> = {}): Mounted {
  const behavior = create()
  const root = document.createElement('div')
  const trigger = document.createElement('button')
  const content = document.createElement('div')
  root.append(trigger, content)
  document.body.append(root)

  const openChanges: boolean[] = []
  behavior.init({
    id: `col-${++seq}`,
    dir: 'ltr',
    onOpenChange: (d: { open: boolean }) => openChanges.push(d.open),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, root, (api) => api.getRootProps()),
    bindPart(behavior, trigger, (api) => api.getTriggerProps()),
    bindPart(behavior, content, (api) => api.getContentProps()),
  ]
  return {
    behavior,
    root,
    trigger,
    content,
    openChanges,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      root.remove()
    },
  }
}

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
/** Flush microtasks only (Zag processes events via queueMicrotask) — no rafs. */
const micro = () => vi.advanceTimersByTimeAsync(0)
/** Run pending animation frames (jsdom has no CSS animations → settle instantly). */
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

describe.each(engines)('collapsible engine: %s', (_name, create) => {
  it('starts closed: content hidden, trigger collapsed', async () => {
    const t = track(mount(create))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.content.getAttribute('data-state')).toBe('closed')
    expect(t.trigger.getAttribute('aria-expanded')).toBe('false')
    expect(t.trigger.getAttribute('data-state')).toBe('closed')
    expect(t.root.getAttribute('data-state')).toBe('closed')
  })

  it('wires trigger to content via aria-controls', async () => {
    const t = track(mount(create))
    await settle()
    expect(t.trigger.getAttribute('aria-controls')).toBe(t.content.id)
    expect(t.content.id).toContain('content')
  })

  it('trigger click opens; content shows data-state=open while animating', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await micro()
    // before the animation-end frame the content is marked open (animatable)
    expect(t.content.getAttribute('data-state')).toBe('open')
    expect(t.content.hidden).toBe(false)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('true')
    expect(t.trigger.getAttribute('data-state')).toBe('open')
    expect(t.root.getAttribute('data-state')).toBe('open')
    expect(t.openChanges).toEqual([true])

    // jsdom has no CSS animation → the enter animation ends on the next frame
    // and Zag then drops data-state from the (still visible) open content
    await settle()
    expect(t.content.hasAttribute('data-state')).toBe(false)
    expect(t.content.hidden).toBe(false)
  })

  it('second click closes through the closing state', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    click(t.trigger)
    await micro()
    // closing: trigger reports closed, content still visible until animationend
    expect(t.trigger.getAttribute('data-state')).toBe('closed')
    expect(t.trigger.getAttribute('aria-expanded')).toBe('true')
    expect(t.content.getAttribute('data-state')).toBe('closed')
    expect(t.content.hidden).toBe(false)

    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('false')
    expect(t.openChanges).toEqual([true, false])
  })

  it('setOpen drives the same transitions as clicking', async () => {
    const t = track(mount(create))
    await settle()
    t.behavior.api!.setOpen(true)
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('true')
    t.behavior.api!.setOpen(false)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false])
  })

  it('defaultOpen starts open without an enter animation (no data-state)', async () => {
    const t = track(mount(create, { defaultOpen: true }))
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.content.hasAttribute('data-state')).toBe(false)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('true')
    expect(t.openChanges).toEqual([])
  })

  it('measures the content size into --height/--width for the keyframes', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.style.getPropertyValue('--height')).toMatch(/px$/)
    expect(t.content.style.getPropertyValue('--width')).toMatch(/px$/)
  })

  it('disabled ignores trigger clicks', async () => {
    const t = track(mount(create, { disabled: true }))
    await settle()
    expect(t.trigger.getAttribute('data-disabled')).toBe('')
    expect(t.content.getAttribute('data-disabled')).toBe('')
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([])
  })
})

describe('zag ↔ native collapsible attribute contract', () => {
  const attrsOf = (el: Element): Record<string, string> =>
    Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]))

  async function snapshot(create: () => CollapsibleBehavior) {
    const t = mount(create, { id: 'contract' })
    await vi.advanceTimersByTimeAsync(50)
    const closed = { root: attrsOf(t.root), trigger: attrsOf(t.trigger), content: attrsOf(t.content) }
    t.behavior.api!.setOpen(true)
    // microtasks only — Zag processes the send then; rafs (animation end) later
    await vi.advanceTimersByTimeAsync(0)
    const opening = {
      root: attrsOf(t.root),
      trigger: attrsOf(t.trigger),
      content: attrsOf(t.content),
    }
    await vi.advanceTimersByTimeAsync(50)
    const open = { root: attrsOf(t.root), trigger: attrsOf(t.trigger), content: attrsOf(t.content) }
    t.behavior.api!.setOpen(false)
    await vi.advanceTimersByTimeAsync(50)
    const closedAgain = {
      root: attrsOf(t.root),
      trigger: attrsOf(t.trigger),
      content: attrsOf(t.content),
    }
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, opening, open, closedAgain }
  }

  it('emits identical attributes and styles in closed, opening, open and reclosed states', async () => {
    // sequential mounts — same `id`, so the DOM ids collide if simultaneous
    const zag = await snapshot(createZagCollapsibleBehavior)
    const native = await snapshot(createCollapsibleBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.opening).toEqual(zag.opening)
    expect(native.open).toEqual(zag.open)
    expect(native.closedAgain).toEqual(zag.closedAgain)
  })
})
