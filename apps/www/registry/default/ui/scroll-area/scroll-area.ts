/**
 * ui-scroll-area — CSS-first custom scrollbars (no engine).
 *
 * The native viewport scrolls (native scrollbar hidden); thumbs are synced on
 * scroll/resize and draggable. Scrollbars render only when content overflows.
 *
 *   <ui-scroll-area class="h-72 w-48 rounded-md border">…</ui-scroll-area>
 *   <ui-scroll-area orientation="horizontal">…</ui-scroll-area>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<div ref="viewportEl" data-slot="scroll-area-viewport" tabindex="0"
     class="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 overflow-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
  <au-slot></au-slot>
</div>
<div ref="vTrackEl" data-slot="scroll-area-scrollbar" data-orientation="vertical"
     class="absolute top-0 right-0 flex h-full w-2.5 touch-none flex-col border-l border-l-transparent p-px transition-colors select-none">
  <div ref="vThumbEl" data-slot="scroll-area-thumb" class="bg-border relative w-full rounded-full"></div>
</div>
<div ref="hTrackEl" data-slot="scroll-area-scrollbar" data-orientation="horizontal"
     class="absolute bottom-0 left-0 flex h-2.5 w-full touch-none flex-row border-t border-t-transparent p-px transition-colors select-none">
  <div ref="hThumbEl" data-slot="scroll-area-thumb" class="bg-border relative h-full rounded-full"></div>
</div>
`

@customElement({ name: 'ui-scroll-area', template: TEMPLATE })
export class UiScrollArea {
  @bindable() orientation: 'vertical' | 'horizontal' | 'both' = 'vertical'

  viewportEl!: HTMLDivElement
  vTrackEl!: HTMLDivElement
  vThumbEl!: HTMLDivElement
  hTrackEl!: HTMLDivElement
  hThumbEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private observer: ResizeObserver | null = null
  private disposers: Array<() => void> = []

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'scroll-area')
    this.host.className = cn('relative block overflow-hidden', author)
  }

  attached(): void {
    const update = () => this.update()
    this.viewportEl.addEventListener('scroll', update, { passive: true })
    this.disposers.push(() => this.viewportEl.removeEventListener('scroll', update))

    this.observer = new ResizeObserver(update)
    this.observer.observe(this.viewportEl)
    if (this.viewportEl.firstElementChild) this.observer.observe(this.viewportEl.firstElementChild)

    this.setupDrag(this.vThumbEl, 'vertical')
    this.setupDrag(this.hThumbEl, 'horizontal')
    this.update()
  }

  private update(): void {
    const vp = this.viewportEl
    const wantV = this.orientation !== 'horizontal'
    const wantH = this.orientation !== 'vertical'

    const overflowV = wantV && vp.scrollHeight > vp.clientHeight + 1
    this.vTrackEl.style.display = overflowV ? '' : 'none'
    if (overflowV) {
      const trackH = this.vTrackEl.clientHeight
      const thumbH = Math.max(24, (vp.clientHeight / vp.scrollHeight) * trackH)
      const maxScroll = vp.scrollHeight - vp.clientHeight
      const top = maxScroll > 0 ? (vp.scrollTop / maxScroll) * (trackH - thumbH) : 0
      this.vThumbEl.style.height = `${thumbH}px`
      this.vThumbEl.style.transform = `translateY(${top}px)`
    }

    const overflowH = wantH && vp.scrollWidth > vp.clientWidth + 1
    this.hTrackEl.style.display = overflowH ? '' : 'none'
    if (overflowH) {
      const trackW = this.hTrackEl.clientWidth
      const thumbW = Math.max(24, (vp.clientWidth / vp.scrollWidth) * trackW)
      const maxScroll = vp.scrollWidth - vp.clientWidth
      const left = maxScroll > 0 ? (vp.scrollLeft / maxScroll) * (trackW - thumbW) : 0
      this.hThumbEl.style.width = `${thumbW}px`
      this.hThumbEl.style.transform = `translateX(${left}px)`
    }
  }

  private setupDrag(thumb: HTMLElement, axis: 'vertical' | 'horizontal'): void {
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      thumb.setPointerCapture(e.pointerId)
      const vp = this.viewportEl
      const startPos = axis === 'vertical' ? e.clientY : e.clientX
      const startScroll = axis === 'vertical' ? vp.scrollTop : vp.scrollLeft
      const track = axis === 'vertical' ? this.vTrackEl : this.hTrackEl
      const trackSize = axis === 'vertical' ? track.clientHeight : track.clientWidth
      const thumbSize = axis === 'vertical' ? thumb.clientHeight : thumb.clientWidth
      const maxScroll =
        axis === 'vertical' ? vp.scrollHeight - vp.clientHeight : vp.scrollWidth - vp.clientWidth
      const scrollPerPx = trackSize - thumbSize > 0 ? maxScroll / (trackSize - thumbSize) : 0

      const onMove = (ev: PointerEvent) => {
        const delta = (axis === 'vertical' ? ev.clientY : ev.clientX) - startPos
        if (axis === 'vertical') vp.scrollTop = startScroll + delta * scrollPerPx
        else vp.scrollLeft = startScroll + delta * scrollPerPx
      }
      const onUp = () => {
        thumb.removeEventListener('pointermove', onMove)
        thumb.removeEventListener('pointerup', onUp)
      }
      thumb.addEventListener('pointermove', onMove)
      thumb.addEventListener('pointerup', onUp)
    }
    thumb.addEventListener('pointerdown', onPointerDown)
    this.disposers.push(() => thumb.removeEventListener('pointerdown', onPointerDown))
  }

  detaching(): void {
    this.observer?.disconnect()
    this.observer = null
    this.disposers.forEach((d) => d())
    this.disposers = []
  }
}
