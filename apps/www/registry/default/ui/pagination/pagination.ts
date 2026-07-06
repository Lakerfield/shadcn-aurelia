/**
 * ui-pagination — static, styled navigation (shadcn parity: no state machine;
 * links are plain anchors styled with buttonVariants).
 *
 *   <ui-pagination>
 *     <ui-pagination-content>
 *       <ui-pagination-item><a href="#" ui-pagination-previous>Previous</a></ui-pagination-item>
 *       <ui-pagination-item><a href="#" ui-pagination-link="active.bind: page === 1">1</a></ui-pagination-item>
 *       <ui-pagination-item><ui-pagination-ellipsis></ui-pagination-ellipsis></ui-pagination-item>
 *       <ui-pagination-item><a href="#" ui-pagination-next>Next</a></ui-pagination-item>
 *     </ui-pagination-content>
 *   </ui-pagination>
 */
import { customElement, customAttribute, bindable, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'
import { buttonVariants, type ButtonVariants } from '@/registry/default/ui/button'

@customElement({ name: 'ui-pagination', template: '<au-slot></au-slot>' })
export class UiPagination {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'pagination')
    this.host.setAttribute('role', 'navigation')
    if (!this.host.hasAttribute('aria-label')) this.host.setAttribute('aria-label', 'pagination')
    this.host.className = cn('mx-auto flex w-full justify-center', author)
  }
}

@customElement({ name: 'ui-pagination-content', template: '<au-slot></au-slot>' })
export class UiPaginationContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'pagination-content')
    this.host.setAttribute('role', 'list')
    this.host.className = cn('flex flex-row items-center gap-1', author)
  }
}

@customElement({ name: 'ui-pagination-item', template: '<au-slot></au-slot>' })
export class UiPaginationItem {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    this.host.setAttribute('data-slot', 'pagination-item')
    this.host.setAttribute('role', 'listitem')
    this.host.className = cn('block', this.host.getAttribute('class') ?? '')
  }
}

/** Attribute on an <a>: page link styled as a button; `active` → outline + aria-current. */
@customAttribute('ui-pagination-link')
export class UiPaginationLinkAttribute {
  @bindable() active = false
  @bindable() size: ButtonVariants['size'] = 'icon'

  private readonly el: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.el.getAttribute('class') ?? ''
    this.el.setAttribute('data-slot', 'pagination-link')
    this.apply()
  }

  activeChanged(): void {
    this.apply()
  }

  private apply(): void {
    if (this.active) this.el.setAttribute('aria-current', 'page')
    else this.el.removeAttribute('aria-current')
    this.el.setAttribute('data-active', String(this.active))
    this.el.className = cn(
      buttonVariants({ variant: this.active ? 'outline' : 'ghost', size: this.size }),
      'cursor-pointer',
      this.authorClasses,
    )
  }
}

@customAttribute('ui-pagination-previous')
export class UiPaginationPreviousAttribute {
  private readonly el: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.el.getAttribute('class') ?? ''
    this.el.setAttribute('data-slot', 'pagination-previous')
    if (!this.el.hasAttribute('aria-label')) this.el.setAttribute('aria-label', 'Go to previous page')
    this.el.className = cn(
      buttonVariants({ variant: 'ghost', size: 'default' }),
      'cursor-pointer gap-1 px-2.5 sm:pl-2.5',
      author,
    )
  }
}

@customAttribute('ui-pagination-next')
export class UiPaginationNextAttribute {
  private readonly el: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.el.getAttribute('class') ?? ''
    this.el.setAttribute('data-slot', 'pagination-next')
    if (!this.el.hasAttribute('aria-label')) this.el.setAttribute('aria-label', 'Go to next page')
    this.el.className = cn(
      buttonVariants({ variant: 'ghost', size: 'default' }),
      'cursor-pointer gap-1 px-2.5 sm:pr-2.5',
      author,
    )
  }
}

const ELLIPSIS_TEMPLATE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4">
  <circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>
</svg>
<span class="sr-only">More pages</span>
`

@customElement({ name: 'ui-pagination-ellipsis', template: ELLIPSIS_TEMPLATE })
export class UiPaginationEllipsis {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'pagination-ellipsis')
    this.host.setAttribute('aria-hidden', 'true')
    this.host.className = cn('flex size-9 items-center justify-center', author)
  }
}
