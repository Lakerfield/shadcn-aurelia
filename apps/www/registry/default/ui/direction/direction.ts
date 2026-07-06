/**
 * ui-direction — RTL provider. Sets the `dir` attribute on its subtree;
 * machine-backed components resolve their reading direction from the nearest
 * `dir` attribute at init (via resolveDirection), so wrap components in this
 * provider (or set `dir` on any ancestor / <html>) to flip them to RTL.
 *
 *   <ui-direction dir="rtl">
 *     <ui-select>…</ui-select>
 *   </ui-direction>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

@customElement({ name: 'ui-direction', template: '<au-slot></au-slot>' })
export class UiDirection {
  @bindable() dir: 'ltr' | 'rtl' = 'ltr'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  binding(): void {
    // Set before children bind — machine roots read the DOM during their init.
    this.host.setAttribute('dir', this.dir)
  }

  bound(): void {
    this.host.className = cn('block', this.host.getAttribute('class') ?? '')
  }

  dirChanged(v: 'ltr' | 'rtl'): void {
    this.host.setAttribute('dir', v)
  }
}
