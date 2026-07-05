/**
 * ui-skeleton — host-styled (convention A) loading placeholder.
 */
import { customElement, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-skeleton', template: '<au-slot></au-slot>' })
export class UiSkeleton {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'skeleton')
    this.host.className = cn('block bg-accent animate-pulse rounded-md', author)
  }
}
