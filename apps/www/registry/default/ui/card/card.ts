/**
 * ui-card — multi-part host-styled elements (convention A).
 * Parts: ui-card, ui-card-header, ui-card-title, ui-card-description,
 * ui-card-action, ui-card-content, ui-card-footer.
 */
import { customElement, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

function defineHostPart(name: string, slot: string, classes: string) {
  @customElement({ name, template: '<au-slot></au-slot>' })
  class HostPart {
    readonly host: HTMLElement = resolve(INode) as HTMLElement

    bound(): void {
      const author = this.host.getAttribute('class') ?? ''
      this.host.setAttribute('data-slot', slot)
      this.host.className = cn(classes, author)
    }
  }
  return HostPart
}

export const UiCard = defineHostPart(
  'ui-card',
  'card',
  'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
)

export const UiCardHeader = defineHostPart(
  'ui-card-header',
  'card-header',
  '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
)

export const UiCardTitle = defineHostPart('ui-card-title', 'card-title', 'block leading-none font-semibold')

export const UiCardDescription = defineHostPart(
  'ui-card-description',
  'card-description',
  'block text-muted-foreground text-sm',
)

export const UiCardAction = defineHostPart(
  'ui-card-action',
  'card-action',
  'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
)

export const UiCardContent = defineHostPart('ui-card-content', 'card-content', 'block px-6')

export const UiCardFooter = defineHostPart(
  'ui-card-footer',
  'card-footer',
  'flex items-center px-6 [.border-t]:pt-6',
)
