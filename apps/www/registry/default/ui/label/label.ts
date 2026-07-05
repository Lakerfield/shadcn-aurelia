/**
 * ui-label — styled native <label> (convention B).
 * `for` is aliased to htmlFor so the native label/control association works:
 *   <ui-label for="email">Email</ui-label>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<label class.bind="classes" for.bind="htmlFor || null" data-slot="label">
  <au-slot></au-slot>
</label>
`

@customElement({ name: 'ui-label', template: TEMPLATE })
export class UiLabel {
  @bindable({ attribute: 'for' }) htmlFor = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      this.authorClasses,
    )
  }
}
