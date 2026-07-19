/**
 * Dual-engine dialog suite — every behavior runs against BOTH the Zag
 * reference machine and the native engine (Phase 8 definition of done: the
 * suite passes on both before the facade swap). Parts are wired exactly the
 * way the registry component does it: trigger stays in the page, the overlay
 * subtree (backdrop + positioner > content) is portaled to <body>, and
 * `bindPart` applies the prop bags.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart } from '../src/adapter/zag-behavior'
import {
  createDialogBehavior,
  createZagDialogBehavior,
  type DialogBehavior,
  type DialogProps,
} from '../src/behaviors'

const engines = [
  ['native', createDialogBehavior],
  ['zag', createZagDialogBehavior],
] as const

let seq = 0

interface Mounted {
  behavior: DialogBehavior
  page: HTMLDivElement
  trigger: HTMLButtonElement
  backdrop: HTMLDivElement
  positioner: HTMLDivElement
  content: HTMLDivElement
  title: HTMLHeadingElement
  description: HTMLParagraphElement
  close: HTMLButtonElement
  openChanges: boolean[]
  dispose: () => void
}

interface MountOptions {
  props?: Partial<DialogProps>
  /** Mount without title/description parts (rendered-elements probing). */
  withHeader?: boolean
}

function mount(create: () => DialogBehavior, options: MountOptions = {}): Mounted {
  const { props = {}, withHeader = true } = options
  const behavior = create()

  // trigger lives in the page; the overlay subtree is "portaled" to <body>
  const page = document.createElement('div')
  const trigger = document.createElement('button')
  page.append(trigger)

  const overlay = document.createElement('div')
  const backdrop = document.createElement('div')
  const positioner = document.createElement('div')
  const content = document.createElement('div')
  const title = document.createElement('h2')
  const description = document.createElement('p')
  const close = document.createElement('button')
  if (withHeader) content.append(title, description)
  content.append(close)
  positioner.append(content)
  overlay.append(backdrop, positioner)
  document.body.append(page, overlay)

  const openChanges: boolean[] = []
  behavior.init({
    id: `dlg-${++seq}`,
    dir: 'ltr',
    onOpenChange: (d: { open: boolean }) => openChanges.push(d.open),
    ...props,
  })
  behavior.start()
  const disposers = [
    bindPart(behavior, trigger, (api) => api.getTriggerProps()),
    bindPart(behavior, backdrop, (api) => api.getBackdropProps()),
    bindPart(behavior, positioner, (api) => api.getPositionerProps()),
    bindPart(behavior, content, (api) => api.getContentProps()),
    bindPart(behavior, close, (api) => api.getCloseTriggerProps()),
    ...(withHeader
      ? [
          bindPart(behavior, title, (api) => api.getTitleProps()),
          bindPart(behavior, description, (api) => api.getDescriptionProps()),
        ]
      : []),
  ]
  return {
    behavior,
    page,
    trigger,
    backdrop,
    positioner,
    content,
    title,
    description,
    close,
    openChanges,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      page.remove()
      overlay.remove()
    },
  }
}

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
const pointerDown = (el: HTMLElement | Document) =>
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
/** Run pending frames/timeouts — effects attach one frame after opening. */
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
  document.body.removeAttribute('style')
  document.body.removeAttribute('data-scroll-lock')
  document.body.removeAttribute('data-inert')
})

describe.each(engines)('dialog engine: %s', (_name, create) => {
  it('starts closed: overlay hidden, trigger collapsed and wired to the content', async () => {
    const t = track(mount(create))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.backdrop.hidden).toBe(true)
    expect(t.content.getAttribute('data-state')).toBe('closed')
    expect(t.trigger.getAttribute('aria-expanded')).toBe('false')
    expect(t.trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(t.trigger.getAttribute('aria-controls')).toBe(t.content.id)
    expect(t.positioner.style.pointerEvents).toBe('none')
  })

  it('trigger click opens a modal dialog with the full ARIA wiring', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.content.getAttribute('data-state')).toBe('open')
    expect(t.content.getAttribute('role')).toBe('dialog')
    expect(t.content.getAttribute('aria-modal')).toBe('true')
    expect(t.content.getAttribute('tabindex')).toBe('-1')
    expect(t.content.getAttribute('aria-labelledby')).toBe(t.title.id)
    expect(t.content.getAttribute('aria-describedby')).toBe(t.description.id)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('true')
    expect(t.trigger.getAttribute('data-state')).toBe('open')
    expect(t.openChanges).toEqual([true])
  })

  it('drops aria-labelledby/aria-describedby when title/description are not rendered', async () => {
    const t = track(mount(create, { withHeader: false }))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.hasAttribute('aria-labelledby')).toBe(false)
    expect(t.content.hasAttribute('aria-describedby')).toBe(false)
  })

  it('locks body scroll, pointer-blocks and aria-hides the page below while open', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    expect(document.body.hasAttribute('data-scroll-lock')).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.getAttribute('data-inert')).toBe('')
    expect(document.body.style.pointerEvents).toBe('none')
    expect(t.content.style.pointerEvents).toBe('auto')
    expect(t.page.getAttribute('aria-hidden')).toBe('true')
    expect(t.page.hasAttribute('data-aria-hidden')).toBe(true)

    t.behavior.api!.setOpen(false)
    await settle()
    expect(document.body.hasAttribute('data-scroll-lock')).toBe(false)
    expect(document.body.hasAttribute('data-inert')).toBe(false)
    expect(document.body.style.pointerEvents).toBe('')
    expect(t.page.hasAttribute('aria-hidden')).toBe(false)
    expect(t.page.hasAttribute('data-aria-hidden')).toBe(false)
  })

  it('moves focus into the dialog on open and restores it to the trigger on close', async () => {
    const t = track(mount(create))
    await settle()
    t.trigger.focus()
    click(t.trigger)
    await settle()
    expect(t.content.contains(document.activeElement)).toBe(true)
    pressEscape()
    await settle()
    expect(document.activeElement).toBe(t.trigger)
  })

  it('Escape closes; outside pointerdown closes; close button closes', async () => {
    const t = track(mount(create))
    await settle()

    click(t.trigger)
    await settle()
    pressEscape()
    await settle()
    expect(t.content.hidden).toBe(true)

    click(t.trigger)
    await settle()
    pointerDown(t.backdrop)
    await settle()
    expect(t.content.hidden).toBe(true)

    click(t.trigger)
    await settle()
    click(t.close)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.openChanges).toEqual([true, false, true, false, true, false])
  })

  it('pointerdown on the trigger itself never counts as an outside press', async () => {
    const t = track(mount(create))
    await settle()
    click(t.trigger)
    await settle()
    pointerDown(t.trigger)
    await settle()
    // still open — only the trigger's own click handler toggles
    expect(t.content.hidden).toBe(false)
  })

  it('alertdialog: outside press is ignored, Escape still closes, close trigger gets focus', async () => {
    const t = track(
      mount(create, {
        props: { role: 'alertdialog', closeOnInteractOutside: false },
      }),
    )
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.getAttribute('role')).toBe('alertdialog')
    // jsdom can't satisfy focus-trap's tabbability display check, so the Zag
    // engine falls back to focusing the content; in real browsers both
    // engines focus the close trigger (covered by the browser pass)
    if (_name === 'native') expect(document.activeElement).toBe(t.close)
    else expect(t.content.contains(document.activeElement)).toBe(true)

    pointerDown(t.backdrop)
    await settle()
    expect(t.content.hidden).toBe(false)

    pressEscape()
    await settle()
    expect(t.content.hidden).toBe(true)
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

  it('defaultOpen starts open with effects attached and no onOpenChange echo', async () => {
    const t = track(mount(create, { props: { defaultOpen: true } }))
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(document.body.hasAttribute('data-scroll-lock')).toBe(true)
    expect(t.openChanges).toEqual([])
  })
})

describe('zag ↔ native dialog attribute contract', () => {
  /**
   * Zag's layer stack writes internal style metadata (`--layer-index`,
   * `--nested-layer-count`, `--z-index`) straight onto the elements — no
   * registry style consumes it, so the native engine doesn't emit it and the
   * comparison parses + strips it instead of comparing raw style strings.
   */
  const INTERNAL_STYLE_PROPS = new Set(['--layer-index', '--nested-layer-count', '--z-index'])

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

  async function snapshot(create: () => DialogBehavior) {
    const t = mount(create, { props: { id: 'contract' } })
    await vi.advanceTimersByTimeAsync(50)
    const partsOf = () => ({
      trigger: attrsOf(t.trigger),
      backdrop: attrsOf(t.backdrop),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
      title: attrsOf(t.title),
      description: attrsOf(t.description),
      close: attrsOf(t.close),
      body: {
        scrollLock: document.body.hasAttribute('data-scroll-lock'),
        inert: document.body.hasAttribute('data-inert'),
        overflow: document.body.style.overflow,
      },
    })
    const closed = partsOf()
    t.behavior.api!.setOpen(true)
    await vi.advanceTimersByTimeAsync(50)
    const open = partsOf()
    t.behavior.api!.setOpen(false)
    await vi.advanceTimersByTimeAsync(50)
    const closedAgain = partsOf()
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, open, closedAgain }
  }

  it('emits identical attributes and styles in closed, open and reclosed states', async () => {
    // sequential mounts — same `id`, so the DOM ids collide if simultaneous
    const zag = await snapshot(createZagDialogBehavior)
    const native = await snapshot(createDialogBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.open).toEqual(zag.open)
    expect(native.closedAgain).toEqual(zag.closedAgain)
  })
})
