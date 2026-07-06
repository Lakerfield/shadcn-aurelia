/**
 * ui-message — a chat message row: avatar + content column with header/footer.
 * Host-styled elements (convention A). `align="end"` flips the row for the
 * active user's side; bubbles inside follow via group data-attributes.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-message-group', template: '<au-slot></au-slot>' })
export class UiMessageGroup {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-group')
    this.host.className = cn('flex min-w-0 flex-col gap-2', author)
  }
}

@customElement({ name: 'ui-message', template: '<au-slot></au-slot>' })
export class UiMessage {
  @bindable() align: 'start' | 'end' = 'start'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message')
    this.applyClasses()
  }

  alignChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-align', this.align)
    this.host.className = cn(
      'group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse',
      this.authorClasses,
    )
  }
}

@customElement({ name: 'ui-message-avatar', template: '<au-slot></au-slot>' })
export class UiMessageAvatar {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-avatar')
    this.host.className = cn(
      'flex w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted group-has-data-[slot=message-footer]/message:-translate-y-8',
      author,
    )
  }
}

@customElement({ name: 'ui-message-content', template: '<au-slot></au-slot>' })
export class UiMessageContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-content')
    this.host.className = cn(
      'flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end',
      author,
    )
  }
}

@customElement({ name: 'ui-message-header', template: '<au-slot></au-slot>' })
export class UiMessageHeader {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-header')
    this.host.className = cn(
      'flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0',
      author,
    )
  }
}

@customElement({ name: 'ui-message-footer', template: '<au-slot></au-slot>' })
export class UiMessageFooter {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'message-footer')
    this.host.className = cn(
      'flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end',
      author,
    )
  }
}
