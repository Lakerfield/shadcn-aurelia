/**
 * ui-native-select — custom ATTRIBUTE on a real <select>.
 *
 * A custom element can't project <option> children (the HTML parser drops
 * unknown tags inside <select>), so the part is an attribute on the native
 * element — markup stays valid and fully accessible:
 *
 *   <select ui-native-select value.bind="fruit">
 *     <option>Apple</option>
 *   </select>
 */
import { customAttribute, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

// chevron-down, embedded so appearance-none keeps an affordance
const CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")"

@customAttribute('ui-native-select')
export class UiNativeSelectAttribute {
  private readonly el: HTMLSelectElement = resolve(INode) as HTMLSelectElement

  bound(): void {
    const author = this.el.getAttribute('class') ?? ''
    this.el.setAttribute('data-slot', 'native-select')
    this.el.className = cn(
      'border-input dark:bg-input/30 dark:hover:bg-input/50 h-9 w-fit min-w-0 appearance-none rounded-md border bg-transparent py-1 pr-8 pl-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
      author,
    )
    this.el.style.backgroundImage = CHEVRON
    this.el.style.backgroundRepeat = 'no-repeat'
    this.el.style.backgroundPosition = 'right 0.5rem center'
    this.el.style.backgroundSize = '1rem'
  }
}
