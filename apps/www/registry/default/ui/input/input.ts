/**
 * ui-input — styled native <input> (convention B).
 *   <ui-input id="email" type="email" placeholder="Email" value.two-way="email">
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<input class.bind="classes" type.bind="type" value.bind="value"
       placeholder.bind="placeholder || null" disabled.bind="disabled"
       readonly.bind="readonly" required.bind="required"
       id.bind="id || null" name.bind="name || null"
       autocomplete.bind="autocomplete || null"
       aria-invalid.bind="invalid || null"
       data-slot="input">
`

@customElement({ name: 'ui-input', template: TEMPLATE })
export class UiInput {
  @bindable() type = 'text'
  @bindable({ mode: BindingMode.twoWay }) value = ''
  @bindable() placeholder = ''
  @bindable() disabled = false
  @bindable() readonly = false
  @bindable() required = false
  @bindable() invalid = false
  @bindable() id = ''
  @bindable() name = ''
  @bindable() autocomplete = ''

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
      'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      this.authorClasses,
    )
  }
}
