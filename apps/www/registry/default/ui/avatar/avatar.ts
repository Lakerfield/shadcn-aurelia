/**
 * ui-avatar — image with load-state-driven fallback.
 *
 * The image part tracks load/error on its <img> and reflects the status as
 * `data-status` on the avatar root; visibility is pure CSS via Tailwind
 * group-data selectors — no cross-component wiring needed.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-avatar', template: '<au-slot></au-slot>' })
export class UiAvatar {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'avatar')
    this.host.setAttribute('data-status', 'loading')
    this.host.className = cn('group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full', author)
  }
}

const IMAGE_TEMPLATE = `
<img ref="imgEl" class.bind="classes" src.bind="src" alt.bind="alt"
     load.trigger="onLoad()" error.trigger="onError()" data-slot="avatar-image">
`

@customElement({ name: 'ui-avatar-image', template: IMAGE_TEMPLATE })
export class UiAvatarImage {
  @bindable() src = ''
  @bindable() alt = ''

  imgEl!: HTMLImageElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  attached(): void {
    // cached images may already be complete before listeners attach
    if (this.imgEl.complete && this.imgEl.naturalWidth > 0) this.onLoad()
  }

  get classes(): string {
    return cn(
      'aspect-square size-full group-data-[status=error]/avatar:hidden group-data-[status=loading]/avatar:hidden',
      this.authorClasses,
    )
  }

  onLoad(): void {
    this.setStatus('loaded')
  }

  onError(): void {
    this.setStatus('error')
  }

  private setStatus(status: string): void {
    this.host.closest('[data-slot="avatar"]')?.setAttribute('data-status', status)
  }
}

@customElement({ name: 'ui-avatar-fallback', template: '<au-slot></au-slot>' })
export class UiAvatarFallback {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'avatar-fallback')
    this.host.className = cn(
      'bg-muted flex size-full items-center justify-center rounded-full text-sm group-data-[status=loaded]/avatar:hidden',
      author,
    )
  }
}
