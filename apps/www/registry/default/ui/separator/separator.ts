/**
 * ui-separator — host-styled (convention A) with WAI-ARIA separator semantics:
 * decorative separators get role="none"; semantic ones role="separator" with
 * aria-orientation when vertical.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-separator', template: '' })
export class UiSeparator {
  @bindable() orientation: 'horizontal' | 'vertical' = 'horizontal'
  @bindable() decorative = true

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'separator')
    this.apply()
  }

  orientationChanged(): void {
    this.apply()
  }

  decorativeChanged(): void {
    this.apply()
  }

  private apply(): void {
    this.host.setAttribute('data-orientation', this.orientation)
    if (this.decorative) {
      this.host.setAttribute('role', 'none')
      this.host.removeAttribute('aria-orientation')
    } else {
      this.host.setAttribute('role', 'separator')
      if (this.orientation === 'vertical') this.host.setAttribute('aria-orientation', 'vertical')
      else this.host.removeAttribute('aria-orientation')
    }
    this.host.className = cn(
      'block bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
      this.authorClasses,
    )
  }
}
