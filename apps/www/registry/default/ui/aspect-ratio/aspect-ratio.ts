/**
 * ui-aspect-ratio — host-styled (convention A) container constraining children
 * to a ratio via the CSS aspect-ratio property.
 *
 *   <ui-aspect-ratio ratio="16/9" class="bg-muted rounded-lg">
 *     <img class="h-full w-full rounded-lg object-cover" … />
 *   </ui-aspect-ratio>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-aspect-ratio', template: '<au-slot></au-slot>' })
export class UiAspectRatio {
  /** CSS aspect-ratio value: "16/9", "1", "4/3", … */
  @bindable() ratio = '1'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'aspect-ratio')
    this.host.className = cn('relative block w-full overflow-hidden', author)
    this.apply()
  }

  ratioChanged(): void {
    this.apply()
  }

  private apply(): void {
    this.host.style.aspectRatio = this.ratio
  }
}
