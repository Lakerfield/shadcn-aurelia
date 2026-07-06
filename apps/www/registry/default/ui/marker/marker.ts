/**
 * ui-marker — inline timeline/day markers between chat messages.
 * Host-styled elements (convention A): ui-marker, ui-marker-icon, ui-marker-content.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'

export const markerVariants = cva(
  "group/marker relative flex min-h-4 w-full items-center gap-2 text-left text-sm text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [a]:underline [a]:underline-offset-3 [a]:hover:text-foreground",
  {
    variants: {
      variant: {
        default: '',
        separator:
          'before:mr-1 before:h-px before:min-w-0 before:flex-1 before:bg-border after:ml-1 after:h-px after:min-w-0 after:flex-1 after:bg-border',
        border: 'border-b border-border pb-2',
      },
    },
  },
)

export type MarkerVariants = VariantProps<typeof markerVariants>

@customElement({ name: 'ui-marker', template: '<au-slot></au-slot>' })
export class UiMarker {
  @bindable() variant: MarkerVariants['variant'] = 'default'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'marker')
    this.applyClasses()
  }

  variantChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-variant', this.variant ?? 'default')
    this.host.className = cn(markerVariants({ variant: this.variant }), this.authorClasses)
  }
}

@customElement({ name: 'ui-marker-icon', template: '<au-slot></au-slot>' })
export class UiMarkerIcon {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'marker-icon')
    this.host.setAttribute('aria-hidden', 'true')
    this.host.className = cn("size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4", author)
  }
}

@customElement({ name: 'ui-marker-content', template: '<au-slot></au-slot>' })
export class UiMarkerContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'marker-content')
    this.host.className = cn(
      'min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
      author,
    )
  }
}
