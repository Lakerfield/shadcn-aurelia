import { customElement } from 'aurelia'
import {
  UiBreadcrumbAttribute,
  UiBreadcrumbListAttribute,
  UiBreadcrumbItemAttribute,
  UiBreadcrumbLinkAttribute,
  UiBreadcrumbPageAttribute,
  UiBreadcrumbSeparatorAttribute,
  UiBreadcrumbEllipsisAttribute,
} from '@/registry/default/ui/breadcrumb'

const TEMPLATE = `
<nav ui-breadcrumb aria-label="breadcrumb with ellipsis">
  <ol ui-breadcrumb-list>
    <li ui-breadcrumb-item><a ui-breadcrumb-link href="#">Home</a></li>
    <li ui-breadcrumb-separator></li>
    <li ui-breadcrumb-item><span ui-breadcrumb-ellipsis></span></li>
    <li ui-breadcrumb-separator></li>
    <li ui-breadcrumb-item><a ui-breadcrumb-link href="#">Docs</a></li>
    <li ui-breadcrumb-separator></li>
    <li ui-breadcrumb-item><span ui-breadcrumb-page>Breadcrumb</span></li>
  </ol>
</nav>
`

@customElement({
  name: 'breadcrumb-ellipsis',
  template: TEMPLATE,
  dependencies: [
    UiBreadcrumbAttribute,
    UiBreadcrumbListAttribute,
    UiBreadcrumbItemAttribute,
    UiBreadcrumbLinkAttribute,
    UiBreadcrumbPageAttribute,
    UiBreadcrumbSeparatorAttribute,
    UiBreadcrumbEllipsisAttribute,
  ],
})
export class BreadcrumbEllipsis {}
