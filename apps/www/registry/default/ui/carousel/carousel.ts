/**
 * ui-carousel family — embla-carousel behind the facade.
 *
 *   <ui-carousel class="w-full max-w-xs">
 *     <ui-carousel-content>
 *       <ui-carousel-item repeat.for="…">…</ui-carousel-item>
 *     </ui-carousel-content>
 *     <ui-carousel-previous></ui-carousel-previous>
 *     <ui-carousel-next></ui-carousel-next>
 *   </ui-carousel>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import {
  createCarouselEngine,
  createContext,
  type CarouselEngine,
  type CarouselOptions,
  type Context,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'
import { buttonVariants } from '@/registry/default/ui/button'

export interface CarouselOwner {
  readonly orientation: 'horizontal' | 'vertical'
  readonly engine: CarouselEngine | null
  setViewport(el: HTMLElement): void
  subscribe(listener: () => void): () => void
  scrollPrev(): void
  scrollNext(): void
  canScrollPrev(): boolean
  canScrollNext(): boolean
}

export const carouselContext: Context<CarouselOwner> = createContext<CarouselOwner>()

@customElement({ name: 'ui-carousel', template: '<au-slot></au-slot>' })
export class UiCarousel implements CarouselOwner {
  @bindable() orientation: 'horizontal' | 'vertical' = 'horizontal'
  @bindable() loop = false
  /** Accessible region name; give each carousel on a page a distinct one. */
  @bindable() label = 'Carousel'
  /** Extra embla options, e.g. `opts.bind="{ align: 'start' }"`. */
  @bindable() opts: CarouselOptions | null = null

  engine: CarouselEngine | null = null

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private viewport: HTMLElement | null = null
  private readonly listeners = new Set<() => void>()

  binding(): void {
    carouselContext.set(this.host, this)
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'carousel')
    this.host.setAttribute('role', 'region')
    this.host.setAttribute('aria-roledescription', 'carousel')
    if (!this.host.hasAttribute('aria-label')) this.host.setAttribute('aria-label', this.label)
    this.host.className = cn('relative block', author)
  }

  setViewport(el: HTMLElement): void {
    this.viewport = el
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  attached(): void {
    if (!this.viewport) {
      console.warn('[ui-carousel] No <ui-carousel-content> registered a viewport')
      return
    }
    this.engine = createCarouselEngine(this.viewport, {
      axis: this.orientation === 'horizontal' ? 'x' : 'y',
      loop: this.loop,
      ...(this.opts ?? {}),
    })
    const notify = () => this.listeners.forEach((l) => l())
    this.engine.on('select', notify)
    this.engine.on('reInit', notify)
    notify()
    this.host.addEventListener('keydown', this.onKeydown)
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.scrollPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.scrollNext()
    }
  }

  scrollPrev(): void {
    this.engine?.scrollPrev()
  }

  scrollNext(): void {
    this.engine?.scrollNext()
  }

  canScrollPrev(): boolean {
    return this.engine?.canScrollPrev() ?? false
  }

  canScrollNext(): boolean {
    return this.engine?.canScrollNext() ?? false
  }

  detaching(): void {
    this.host.removeEventListener('keydown', this.onKeydown)
    this.engine?.destroy()
    this.engine = null
    this.listeners.clear()
    carouselContext.delete(this.host)
  }
}

const CONTENT_TEMPLATE = `
<div ref="viewportEl" data-slot="carousel-viewport" class="overflow-hidden">
  <div ref="containerEl" data-slot="carousel-content" class.bind="containerClasses">
    <au-slot></au-slot>
  </div>
</div>
`

@customElement({ name: 'ui-carousel-content', template: CONTENT_TEMPLATE })
export class UiCarouselContent {
  viewportEl!: HTMLDivElement
  containerEl!: HTMLDivElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private orientation: 'horizontal' | 'vertical' = 'horizontal'
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    const carousel = carouselContext.get(this.host)
    if (carousel) {
      this.orientation = carousel.orientation
      carousel.setViewport(this.viewportEl)
    } else {
      console.warn('[ui-carousel-content] No parent <ui-carousel> found')
    }
  }

  get containerClasses(): string {
    return cn(
      'flex',
      this.orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
      this.authorClasses,
    )
  }
}

@customElement({ name: 'ui-carousel-item', template: '<au-slot></au-slot>' })
export class UiCarouselItem {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const carousel = carouselContext.get(this.host)
    const orientation = carousel?.orientation ?? 'horizontal'
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'carousel-item')
    this.host.setAttribute('role', 'group')
    this.host.setAttribute('aria-roledescription', 'slide')
    this.host.className = cn(
      'block min-w-0 shrink-0 grow-0 basis-full',
      orientation === 'horizontal' ? 'pl-4' : 'pt-4',
      author,
    )
  }
}

const ARROW_LEFT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>`
const ARROW_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`

abstract class CarouselNavButton {
  btn!: HTMLButtonElement
  protected readonly host: HTMLElement = resolve(INode) as HTMLElement
  protected carousel: CarouselOwner | null = null
  private dispose: (() => void) | null = null
  protected authorClasses = ''

  protected abstract readonly direction: 'prev' | 'next'

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    const orientation = this.carousel?.orientation ?? 'horizontal'
    const pos =
      this.direction === 'prev'
        ? orientation === 'horizontal'
          ? 'top-1/2 -left-12 -translate-y-1/2'
          : '-top-12 left-1/2 -translate-x-1/2 rotate-90'
        : orientation === 'horizontal'
          ? 'top-1/2 -right-12 -translate-y-1/2'
          : '-bottom-12 left-1/2 -translate-x-1/2 rotate-90'
    return cn(
      buttonVariants({ variant: 'outline', size: 'icon' }),
      'absolute size-8 rounded-full',
      pos,
      this.authorClasses,
    )
  }

  onClick(): void {
    if (this.direction === 'prev') this.carousel?.scrollPrev()
    else this.carousel?.scrollNext()
  }

  attached(): void {
    this.carousel = carouselContext.get(this.host) ?? null
    if (!this.carousel) {
      console.warn('[ui-carousel-nav] No parent <ui-carousel> found')
      return
    }
    const update = () => {
      const can =
        this.direction === 'prev' ? this.carousel!.canScrollPrev() : this.carousel!.canScrollNext()
      this.btn.disabled = !can
      this.btn.className = this.classes
    }
    update()
    this.dispose = this.carousel.subscribe(update)
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const PREV_TEMPLATE = `
<button ref="btn" type="button" data-slot="carousel-previous" class.bind="classes" click.trigger="onClick()">
  ${ARROW_LEFT}
  <span class="sr-only">Previous slide</span>
</button>
`

@customElement({ name: 'ui-carousel-previous', template: PREV_TEMPLATE })
export class UiCarouselPrevious extends CarouselNavButton {
  protected readonly direction = 'prev' as const
}

const NEXT_TEMPLATE = `
<button ref="btn" type="button" data-slot="carousel-next" class.bind="classes" click.trigger="onClick()">
  ${ARROW_RIGHT}
  <span class="sr-only">Next slide</span>
</button>
`

@customElement({ name: 'ui-carousel-next', template: NEXT_TEMPLATE })
export class UiCarouselNext extends CarouselNavButton {
  protected readonly direction = 'next' as const
}
