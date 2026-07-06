/**
 * ui-resizable family — native panel-group controller (react-resizable-panels
 * behavior, no engine).
 *
 *   <ui-resizable-panel-group direction="horizontal" class="h-[200px] rounded-lg border">
 *     <ui-resizable-panel default-size="50">…</ui-resizable-panel>
 *     <ui-resizable-handle with-handle.bind="true"></ui-resizable-handle>
 *     <ui-resizable-panel default-size="50">…</ui-resizable-panel>
 *   </ui-resizable-panel-group>
 *
 * Sizes are percentages of the group; dragging or arrow keys on a handle
 * trade size between the two adjacent panels, clamped by min-size/max-size.
 * Handles are ARIA separators (arrows resize, Home/End jump to the limits).
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { createContext, type Context } from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export interface ResizableGroupOwner {
  readonly direction: 'horizontal' | 'vertical'
  registerPanel(panel: UiResizablePanel): void
  unregisterPanel(panel: UiResizablePanel): void
  registerHandle(handle: UiResizableHandle): void
  unregisterHandle(handle: UiResizableHandle): void
  /** Resize the panel pair around `handle` so the previous panel gets `size` percent. */
  resizeAround(handle: UiResizableHandle, size: number): void
  neighbors(handle: UiResizableHandle): { prev: UiResizablePanel | null; next: UiResizablePanel | null }
  sizeInPixels(): number
}

export const resizableContext: Context<ResizableGroupOwner> = createContext<ResizableGroupOwner>()

@customElement({ name: 'ui-resizable-panel-group', template: '<au-slot></au-slot>' })
export class UiResizablePanelGroup implements ResizableGroupOwner {
  @bindable() direction: 'horizontal' | 'vertical' = 'horizontal'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private panels: UiResizablePanel[] = []
  private handles: UiResizableHandle[] = []

  binding(): void {
    resizableContext.set(this.host, this)
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'resizable-panel-group')
    this.host.setAttribute('data-direction', this.direction)
    this.host.className = cn(
      'flex h-full w-full data-[direction=vertical]:flex-col',
      author,
    )
  }

  registerPanel(panel: UiResizablePanel): void {
    this.panels.push(panel)
  }

  unregisterPanel(panel: UiResizablePanel): void {
    this.panels = this.panels.filter((p) => p !== panel)
  }

  registerHandle(handle: UiResizableHandle): void {
    this.handles.push(handle)
  }

  unregisterHandle(handle: UiResizableHandle): void {
    this.handles = this.handles.filter((h) => h !== handle)
  }

  attached(): void {
    // distribute: explicit default sizes first, the rest equally
    const explicit = this.panels.filter((p) => p.defaultSizeNumber > 0)
    const claimed = explicit.reduce((sum, p) => sum + p.defaultSizeNumber, 0)
    const rest = this.panels.length - explicit.length
    const restSize = rest > 0 ? Math.max(0, 100 - claimed) / rest : 0
    for (const p of this.panels) {
      p.size = p.defaultSizeNumber > 0 ? p.defaultSizeNumber : restSize
    }
    this.layout()
    this.handles.forEach((h) => h.refreshAria())
  }

  private layout(): void {
    for (const p of this.panels) p.applySize()
  }

  neighbors(handle: UiResizableHandle): { prev: UiResizablePanel | null; next: UiResizablePanel | null } {
    let prev: UiResizablePanel | null = null
    let next: UiResizablePanel | null = null
    for (const p of this.panels) {
      const pos = handle.host.compareDocumentPosition(p.host)
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) prev = p
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING && !next) next = p
    }
    return { prev, next }
  }

  sizeInPixels(): number {
    const rect = this.host.getBoundingClientRect()
    return this.direction === 'horizontal' ? rect.width : rect.height
  }

  resizeAround(handle: UiResizableHandle, size: number): void {
    const { prev, next } = this.neighbors(handle)
    if (!prev || !next) return
    const total = prev.size + next.size
    const clamped = Math.min(
      Math.max(size, prev.minSizeNumber, total - next.maxSizeNumber),
      prev.maxSizeNumber,
      total - next.minSizeNumber,
    )
    prev.size = clamped
    next.size = total - clamped
    prev.applySize()
    next.applySize()
    handle.refreshAria()
  }

  detaching(): void {
    resizableContext.delete(this.host)
  }
}

@customElement({ name: 'ui-resizable-panel', template: '<au-slot></au-slot>' })
export class UiResizablePanel {
  /** Initial size as a percentage of the group. */
  @bindable() defaultSize: number | string = 0
  @bindable() minSize: number | string = 10
  @bindable() maxSize: number | string = 100

  size = 0

  readonly host: HTMLElement = resolve(INode) as HTMLElement
  private owner: ResizableGroupOwner | null = null

  get defaultSizeNumber(): number {
    return Number(this.defaultSize) || 0
  }

  get minSizeNumber(): number {
    return Number(this.minSize) || 0
  }

  get maxSizeNumber(): number {
    const n = Number(this.maxSize)
    return Number.isFinite(n) && n > 0 ? n : 100
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'resizable-panel')
    this.host.className = cn('overflow-hidden', author)
    this.owner = this.host.parentElement ? resizableContext.get(this.host.parentElement) ?? null : null
    this.owner?.registerPanel(this)
  }

  applySize(): void {
    this.host.style.flex = `${this.size} 1 0px`
  }

  detaching(): void {
    this.owner?.unregisterPanel(this)
  }
}

const GRIP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-2.5"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`

const HANDLE_TEMPLATE = `
<div if.bind="withHandle" class="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">${GRIP_ICON}</div>
`

@customElement({ name: 'ui-resizable-handle', template: HANDLE_TEMPLATE })
export class UiResizableHandle {
  @bindable() withHandle = false

  readonly host: HTMLElement = resolve(INode) as HTMLElement
  private owner: ResizableGroupOwner | null = null
  private dragStart: { pos: number; prevSize: number } | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'resizable-handle')
    this.host.setAttribute('role', 'separator')
    this.host.setAttribute('tabindex', '0')
    this.host.setAttribute('aria-label', 'Resize panel')
    this.host.className = cn(
      'bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden',
      'aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2',
      '[&[aria-orientation=horizontal]>div]:rotate-90',
      'touch-none select-none',
      author,
    )
    this.owner = this.host.parentElement ? resizableContext.get(this.host.parentElement) ?? null : null
    this.owner?.registerHandle(this)
    // a vertical separator sits between horizontally arranged panels
    const separatorOrientation = this.owner?.direction === 'vertical' ? 'horizontal' : 'vertical'
    this.host.setAttribute('aria-orientation', separatorOrientation)
    this.host.style.cursor = this.owner?.direction === 'vertical' ? 'row-resize' : 'col-resize'
    this.host.addEventListener('pointerdown', this.onPointerDown)
    this.host.addEventListener('pointermove', this.onPointerMove)
    this.host.addEventListener('pointerup', this.onPointerUp)
    this.host.addEventListener('keydown', this.onKeydown)
  }

  refreshAria(): void {
    const prev = this.owner?.neighbors(this)?.prev
    if (!prev) return
    this.host.setAttribute('aria-valuemin', String(Math.round(prev.minSizeNumber)))
    this.host.setAttribute('aria-valuemax', String(Math.round(prev.maxSizeNumber)))
    this.host.setAttribute('aria-valuenow', String(Math.round(prev.size)))
  }

  private onPointerDown = (e: PointerEvent): void => {
    const prev = this.owner?.neighbors(this)?.prev
    if (!this.owner || !prev) return
    this.dragStart = {
      pos: this.owner.direction === 'horizontal' ? e.clientX : e.clientY,
      prevSize: prev.size,
    }
    this.host.setPointerCapture(e.pointerId)
    this.host.setAttribute('data-resize-handle-state', 'drag')
    e.preventDefault()
  }

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragStart || !this.owner) return
    const pos = this.owner.direction === 'horizontal' ? e.clientX : e.clientY
    const deltaPct = ((pos - this.dragStart.pos) / this.owner.sizeInPixels()) * 100
    this.owner.resizeAround(this, this.dragStart.prevSize + deltaPct)
  }

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.dragStart) return
    this.dragStart = null
    this.host.releasePointerCapture(e.pointerId)
    this.host.removeAttribute('data-resize-handle-state')
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (!this.owner) return
    const { prev } = this.owner.neighbors(this)
    if (!prev) return
    const horizontal = this.owner.direction === 'horizontal'
    const step = e.shiftKey ? 10 : 1
    let next: number | null = null
    if ((horizontal && e.key === 'ArrowLeft') || (!horizontal && e.key === 'ArrowUp')) next = prev.size - step
    else if ((horizontal && e.key === 'ArrowRight') || (!horizontal && e.key === 'ArrowDown')) next = prev.size + step
    else if (e.key === 'Home') next = prev.minSizeNumber
    else if (e.key === 'End') next = prev.maxSizeNumber
    if (next !== null) {
      e.preventDefault()
      this.owner.resizeAround(this, next)
    }
  }

  detaching(): void {
    this.host.removeEventListener('pointerdown', this.onPointerDown)
    this.host.removeEventListener('pointermove', this.onPointerMove)
    this.host.removeEventListener('pointerup', this.onPointerUp)
    this.host.removeEventListener('keydown', this.onKeydown)
    this.owner?.unregisterHandle(this)
  }
}
