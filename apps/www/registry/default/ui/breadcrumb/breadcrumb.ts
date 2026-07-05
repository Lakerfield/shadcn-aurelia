/**
 * ui-breadcrumb — custom ATTRIBUTES on native nav/ol/li/a elements so the
 * list semantics stay native (role=list/listitem come from ol/li):
 *
 *   <nav ui-breadcrumb>
 *     <ol ui-breadcrumb-list>
 *       <li ui-breadcrumb-item><a ui-breadcrumb-link href="/">Home</a></li>
 *       <li ui-breadcrumb-separator></li>
 *       <li ui-breadcrumb-item><span ui-breadcrumb-page>Detail</span></li>
 *     </ol>
 *   </nav>
 */
import { customAttribute, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

const CHEVRON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>'

const ELLIPSIS_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>'

function definePart(
  name: string,
  slot: string,
  classes: string,
  setup?: (el: HTMLElement) => void,
) {
  @customAttribute(name)
  class Part {
    readonly el: HTMLElement = resolve(INode) as HTMLElement

    bound(): void {
      const author = this.el.getAttribute('class') ?? ''
      this.el.setAttribute('data-slot', slot)
      this.el.className = cn(classes, author)
      setup?.(this.el)
    }
  }
  return Part
}

export const UiBreadcrumbAttribute = definePart('ui-breadcrumb', 'breadcrumb', '', (el) => {
  if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'breadcrumb')
})

export const UiBreadcrumbListAttribute = definePart(
  'ui-breadcrumb-list',
  'breadcrumb-list',
  'text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5',
)

export const UiBreadcrumbItemAttribute = definePart(
  'ui-breadcrumb-item',
  'breadcrumb-item',
  'inline-flex items-center gap-1.5',
)

export const UiBreadcrumbLinkAttribute = definePart(
  'ui-breadcrumb-link',
  'breadcrumb-link',
  'hover:text-foreground transition-colors',
)

export const UiBreadcrumbPageAttribute = definePart(
  'ui-breadcrumb-page',
  'breadcrumb-page',
  'text-foreground font-normal',
  (el) => {
    el.setAttribute('aria-current', 'page')
  },
)

export const UiBreadcrumbSeparatorAttribute = definePart(
  'ui-breadcrumb-separator',
  'breadcrumb-separator',
  '[&>svg]:size-3.5',
  (el) => {
    el.setAttribute('role', 'presentation')
    el.setAttribute('aria-hidden', 'true')
    if (el.childElementCount === 0) el.innerHTML = CHEVRON_SVG
  },
)

export const UiBreadcrumbEllipsisAttribute = definePart(
  'ui-breadcrumb-ellipsis',
  'breadcrumb-ellipsis',
  'flex size-9 items-center justify-center [&>svg]:size-4',
  (el) => {
    el.setAttribute('role', 'presentation')
    el.setAttribute('aria-hidden', 'true')
    if (el.childElementCount === 0) el.innerHTML = ELLIPSIS_SVG
  },
)
