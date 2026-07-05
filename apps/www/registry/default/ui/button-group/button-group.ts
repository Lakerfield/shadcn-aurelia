/**
 * ui-button-group — host-styled (convention A) group that collapses the inner
 * borders/radii of adjacent controls.
 *
 * Child selectors target both raw elements and the [data-slot] control one
 * level down, because convention-B components (ui-button, ui-input) render
 * their control inside a display:contents host.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'

export const buttonGroupVariants = cva(
  'flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative has-[>[data-slot=button-group]]:gap-2',
  {
    variants: {
      orientation: {
        horizontal:
          '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none [&>:not(:first-child)>[data-slot]]:rounded-l-none [&>:not(:first-child)>[data-slot]]:border-l-0 [&>:not(:last-child)>[data-slot]]:rounded-r-none',
        vertical:
          'flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>:not(:first-child)>[data-slot]]:rounded-t-none [&>:not(:first-child)>[data-slot]]:border-t-0 [&>:not(:last-child)>[data-slot]]:rounded-b-none',
      },
    },
    defaultVariants: { orientation: 'horizontal' },
  },
)

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>

@customElement({ name: 'ui-button-group', template: '<au-slot></au-slot>' })
export class UiButtonGroup {
  @bindable() orientation: ButtonGroupVariants['orientation'] = 'horizontal'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'button-group')
    this.host.setAttribute('role', 'group')
    this.applyClasses()
  }

  orientationChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-orientation', this.orientation ?? 'horizontal')
    this.host.className = cn(
      buttonGroupVariants({ orientation: this.orientation }),
      this.authorClasses,
    )
  }
}

@customElement({ name: 'ui-button-group-text', template: '<au-slot></au-slot>' })
export class UiButtonGroupText {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'button-group-text')
    this.host.className = cn(
      "bg-muted flex items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
      author,
    )
  }
}
