/**
 * ui-spinner — loading indicator (inner svg receives the classes, convention B).
 */
import { customElement, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<svg class.bind="classes" data-slot="spinner" role="status" aria-label="Loading"
     xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
</svg>
`

@customElement({ name: 'ui-spinner', template: TEMPLATE })
export class UiSpinner {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn('size-4 animate-spin', this.authorClasses)
  }
}
