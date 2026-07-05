/**
 * ui-empty — empty-state family (convention A, host-styled).
 * Parts: ui-empty, ui-empty-header, ui-empty-media, ui-empty-title,
 * ui-empty-description, ui-empty-content.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'

export const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center mb-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type EmptyMediaVariants = VariantProps<typeof emptyMediaVariants>

@customElement({ name: 'ui-empty-media', template: '<au-slot></au-slot>' })
export class UiEmptyMedia {
  @bindable() variant: EmptyMediaVariants['variant'] = 'default'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'empty-media')
    this.applyClasses()
  }

  variantChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.className = cn(emptyMediaVariants({ variant: this.variant }), this.authorClasses)
  }
}

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

export const UiEmpty = defineHostPart(
  'ui-empty',
  'empty',
  'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12',
)

export const UiEmptyHeader = defineHostPart(
  'ui-empty-header',
  'empty-header',
  'flex max-w-sm flex-col items-center gap-2 text-center',
)

export const UiEmptyTitle = defineHostPart('ui-empty-title', 'empty-title', 'block text-lg font-medium tracking-tight')

export const UiEmptyDescription = defineHostPart(
  'ui-empty-description',
  'empty-description',
  'text-muted-foreground block [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4',
)

export const UiEmptyContent = defineHostPart(
  'ui-empty-content',
  'empty-content',
  'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance',
)
