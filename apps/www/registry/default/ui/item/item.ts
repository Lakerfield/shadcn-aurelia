/**
 * ui-item — flexible list-item family (convention A, host-styled).
 * Parts: ui-item-group (role=list), ui-item, ui-item-media, ui-item-content,
 * ui-item-title, ui-item-description, ui-item-actions, ui-item-header,
 * ui-item-footer.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'

export const itemVariants = cva(
  'group/item flex items-center border border-transparent text-sm rounded-md transition-colors [a]:hover:bg-accent/50 [a]:transition-colors duration-100 flex-wrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border-border',
        muted: 'bg-muted/50',
      },
      size: {
        default: 'p-4 gap-4',
        sm: 'py-3 px-4 gap-2.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ItemVariants = VariantProps<typeof itemVariants>

export const itemMediaVariants = cva(
  'flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "size-8 border rounded-sm bg-muted [&_svg:not([class*='size-'])]:size-4",
        image: 'size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type ItemMediaVariants = VariantProps<typeof itemMediaVariants>

@customElement({ name: 'ui-item', template: '<au-slot></au-slot>' })
export class UiItem {
  @bindable() variant: ItemVariants['variant'] = 'default'
  @bindable() size: ItemVariants['size'] = 'default'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'item')
    this.applyClasses()
  }

  attached(): void {
    // items inside a role=list group must expose the listitem role
    if (this.host.closest('[data-slot="item-group"]')) {
      this.host.setAttribute('role', 'listitem')
    }
  }

  variantChanged(): void {
    this.applyClasses()
  }

  sizeChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.className = cn(
      itemVariants({ variant: this.variant, size: this.size }),
      this.authorClasses,
    )
  }
}

@customElement({ name: 'ui-item-media', template: '<au-slot></au-slot>' })
export class UiItemMedia {
  @bindable() variant: ItemMediaVariants['variant'] = 'default'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'item-media')
    this.applyClasses()
  }

  variantChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.className = cn(itemMediaVariants({ variant: this.variant }), this.authorClasses)
  }
}

function defineHostPart(name: string, slot: string, classes: string, role?: string) {
  @customElement({ name, template: '<au-slot></au-slot>' })
  class HostPart {
    readonly host: HTMLElement = resolve(INode) as HTMLElement

    bound(): void {
      const author = this.host.getAttribute('class') ?? ''
      this.host.setAttribute('data-slot', slot)
      if (role) this.host.setAttribute('role', role)
      this.host.className = cn(classes, author)
    }
  }
  return HostPart
}

export const UiItemGroup = defineHostPart(
  'ui-item-group',
  'item-group',
  'group/item-group flex flex-col',
  'list',
)

export const UiItemContent = defineHostPart(
  'ui-item-content',
  'item-content',
  'flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none',
)

export const UiItemTitle = defineHostPart(
  'ui-item-title',
  'item-title',
  'flex w-fit items-center gap-2 text-sm leading-snug font-medium',
)

export const UiItemDescription = defineHostPart(
  'ui-item-description',
  'item-description',
  'text-muted-foreground line-clamp-2 block text-sm leading-normal font-normal text-balance [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
)

export const UiItemActions = defineHostPart(
  'ui-item-actions',
  'item-actions',
  'flex items-center gap-2',
)

export const UiItemHeader = defineHostPart(
  'ui-item-header',
  'item-header',
  'flex basis-full items-center justify-between gap-2',
)

export const UiItemFooter = defineHostPart(
  'ui-item-footer',
  'item-footer',
  'flex basis-full items-center justify-between gap-2',
)
