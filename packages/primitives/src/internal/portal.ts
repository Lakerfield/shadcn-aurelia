/**
 * Spike D — Portal custom attribute.
 *
 * Moves the host element under `document.body` after Aurelia attaches it,
 * proving that shadcn's CSS-variable theme (on :root) and .dark class strategy
 * both survive the move — CSS vars inherit from :root regardless of DOM position.
 *
 * Usage:
 *   <ui-tooltip-content ui-portal>…</ui-tooltip-content>
 */
import { customAttribute, INode, resolve } from 'aurelia'

@customAttribute('ui-portal')
export class UiPortalAttribute {
  private readonly el: HTMLElement = resolve(INode) as HTMLElement

  attached(): void {
    document.body.appendChild(this.el)
  }

  // No detaching() needed: Aurelia calls el.remove() which works from any parent.
}
