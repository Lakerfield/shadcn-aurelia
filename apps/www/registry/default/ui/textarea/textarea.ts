/**
 * ui-textarea — styled native <textarea> (convention B).
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<textarea class.bind="classes" value.bind="value"
          placeholder.bind="placeholder || null" disabled.bind="disabled"
          readonly.bind="readonly" required.bind="required"
          id.bind="id || null" name.bind="name || null" rows.bind="rows || null"
          aria-invalid.bind="invalid || null"
          data-slot="textarea"></textarea>
`

@customElement({ name: 'ui-textarea', template: TEMPLATE })
export class UiTextarea {
  @bindable({ mode: BindingMode.twoWay }) value = ''
  @bindable() placeholder = ''
  @bindable() disabled = false
  @bindable() readonly = false
  @bindable() required = false
  @bindable() invalid = false
  @bindable() id = ''
  @bindable() name = ''
  @bindable() rows = 0

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
      'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      this.authorClasses,
    )
  }
}
