/**
 * ui-kbd / ui-kbd-group — host-styled (convention A) keyboard-key indicators.
 */
import { customElement, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-kbd', template: '<au-slot></au-slot>' })
export class UiKbd {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'kbd')
    this.host.className = cn(
      "bg-muted text-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium select-none [&_svg:not([class*='size-'])]:size-3 [&_svg]:shrink-0",
      author,
    )
  }
}

@customElement({ name: 'ui-kbd-group', template: '<au-slot></au-slot>' })
export class UiKbdGroup {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'kbd-group')
    this.host.className = cn('inline-flex items-center gap-1', author)
  }
}
