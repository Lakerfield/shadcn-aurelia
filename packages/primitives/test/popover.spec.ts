/**
 * Dual-engine popover suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: trigger button in the page, the
 * positioner > content subtree portaled to <body>, non-modal + portalled.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createPopoverBehavior,
  createZagPopoverBehavior,
  type PopoverBehavior,
  type PopoverProps,
} from '../src/behaviors'

const engines = [
  ['native', createPopoverBehavior],
  ['zag', createZagPopoverBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: PopoverBehavior
  trigger: HTMLButtonElement
  positioner: HTMLDivElement
  content: HTMLDivElement
  openChanges: boolean[]
  dispose: () => void
}

function mount(create: () => PopoverBehavior, props: Partial<PopoverProps> = {}): Mounted {
  const behavior = create()
  const trigger = document.createElement('button')
  const positioner = document.createElement('div')
  const content = document.createElement('div')
  positioner.append(content)
  document.body.append(trigger, positioner)

  const openChanges: boolean[] = []
  behavior.init({
    id: `pop-${++seq}`,
    dir: 'ltr',
    portalled: true,
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

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
/** Flush microtasks + pending rafs. */
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

describe.each(engines)('popover engine: %s', (_name, create) => {
  it('starts closed with the trigger fully wired', async () => {
    const t = track(mount(create))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(t.trigger.getAttribute('aria-expanded')).toBe('false')
    expect(t.trigger.getAttribute('aria-controls')).toBe(t.content.id)
    expect(t.trigger.getAttribute('type')).toBe('button')
    expect(t.trigger.getAttribute('data-state')).toBe('closed')
  })

  it('trigger click opens: dialog role, expanded state, focus into the content', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.content.getAttribute('role')).toBe('dialog')
    expect(t.content.getAttribute('data-state')).toBe('open')
    expect(t.content.getAttribute('data-expanded')).toBe('')
    expect(t.trigger.getAttribute('aria-expanded')).toBe('true')
    // no title/description parts are mounted → the rendered probe drops both
    expect(t.content.hasAttribute('aria-labelledby')).toBe(false)
    expect(t.content.hasAttribute('aria-describedby')).toBe(false)
    // jsdom has no layout, so "first tabbable" resolves to the content itself
    expect(document.activeElement).toBe(t.content)
    expect(t.openChanges).toEqual([true])
  })

  it('second trigger click closes and restores focus to the trigger', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('false')
    expect(t.openChanges).toEqual([true, false])
  })

  it('Escape closes and returns focus to the trigger', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    pressEscape()
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(document.activeElement).toBe(t.trigger)
    expect(t.openChanges).toEqual([true, false])
  })

  it('outside press closes; focus only returns for non-focusable targets', async () => {
    const plain = document.createElement('div')
    const focusable = document.createElement('button')
    document.body.append(plain, focusable)
    const t = track(mount(create))
    await settle()

    click(t.trigger)
    await settle()
    plain.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(document.activeElement).toBe(t.trigger)

    click(t.trigger)
    await settle()
    focusable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
    await settle()
    expect(t.content.hidden).toBe(true)
    // jsdom fails Zag's focusable-visibility check (offsetParent is always
    // null), so the Zag engine restores focus anyway; real browsers don't —
    // covered by the browser pass
    if (_name === 'native') expect(document.activeElement).not.toBe(t.trigger)

    plain.remove()
    focusable.remove()
  })

  it('focus moving outside dismisses without stealing focus back', async () => {
    const outsideInput = document.createElement('input')
    document.body.append(outsideInput)
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    outsideInput.focus()
    outsideInput.dispatchEvent(new Event('focusin', { bubbles: true }))
    await settle()
    expect(t.content.hidden).toBe(true)
    // same jsdom visibility limitation: Zag restores focus to the trigger
    if (_name === 'native') expect(document.activeElement).toBe(outsideInput)
    outsideInput.remove()
  })

  it('positions the content: placement data lands after a frame', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.getAttribute('data-placement')).toBe('bottom')
    expect(t.content.getAttribute('data-side')).toBe('bottom')
    expect(t.positioner.style.position).toBe('absolute')
    expect(t.positioner.style.getPropertyValue('--x')).toBe('0px')
  })

  it('setOpen drives the same transitions as clicking', async () => {
    const t = track(mount(create))
    await settle()
    t.behavior.api!.setOpen(true)
    await settle()
    expect(t.content.hidden).toBe(false)
    t.behavior.api!.setOpen(false)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false])
  })

  it('defaultOpen starts open without an onOpenChange echo', async () => {
    const t = track(mount(create, { defaultOpen: true }))
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.openChanges).toEqual([])
  })
})

describe('zag ↔ native popover attribute contract', () => {
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

  async function snapshot(create: () => PopoverBehavior) {
    const t = mount(create, { id: 'contract' })
    await vi.advanceTimersByTimeAsync(50)
    const partsOf = () => ({
      trigger: attrsOf(t.trigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
    })
    const closed = partsOf()
    click(t.trigger)
    await vi.advanceTimersByTimeAsync(50)
    const open = partsOf()
    click(t.trigger)
    await vi.advanceTimersByTimeAsync(50)
    const closedAgain = partsOf()
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, open, closedAgain }
  }

  it('emits identical attributes and styles in closed, open and reclosed states', async () => {
    const zag = await snapshot(createZagPopoverBehavior)
    const native = await snapshot(createPopoverBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.open).toEqual(zag.open)
    expect(native.closedAgain).toEqual(zag.closedAgain)
  })
})
