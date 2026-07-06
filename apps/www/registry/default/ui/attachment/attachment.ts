/**
 * ui-attachment — file/upload chips for chat input and messages.
 *
 * Host-styled elements (convention A) except:
 * - ui-attachment-action: inner native <button> (convention B, like ui-button)
 *   with ghost/icon-xs defaults.
 * - ui-attachment-trigger: an ATTRIBUTE on a native button/a overlay:
 *   `<button ui-attachment-trigger aria-label="Open">`.
 *
 * The root's `state` bindable (idle/uploading/processing/error/done) drives
 * data-state styling; uploading/processing put a shimmer on the title.
 */
import { customElement, customAttribute, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/registry/default/lib/cn'
import { buttonVariants, type ButtonVariants } from '@/registry/default/ui/button'

export const attachmentVariants = cva(
  'group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border bg-card text-card-foreground transition-colors focus-within:ring-1 focus-within:ring-ring/50 has-[>a,>button]:hover:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed',
  {
    variants: {
      size: {
        default:
          'gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2',
        sm: 'gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5',
        xs: 'gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1',
      },
      orientation: {
        horizontal: 'min-w-40 items-center',
        vertical: 'w-24 flex-col has-data-[slot=attachment-content]:w-30',
      },
    },
  },
)

export type AttachmentVariants = VariantProps<typeof attachmentVariants>
export type AttachmentState = 'idle' | 'uploading' | 'processing' | 'error' | 'done'

@customElement({ name: 'ui-attachment', template: '<au-slot></au-slot>' })
export class UiAttachment {
  @bindable() state: AttachmentState = 'done'
  @bindable() size: AttachmentVariants['size'] = 'default'
  @bindable() orientation: AttachmentVariants['orientation'] = 'horizontal'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'attachment')
    this.applyClasses()
  }

  stateChanged(): void {
    this.applyClasses()
  }

  sizeChanged(): void {
    this.applyClasses()
  }

  orientationChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-state', this.state)
    this.host.setAttribute('data-size', this.size ?? 'default')
    this.host.setAttribute('data-orientation', this.orientation ?? 'horizontal')
    this.host.className = cn(
      attachmentVariants({ size: this.size, orientation: this.orientation }),
      this.authorClasses,
    )
  }
}

const attachmentMediaVariants = cva(
  "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: '',
        image:
          'opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover',
      },
    },
    defaultVariants: { variant: 'icon' },
  },
)

export type AttachmentMediaVariants = VariantProps<typeof attachmentMediaVariants>

@customElement({ name: 'ui-attachment-media', template: '<au-slot></au-slot>' })
export class UiAttachmentMedia {
  @bindable() variant: AttachmentMediaVariants['variant'] = 'icon'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'attachment-media')
    this.applyClasses()
  }

  variantChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-variant', this.variant ?? 'icon')
    this.host.className = cn(attachmentMediaVariants({ variant: this.variant }), this.authorClasses)
  }
}

@customElement({ name: 'ui-attachment-content', template: '<au-slot></au-slot>' })
export class UiAttachmentContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'attachment-content')
    this.host.className = cn(
      'max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1',
      author,
    )
  }
}

@customElement({ name: 'ui-attachment-title', template: '<au-slot></au-slot>' })
export class UiAttachmentTitle {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'attachment-title')
    this.host.className = cn(
      'block max-w-full min-w-0 truncate font-medium group-data-[state=processing]/attachment:shimmer group-data-[state=uploading]/attachment:shimmer',
      author,
    )
  }
}

@customElement({ name: 'ui-attachment-description', template: '<au-slot></au-slot>' })
export class UiAttachmentDescription {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'attachment-description')
    // Error text darkened vs upstream (/80 → l*0.87) so it clears 4.5:1 on bg-card.
    this.host.className = cn(
      'mt-0.5 block min-w-0 truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-[oklch(from_var(--destructive)_calc(l*0.87)_c_h)] dark:group-data-[state=error]/attachment:text-destructive/80 max-w-full',
      author,
    )
  }
}

@customElement({ name: 'ui-attachment-actions', template: '<au-slot></au-slot>' })
export class UiAttachmentActions {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'attachment-actions')
    this.host.className = cn(
      'relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1',
      author,
    )
  }
}

const ACTION_TEMPLATE = `
<button class.bind="classes" type="button" disabled.bind="disabled"
        aria-label.bind="label || null" data-slot="attachment-action">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-attachment-action', template: ACTION_TEMPLATE })
export class UiAttachmentAction {
  @bindable() variant: ButtonVariants['variant'] = 'ghost'
  @bindable() size: ButtonVariants['size'] = 'icon-xs'
  @bindable() disabled = false
  /** Accessible name — actions are icon-only. */
  @bindable() label = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(buttonVariants({ variant: this.variant, size: this.size }), this.authorClasses)
  }
}

/** `<button ui-attachment-trigger aria-label="…">` — full-chip overlay trigger. */
@customAttribute('ui-attachment-trigger')
export class UiAttachmentTriggerAttribute {
  private readonly el: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.el.getAttribute('class') ?? ''
    this.el.setAttribute('data-slot', 'attachment-trigger')
    if (this.el.tagName === 'BUTTON' && !this.el.hasAttribute('type')) {
      this.el.setAttribute('type', 'button')
    }
    this.el.className = cn('absolute inset-0 z-10 outline-none', author)
  }
}

@customElement({ name: 'ui-attachment-group', template: '<au-slot></au-slot>' })
export class UiAttachmentGroup {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'attachment-group')
    this.host.className = cn(
      'flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start',
      author,
    )
  }
}
