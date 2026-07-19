/**
 * Dual-engine menu suite — every behavior runs against BOTH the Zag reference
 * machine and the native engine (Phase 8 definition of done: the suite passes
 * on both before the facade swap). Parts are wired exactly the way the
 * registry components do it: trigger in the page, positioner > content
 * portaled to <body>, items bound through the same prop-bag getters, submenus
 * linked via setParent/setChild, context menus through the context trigger.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { bindPart, type BehaviorSource } from '../src/adapter/zag-behavior'
import {
  createMenuBehavior,
  createZagMenuBehavior,
  type MenuApi,
  type MenuBehavior,
  type MenuProps,
} from '../src/behaviors'

const engines = [
  ['native', createMenuBehavior],
  ['zag', createZagMenuBehavior],
] as const

let seq = 0

interface ItemSpec {
  value: string
  label?: string
  disabled?: boolean
  valueText?: string
  closeOnSelect?: boolean
}

interface Mounted {
  behavior: MenuBehavior
  trigger: HTMLButtonElement
  positioner: HTMLDivElement
  content: HTMLDivElement
  items: Map<string, HTMLDivElement>
  openChanges: boolean[]
  selections: string[]
  dispose: () => void
}

function mount(
  create: () => MenuBehavior,
  opts: { props?: Partial<MenuProps>; items?: ItemSpec[] } = {},
): Mounted {
  const behavior = create()
  const trigger = document.createElement('button')
  const positioner = document.createElement('div')
  const content = document.createElement('div')
  positioner.append(content)
  document.body.append(trigger, positioner)

  const openChanges: boolean[] = []
  const selections: string[] = []
  behavior.init({
    id: `menu-${++seq}`,
    dir: 'ltr',
    onOpenChange: (d: { open: boolean }) => openChanges.push(d.open),
    onSelect: (d: { value: string }) => selections.push(d.value),
    ...opts.props,
  })
  behavior.start()

  const disposers = [
    bindPart(behavior, trigger, (api) => api.getTriggerProps()),
    bindPart(behavior, positioner, (api) => api.getPositionerProps()),
    bindPart(behavior, content, (api) => api.getContentProps()),
  ]
  const items = new Map<string, HTMLDivElement>()
  for (const spec of opts.items ?? []) {
    const el = document.createElement('div')
    el.textContent = spec.label ?? spec.value
    content.append(el)
    items.set(spec.value, el)
    disposers.push(
      bindPart(behavior, el, (api) =>
        api.getItemProps({
          value: spec.value,
          disabled: spec.disabled || undefined,
          valueText: spec.valueText,
          closeOnSelect: spec.closeOnSelect,
        }),
      ),
    )
  }
  return {
    behavior,
    trigger,
    positioner,
    content,
    items,
    openChanges,
    selections,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      trigger.remove()
      positioner.remove()
    },
  }
}

/** MouseEvent with the pointerType the engines gate on. */
const pointerEvent = (type: string, opts: { x?: number; y?: number; pointerType?: string } = {}) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: opts.x ?? 0,
    clientY: opts.y ?? 0,
  })
  Object.defineProperty(event, 'pointerType', { value: opts.pointerType ?? 'mouse' })
  return event
}

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
const focusIn = (el: HTMLElement) => {
  el.focus()
  el.dispatchEvent(new Event('focusin', { bubbles: true }))
}
const keydown = (el: HTMLElement, key: string) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
/**
 * Flush microtasks + pending rafs without hitting the machine delays. Zag's
 * dismissable attaches its listeners after two nested rafs + setTimeout(0)
 * (~32ms of fake time), so this must stay well above that.
 */
const settle = () => vi.advanceTimersByTimeAsync(50)

const mounted: Array<{ dispose: () => void }> = []
const track = <T extends { dispose: () => void }>(m: T): T => (mounted.push(m), m)

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

const FRUIT: ItemSpec[] = [{ value: 'apple' }, { value: 'banana' }, { value: 'cherry' }]

describe.each(engines)('menu engine: %s', (_name, create) => {
  it('starts closed with the trigger fully wired', async () => {
    const t = track(mount(create, { items: FRUIT }))
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(t.trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(t.trigger.getAttribute('aria-controls')).toBe(t.content.id)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('false')
    expect(t.trigger.getAttribute('data-state')).toBe('closed')
    expect(t.content.getAttribute('role')).toBe('menu')
    expect(t.items.get('apple')!.getAttribute('role')).toBe('menuitem')
    expect(t.items.get('apple')!.id).toBe(`${t.content.id.split(':')[1]}/apple`)
  })

  it('trigger click opens (focus lands on the content) and re-click closes', async () => {
    const t = track(mount(create, { items: FRUIT }))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.trigger.getAttribute('aria-expanded')).toBe('true')
    expect(t.content.getAttribute('data-state')).toBe('open')
    expect(document.activeElement).toBe(t.content)
    click(t.trigger)
    await settle()
    expect(t.content.hidden).toBe(true)
    expect(document.activeElement).toBe(t.trigger)
    expect(t.openChanges).toEqual([true, false])
  })

  it('ArrowDown on the focused trigger opens and highlights the first item', async () => {
    const t = track(mount(create, { items: FRUIT }))
    await settle()
    focusIn(t.trigger)
    keydown(t.trigger, 'ArrowDown')
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.items.get('apple')!.hasAttribute('data-highlighted')).toBe(true)
    expect(t.content.getAttribute('aria-activedescendant')).toBe(t.items.get('apple')!.id)
  })

  it('ArrowUp on the focused trigger opens and highlights the last item', async () => {
    const t = track(mount(create, { items: FRUIT }))
    await settle()
    focusIn(t.trigger)
    keydown(t.trigger, 'ArrowUp')
    await settle()
    expect(t.items.get('cherry')!.hasAttribute('data-highlighted')).toBe(true)
  })

  it('arrow keys navigate without looping; Home/End jump; disabled items are skipped', async () => {
    const t = track(
      mount(create, {
        items: [{ value: 'apple' }, { value: 'blocked', disabled: true }, { value: 'cherry' }],
      }),
    )
    await settle()
    focusIn(t.trigger)
    keydown(t.trigger, 'ArrowDown')
    await settle()
    keydown(t.content, 'ArrowDown')
    await settle()
    // disabled item is not a candidate — highlight lands on cherry
    expect(t.items.get('cherry')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.content, 'ArrowDown')
    await settle()
    // loopFocus is false → stays on the last item
    expect(t.items.get('cherry')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.content, 'Home')
    await settle()
    expect(t.items.get('apple')!.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.content, 'End')
    await settle()
    expect(t.items.get('cherry')!.hasAttribute('data-highlighted')).toBe(true)
  })

  it('typeahead highlights the first match', async () => {
    const t = track(mount(create, { items: FRUIT }))
    await settle()
    click(t.trigger)
    await settle()
    keydown(t.content, 'b')
    await settle()
    expect(t.items.get('banana')!.hasAttribute('data-highlighted')).toBe(true)
    // within the 350ms window the query extends: "ba" still matches banana
    keydown(t.content, 'a')
    await settle()
    expect(t.items.get('banana')!.hasAttribute('data-highlighted')).toBe(true)
  })

  it('Enter selects the highlighted item, fires onSelect + menu:select, and closes', async () => {
    const t = track(mount(create, { items: FRUIT }))
    await settle()
    const domSelections: string[] = []
    t.items
      .get('banana')!
      .addEventListener('menu:select', (e) => domSelections.push((e as CustomEvent).detail.value))
    focusIn(t.trigger)
    keydown(t.trigger, 'ArrowDown')
    await settle()
    keydown(t.content, 'ArrowDown')
    await settle()
    keydown(t.content, 'Enter')
    await settle()
    expect(t.selections).toEqual(['banana'])
    expect(domSelections).toEqual(['banana'])
    expect(t.content.hidden).toBe(true)
    expect(document.activeElement).toBe(t.trigger)
  })

  it('pointer select: pointerdown highlights, click selects and closes', async () => {
    const t = track(mount(create, { items: FRUIT }))
    await settle()
    click(t.trigger)
    await settle()
    const item = t.items.get('cherry')!
    item.dispatchEvent(pointerEvent('pointerdown'))
    await settle()
    expect(item.hasAttribute('data-highlighted')).toBe(true)
    click(item)
    await settle()
    expect(t.selections).toEqual(['cherry'])
    expect(t.content.hidden).toBe(true)
  })

  it('closeOnSelect:false items select without closing', async () => {
    const t = track(
      mount(create, { items: [{ value: 'apple' }, { value: 'sticky', closeOnSelect: false }] }),
    )
    await settle()
    click(t.trigger)
    await settle()
    const item = t.items.get('sticky')!
    item.dispatchEvent(pointerEvent('pointerdown'))
    await settle()
    click(item)
    await settle()
    expect(t.selections).toEqual(['sticky'])
    expect(t.content.hidden).toBe(false)
  })

  it('pointermove highlights; pointerleave clears once pointer history is established', async () => {
    const t = track(mount(create, { items: FRUIT }))
    await settle()
    click(t.trigger)
    await settle()
    const apple = t.items.get('apple')!
    const banana = t.items.get('banana')!
    apple.dispatchEvent(pointerEvent('pointermove'))
    await settle()
    expect(apple.hasAttribute('data-highlighted')).toBe(true)
    // Zag quirk: the leave guard reads event.previous() — the event BEFORE
    // the last one — so a single hover + leave does NOT clear the highlight
    apple.dispatchEvent(pointerEvent('pointerleave'))
    await settle()
    expect(apple.hasAttribute('data-highlighted')).toBe(true)
    banana.dispatchEvent(pointerEvent('pointermove'))
    await settle()
    expect(banana.hasAttribute('data-highlighted')).toBe(true)
    banana.dispatchEvent(pointerEvent('pointerleave'))
    await settle()
    expect(banana.hasAttribute('data-highlighted')).toBe(false)
  })

  it('Escape closes and returns focus to the trigger', async () => {
    const t = track(mount(create, { items: FRUIT }))
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
    const t = track(mount(create, { items: FRUIT }))
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
    // jsdom fails Zag's focusable-visibility probe (offsetParent is always
    // null), so the Zag engine restores focus anyway; real browsers don't —
    // covered by the browser pass
    if (_name === 'native') expect(document.activeElement).not.toBe(t.trigger)

    plain.remove()
    focusable.remove()
  })

  it('setOpen drives the same transitions as clicking (menubar coordinator path)', async () => {
    const t = track(mount(create, { items: FRUIT }))
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
    const t = track(mount(create, { props: { defaultOpen: true }, items: FRUIT }))
    await settle()
    expect(t.content.hidden).toBe(false)
    expect(t.openChanges).toEqual([])
  })
})

/* ------------------------------------------------------------- option items */

describe.each(engines)('menu option items: %s', (_name, create) => {
  function mountWithCheckbox(create: () => MenuBehavior) {
    const t = mount(create, { items: [{ value: 'apple' }] })
    const optState = { checked: false }
    const optionEl = document.createElement('div')
    optionEl.textContent = 'Show toolbar'
    const indicatorEl = document.createElement('span')
    optionEl.append(indicatorEl)
    t.content.append(optionEl)
    const disposers = [
      bindPart(t.behavior, optionEl, (api) =>
        api.getOptionItemProps({
          type: 'checkbox',
          value: 'toolbar',
          checked: optState.checked,
          closeOnSelect: false,
          onCheckedChange: (checked: boolean) => {
            optState.checked = checked
            t.behavior.notify()
          },
        }),
      ),
      bindPart(t.behavior, indicatorEl, (api) =>
        api.getItemIndicatorProps({ value: 'toolbar', checked: optState.checked }),
      ),
    ]
    const dispose = t.dispose
    t.dispose = () => {
      disposers.forEach((d) => d())
      dispose()
    }
    return { ...t, dispose: t.dispose, optionEl, indicatorEl, optState }
  }

  it('checkbox item toggles through onCheckedChange and stays open', async () => {
    const t = track(mountWithCheckbox(create))
    await settle()
    click(t.trigger)
    await settle()
    expect(t.optionEl.getAttribute('role')).toBe('menuitemcheckbox')
    expect(t.optionEl.getAttribute('aria-checked')).toBe('false')
    expect(t.optionEl.getAttribute('data-state')).toBe('unchecked')
    expect(t.indicatorEl.hidden).toBe(true)

    t.optionEl.dispatchEvent(pointerEvent('pointerdown'))
    await settle()
    click(t.optionEl)
    await settle()
    expect(t.optState.checked).toBe(true)
    expect(t.optionEl.getAttribute('aria-checked')).toBe('true')
    expect(t.optionEl.getAttribute('data-state')).toBe('checked')
    expect(t.indicatorEl.hidden).toBe(false)
    expect(t.indicatorEl.getAttribute('data-state')).toBe('checked')
    expect(t.content.hidden).toBe(false)

    click(t.optionEl)
    await settle()
    expect(t.optState.checked).toBe(false)
  })
})

/* ---------------------------------------------------------------- submenus */

interface MountedSub {
  parent: Mounted
  child: MenuBehavior
  triggerItem: HTMLDivElement
  childPositioner: HTMLDivElement
  childContent: HTMLDivElement
  childItems: Map<string, HTMLDivElement>
  dispose: () => void
}

/** The registry's pairSource: trigger-item needs parent AND child apis. */
function pairSource(
  parent: BehaviorSource<MenuApi>,
  child: BehaviorSource<MenuApi>,
): BehaviorSource<[MenuApi, MenuApi]> {
  return {
    get api(): [MenuApi, MenuApi] | null {
      return parent.api && child.api ? [parent.api, child.api] : null
    },
    subscribe(listener: () => void): () => void {
      const u1 = parent.subscribe(listener)
      const u2 = child.subscribe(listener)
      return () => {
        u1()
        u2()
      }
    },
  }
}

async function mountSubmenu(create: () => MenuBehavior): Promise<MountedSub> {
  const parent = mount(create, { items: [{ value: 'apple' }] })
  const child = create()
  child.init({ id: `menu-sub-${++seq}`, dir: 'ltr' })
  child.start()

  const triggerItem = document.createElement('div')
  triggerItem.textContent = 'More tools'
  parent.content.append(triggerItem)
  const childPositioner = document.createElement('div')
  const childContent = document.createElement('div')
  childPositioner.append(childContent)
  document.body.append(childPositioner)

  const disposers = [
    bindPart(pairSource(parent.behavior, child), triggerItem, ([parentApi, childApi]) =>
      parentApi.getTriggerItemProps(childApi),
    ),
    bindPart(child, childPositioner, (api) => api.getPositionerProps()),
    bindPart(child, childContent, (api) => api.getContentProps()),
  ]
  const childItems = new Map<string, HTMLDivElement>()
  for (const value of ['zoom', 'print']) {
    const el = document.createElement('div')
    el.textContent = value
    childContent.append(el)
    childItems.set(value, el)
    disposers.push(bindPart(child, el, (api) => api.getItemProps({ value })))
  }

  parent.behavior.api!.setChild(child.service)
  child.api!.setParent(parent.behavior.service)
  await settle()

  return {
    parent,
    child,
    triggerItem,
    childPositioner,
    childContent,
    childItems,
    dispose() {
      disposers.forEach((d) => d())
      child.stop()
      childPositioner.remove()
      parent.dispose()
    },
  }
}

describe.each(engines)('menu submenus: %s', (_name, create) => {
  it('merges the trigger-item bag: menuitem owned by the parent, controlling the child', async () => {
    const t = track(await mountSubmenu(create))
    await settle()
    expect(t.triggerItem.getAttribute('data-part')).toBe('trigger-item')
    expect(t.triggerItem.getAttribute('role')).toBe('menuitem')
    expect(t.triggerItem.getAttribute('data-ownedby')).toBe(t.parent.content.id)
    expect(t.triggerItem.getAttribute('aria-controls')).toBe(t.childContent.id)
    expect(t.triggerItem.getAttribute('aria-haspopup')).toBe('menu')
    expect(t.triggerItem.id).toBe(t.triggerItem.getAttribute('data-value'))
  })

  it('ArrowRight on the highlighted trigger-item opens the child with its first item highlighted; ArrowLeft returns', async () => {
    const t = track(await mountSubmenu(create))
    await settle()
    focusIn(t.parent.trigger)
    keydown(t.parent.trigger, 'ArrowDown')
    await settle()
    keydown(t.parent.content, 'ArrowDown')
    await settle()
    expect(t.triggerItem.hasAttribute('data-highlighted')).toBe(true)
    keydown(t.parent.content, 'ArrowRight')
    await settle()
    expect(t.childContent.hidden).toBe(false)
    expect(t.childItems.get('zoom')!.hasAttribute('data-highlighted')).toBe(true)
    expect(t.triggerItem.getAttribute('data-state')).toBe('open')

    keydown(t.childContent, 'ArrowLeft')
    await settle()
    expect(t.childContent.hidden).toBe(true)
    expect(t.parent.content.hidden).toBe(false)
  })

  it('hovering the trigger-item opens the child after the 200ms delay; leaving closes it after the grace period', async () => {
    const t = track(await mountSubmenu(create))
    await settle()
    click(t.parent.trigger)
    await settle()
    t.triggerItem.dispatchEvent(pointerEvent('pointermove'))
    await vi.advanceTimersByTimeAsync(100)
    expect(t.childContent.hidden).toBe(true)
    await vi.advanceTimersByTimeAsync(150)
    expect(t.childContent.hidden).toBe(false)

    t.triggerItem.dispatchEvent(pointerEvent('pointerleave'))
    await vi.advanceTimersByTimeAsync(150)
    expect(t.childContent.hidden).toBe(true)
    expect(t.parent.content.hidden).toBe(false)
  })

  it('selecting a child item closes the whole tree', async () => {
    const t = track(await mountSubmenu(create))
    await settle()
    focusIn(t.parent.trigger)
    keydown(t.parent.trigger, 'ArrowDown')
    await settle()
    keydown(t.parent.content, 'ArrowDown')
    await settle()
    keydown(t.parent.content, 'ArrowRight')
    await settle()
    expect(t.childContent.hidden).toBe(false)
    const item = t.childItems.get('zoom')!
    item.dispatchEvent(pointerEvent('pointerdown'))
    await settle()
    click(item)
    await settle()
    expect(t.childContent.hidden).toBe(true)
    expect(t.parent.content.hidden).toBe(true)
  })

  it('Escape inside the child closes the whole tree', async () => {
    const t = track(await mountSubmenu(create))
    await settle()
    focusIn(t.parent.trigger)
    keydown(t.parent.trigger, 'ArrowDown')
    await settle()
    keydown(t.parent.content, 'ArrowDown')
    await settle()
    keydown(t.parent.content, 'ArrowRight')
    await settle()
    pressEscape()
    await settle()
    expect(t.parent.content.hidden).toBe(true)
    expect(t.childContent.hidden).toBe(true)
  })
})

/* ------------------------------------------------------------- context menu */

interface MountedContext {
  behavior: MenuBehavior
  ctxTrigger: HTMLDivElement
  positioner: HTMLDivElement
  content: HTMLDivElement
  dispose: () => void
}

function mountContext(create: () => MenuBehavior): MountedContext {
  const behavior = create()
  const ctxTrigger = document.createElement('div')
  const positioner = document.createElement('div')
  const content = document.createElement('div')
  positioner.append(content)
  document.body.append(ctxTrigger, positioner)
  behavior.init({ id: `ctx-${++seq}`, dir: 'ltr' })
  behavior.start()
  const item = document.createElement('div')
  item.textContent = 'Back'
  content.append(item)
  const disposers = [
    bindPart(behavior, ctxTrigger, (api) => api.getContextTriggerProps()),
    bindPart(behavior, positioner, (api) => api.getPositionerProps()),
    bindPart(behavior, content, (api) => api.getContentProps()),
    bindPart(behavior, item, (api) => api.getItemProps({ value: 'back' })),
  ]
  return {
    behavior,
    ctxTrigger,
    positioner,
    content,
    dispose() {
      disposers.forEach((d) => d())
      behavior.stop()
      ctxTrigger.remove()
      positioner.remove()
    },
  }
}

describe.each(engines)('context menu: %s', (_name, create) => {
  it('opens on contextmenu, labelled by the context trigger, and Escape closes', async () => {
    const t = track(mountContext(create))
    await settle()
    expect(t.ctxTrigger.getAttribute('data-state')).toBe('closed')
    expect(t.ctxTrigger.style.userSelect).toBe('none')
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 120,
      clientY: 80,
    })
    t.ctxTrigger.dispatchEvent(event)
    await settle()
    expect(event.defaultPrevented).toBe(true)
    expect(t.content.hidden).toBe(false)
    expect(t.ctxTrigger.getAttribute('data-state')).toBe('open')
    expect(t.content.getAttribute('aria-labelledby')).toBe(t.ctxTrigger.id)
    pressEscape()
    await settle()
    expect(t.content.hidden).toBe(true)
  })

  it('long-press opens after 700ms; movement cancels', async () => {
    const t = track(mountContext(create))
    await settle()
    t.ctxTrigger.dispatchEvent(pointerEvent('pointerdown', { pointerType: 'touch' }))
    await vi.advanceTimersByTimeAsync(500)
    expect(t.content.hidden).toBe(true)
    await vi.advanceTimersByTimeAsync(300)
    expect(t.content.hidden).toBe(false)
    pressEscape()
    await settle()

    t.ctxTrigger.dispatchEvent(pointerEvent('pointerdown', { pointerType: 'touch' }))
    await vi.advanceTimersByTimeAsync(200)
    t.ctxTrigger.dispatchEvent(pointerEvent('pointermove', { pointerType: 'touch' }))
    await vi.advanceTimersByTimeAsync(800)
    expect(t.content.hidden).toBe(true)
  })
})

/* --------------------------------------------------------------- contract */

describe('zag ↔ native menu attribute contract', () => {
  /** Zag's layer stack writes internal style + attribute metadata — strip. */
  const INTERNAL_STYLE_PROPS = new Set([
    '--layer-index',
    '--nested-layer-count',
    '--z-index',
    'pointer-events',
  ])
  const INTERNAL_ATTRS = new Set(['style', 'data-nested', 'data-has-nested'])

  const attrsOf = (el: Element): Record<string, unknown> => {
    const attrs: Record<string, unknown> = Object.fromEntries(
      [...el.attributes].filter((a) => !INTERNAL_ATTRS.has(a.name)).map((a) => [a.name, a.value]),
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

  async function snapshot(create: () => MenuBehavior) {
    const t = mount(create, {
      props: { id: 'contract', positioning: { placement: 'bottom-start', gutter: 4 } },
      items: [
        { value: 'apple' },
        { value: 'blocked', disabled: true },
        { value: 'named', valueText: 'Named item' },
      ],
    })
    // full anatomy: group, separator, checkbox option item + indicator
    const group = document.createElement('div')
    const separator = document.createElement('div')
    const option = document.createElement('div')
    option.textContent = 'Option'
    const indicator = document.createElement('span')
    option.append(indicator)
    t.content.append(group, separator, option)
    const disposers = [
      bindPart(t.behavior, group, (api) => api.getItemGroupProps({ id: 'g1' })),
      bindPart(t.behavior, separator, (api) => api.getSeparatorProps()),
      bindPart(t.behavior, option, (api) =>
        api.getOptionItemProps({ type: 'checkbox', value: 'opt', checked: true }),
      ),
      bindPart(t.behavior, indicator, (api) =>
        api.getItemIndicatorProps({ value: 'opt', checked: true }),
      ),
    ]
    await settle()
    const partsOf = () => ({
      trigger: attrsOf(t.trigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
      item: attrsOf(t.items.get('apple')!),
      disabledItem: attrsOf(t.items.get('blocked')!),
      namedItem: attrsOf(t.items.get('named')!),
      group: attrsOf(group),
      separator: attrsOf(separator),
      option: attrsOf(option),
      indicator: attrsOf(indicator),
    })
    const closed = partsOf()
    // keyboard-open: deterministic highlight on the first item
    focusIn(t.trigger)
    keydown(t.trigger, 'ArrowDown')
    await settle()
    const open = partsOf()
    pressEscape()
    await settle()
    const closedAgain = partsOf()
    disposers.forEach((d) => d())
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, open, closedAgain }
  }

  it('emits identical attributes and styles in closed, open and reclosed states', async () => {
    const zag = await snapshot(createZagMenuBehavior)
    const native = await snapshot(createMenuBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.open).toEqual(zag.open)
    expect(native.closedAgain).toEqual(zag.closedAgain)
  })

  async function contextSnapshot(create: () => MenuBehavior) {
    seq = 900 // identical ids across engines
    const t = mountContext(create)
    await settle()
    const partsOf = () => ({
      ctxTrigger: attrsOf(t.ctxTrigger),
      positioner: attrsOf(t.positioner),
      content: attrsOf(t.content),
    })
    const closed = partsOf()
    t.ctxTrigger.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 60 }),
    )
    await settle()
    const open = partsOf()
    pressEscape()
    await settle()
    const closedAgain = partsOf()
    t.dispose()
    await vi.runAllTimersAsync()
    return { closed, open, closedAgain }
  }

  it('context trigger + anchored content match across engines', async () => {
    const zag = await contextSnapshot(createZagMenuBehavior)
    const native = await contextSnapshot(createMenuBehavior)
    expect(native.closed).toEqual(zag.closed)
    expect(native.open).toEqual(zag.open)
    expect(native.closedAgain).toEqual(zag.closedAgain)
  })

  async function submenuSnapshot(create: () => MenuBehavior) {
    seq = 950
    const t = await mountSubmenu(create)
    await settle()
    const partsOf = () => ({
      triggerItem: attrsOf(t.triggerItem),
      childPositioner: attrsOf(t.childPositioner),
      childContent: attrsOf(t.childContent),
      childItem: attrsOf(t.childItems.get('zoom')!),
    })
    focusIn(t.parent.trigger)
    keydown(t.parent.trigger, 'ArrowDown')
    await settle()
    keydown(t.parent.content, 'ArrowDown')
    await settle()
    const highlighted = partsOf()
    keydown(t.parent.content, 'ArrowRight')
    await settle()
    const childOpen = partsOf()
    t.dispose()
    await vi.runAllTimersAsync()
    return { highlighted, childOpen }
  }

  it('trigger-item + child content match across engines', async () => {
    const zag = await submenuSnapshot(createZagMenuBehavior)
    const native = await submenuSnapshot(createMenuBehavior)
    expect(native.highlighted).toEqual(zag.highlighted)
    expect(native.childOpen).toEqual(zag.childOpen)
  })
})
