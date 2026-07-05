/**
 * ui-alert — multi-part host-styled elements (convention A).
 * Parts: ui-alert (role="alert"), ui-alert-title, ui-alert-description.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'

export const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>

@customElement({ name: 'ui-alert', template: '<au-slot></au-slot>' })
export class UiAlert {
  @bindable() variant: AlertVariants['variant'] = 'default'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'alert')
    this.host.setAttribute('role', 'alert')
    this.applyClasses()
  }

  variantChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.className = cn(alertVariants({ variant: this.variant }), this.authorClasses)
  }
}

@customElement({ name: 'ui-alert-title', template: '<au-slot></au-slot>' })
export class UiAlertTitle {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'alert-title')
    this.host.className = cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', author)
  }
}

@customElement({ name: 'ui-alert-description', template: '<au-slot></au-slot>' })
export class UiAlertDescription {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'alert-description')
    this.host.className = cn(
      'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
      author,
    )
  }
}
