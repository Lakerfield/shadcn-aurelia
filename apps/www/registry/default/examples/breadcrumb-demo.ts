import { customElement } from 'aurelia'
import {
  UiBreadcrumbAttribute,
  UiBreadcrumbListAttribute,
  UiBreadcrumbItemAttribute,
  UiBreadcrumbLinkAttribute,
  UiBreadcrumbPageAttribute,
  UiBreadcrumbSeparatorAttribute,
} from '@/registry/default/ui/breadcrumb'

const TEMPLATE = `
<nav ui-breadcrumb>
  <ol ui-breadcrumb-list>
    <li ui-breadcrumb-item><a ui-breadcrumb-link href="#">Home</a></li>
    <li ui-breadcrumb-separator></li>
    <li ui-breadcrumb-item><a ui-breadcrumb-link href="#">Components</a></li>
    <li ui-breadcrumb-separator></li>
    <li ui-breadcrumb-item><span ui-breadcrumb-page>Breadcrumb</span></li>
  </ol>
</nav>
`

@customElement({
  name: 'breadcrumb-demo',
  template: TEMPLATE,
  dependencies: [
    UiBreadcrumbAttribute,
    UiBreadcrumbListAttribute,
    UiBreadcrumbItemAttribute,
    UiBreadcrumbLinkAttribute,
    UiBreadcrumbPageAttribute,
    UiBreadcrumbSeparatorAttribute,
  ],
})
export class BreadcrumbDemo {}
