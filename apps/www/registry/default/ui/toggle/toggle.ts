/**
 * ui-toggle — native pressed-state button (no machine needed; aria-pressed).
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'

export const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-2 min-w-9',
        sm: 'h-8 px-1.5 min-w-8',
        lg: 'h-10 px-2.5 min-w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ToggleVariants = VariantProps<typeof toggleVariants>

const TEMPLATE = `
<button type="button" class.bind="classes" data-slot="toggle"
        data-state.bind="pressed ? 'on' : 'off'"
        aria-pressed.bind="pressed"
        disabled.bind="disabled"
        click.trigger="toggle()">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-toggle', template: TEMPLATE })
export class UiToggle {
  @bindable({ mode: BindingMode.twoWay }) pressed = false
  @bindable() variant: ToggleVariants['variant'] = 'default'
  @bindable() size: ToggleVariants['size'] = 'default'
  @bindable() disabled = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(toggleVariants({ variant: this.variant, size: this.size }), this.authorClasses)
  }

  toggle(): void {
    this.pressed = !this.pressed
    this.host.dispatchEvent(new CustomEvent('pressed-change', { detail: this.pressed, bubbles: true }))
  }
}
