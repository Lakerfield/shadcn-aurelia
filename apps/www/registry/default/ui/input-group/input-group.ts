/**
 * ui-input-group — bordered container composing a control with addons.
 *
 * The control is a raw native element carrying the ui-input-group-input
 * attribute (unstyled variant of ui-input), so :focus-visible on it can drive
 * the group border via has-[] selectors:
 *
 *   <ui-input-group>
 *     <ui-input-group-addon><svg …></ui-input-group-addon>
 *     <input ui-input-group-input placeholder="Search…">
 *   </ui-input-group>
 */
import { customElement, customAttribute, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'

export const inputGroupAddonVariants = cva(
  "text-muted-foreground flex h-auto items-center justify-center gap-2 py-1.5 text-sm font-medium select-none [&>svg:not([class*='size-'])]:size-4 [&>kbd]:rounded-[calc(var(--radius)-5px)]",
  {
    variants: {
      align: {
        'inline-start': 'order-first pl-3',
        'inline-end': 'order-last pr-3',
        'block-start': 'order-first w-full justify-start px-3 pt-3',
        'block-end': 'order-last w-full justify-start px-3 pb-3',
      },
    },
    defaultVariants: { align: 'inline-start' },
  },
)

export type InputGroupAddonVariants = VariantProps<typeof inputGroupAddonVariants>

@customElement({ name: 'ui-input-group', template: '<au-slot></au-slot>' })
export class UiInputGroup {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'input-group')
    this.host.setAttribute('role', 'group')
    this.host.className = cn(
      'group/input-group border-input dark:bg-input/30 relative flex w-full items-center rounded-md border shadow-xs transition-[color,box-shadow] outline-none h-9 min-w-0 has-[>textarea]:h-auto has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/40 has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive',
      author,
    )
  }
}

@customElement({ name: 'ui-input-group-addon', template: '<au-slot></au-slot>' })
export class UiInputGroupAddon {
  @bindable() align: InputGroupAddonVariants['align'] = 'inline-start'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'input-group-addon')
    this.applyClasses()
  }

  alignChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.className = cn(inputGroupAddonVariants({ align: this.align }), this.authorClasses)
  }
}

/** Unstyled control inside a group — attribute on a raw <input>/<textarea>. */
@customAttribute('ui-input-group-input')
export class UiInputGroupInputAttribute {
  private readonly el: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.el.getAttribute('class') ?? ''
    this.el.setAttribute('data-slot', 'input-group-control')
    this.el.className = cn(
      'placeholder:text-muted-foreground h-full w-full flex-1 rounded-none border-0 bg-transparent px-3 py-1 text-base shadow-none outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-transparent',
      author,
    )
  }
}
