/**
 * ui-bubble — chat bubbles.
 *
 * Host-styled elements (convention A): ui-bubble-group, ui-bubble,
 * ui-bubble-content, ui-bubble-reactions. For interactive bubbles (upstream's
 * `render={<button/>}`), apply the content as an ATTRIBUTE on a native
 * button/a instead: `<button ui-bubble-content>…</button>` — the variant hover
 * selectors target `[data-slot=bubble-content]:is(button,a)`.
 */
import { customElement, customAttribute, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-bubble-group', template: '<au-slot></au-slot>' })
export class UiBubbleGroup {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'bubble-group')
    this.host.className = cn('flex min-w-0 flex-col gap-2', author)
  }
}

export const bubbleVariants = cva(
  'group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full',
  {
    variants: {
      variant: {
        default:
          '*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80',
        secondary:
          '*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
        muted:
          '*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]',
        tinted:
          '*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)] *:data-[slot=bubble-content]:text-foreground dark:*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.88_calc(c*0.5)_h)] dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.35_calc(c*0.5)_h)]',
        outline:
          '*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30',
        ghost:
          'border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/50',
        // Text darkened vs upstream (l*0.87) so it clears 4.5:1 on the /10 tint.
        destructive:
          '*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-[oklch(from_var(--destructive)_calc(l*0.87)_c_h)] dark:*:data-[slot=bubble-content]:text-destructive dark:*:data-[slot=bubble-content]:bg-destructive/20 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20 dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type BubbleVariants = VariantProps<typeof bubbleVariants>

@customElement({ name: 'ui-bubble', template: '<au-slot></au-slot>' })
export class UiBubble {
  @bindable() variant: BubbleVariants['variant'] = 'default'
  @bindable() align: 'start' | 'end' = 'start'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'bubble')
    this.applyClasses()
  }

  variantChanged(): void {
    this.applyClasses()
  }

  alignChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-variant', this.variant ?? 'default')
    this.host.setAttribute('data-align', this.align)
    this.host.className = cn(bubbleVariants({ variant: this.variant }), this.authorClasses)
  }
}

const BUBBLE_CONTENT_CLASSES =
  'w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/50'

@customElement({ name: 'ui-bubble-content', template: '<au-slot></au-slot>' })
export class UiBubbleContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'bubble-content')
    this.host.className = cn(BUBBLE_CONTENT_CLASSES, author)
  }
}

/** `<button ui-bubble-content>` / `<a ui-bubble-content>` — interactive bubbles. */
@customAttribute('ui-bubble-content')
export class UiBubbleContentAttribute {
  private readonly el: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.el.getAttribute('class') ?? ''
    this.el.setAttribute('data-slot', 'bubble-content')
    this.el.className = cn(BUBBLE_CONTENT_CLASSES, author)
  }
}

const bubbleReactionsVariants = cva(
  'absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-3 ring-card has-[button]:p-0',
  {
    variants: {
      side: {
        top: 'top-0 -translate-y-3/4',
        bottom: 'bottom-0 translate-y-3/4',
      },
      align: {
        start: 'left-3',
        end: 'right-3',
      },
    },
    defaultVariants: { side: 'bottom', align: 'end' },
  },
)

@customElement({ name: 'ui-bubble-reactions', template: '<au-slot></au-slot>' })
export class UiBubbleReactions {
  @bindable() side: 'top' | 'bottom' = 'bottom'
  @bindable() align: 'start' | 'end' = 'end'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'bubble-reactions')
    this.applyClasses()
  }

  sideChanged(): void {
    this.applyClasses()
  }

  alignChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-side', this.side)
    this.host.setAttribute('data-align', this.align)
    this.host.className = cn(
      bubbleReactionsVariants({ side: this.side, align: this.align }),
      this.authorClasses,
    )
  }
}
