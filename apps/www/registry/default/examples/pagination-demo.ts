import { customElement } from 'aurelia'
import {
  UiPagination,
  UiPaginationContent,
  UiPaginationItem,
  UiPaginationLinkAttribute,
  UiPaginationPreviousAttribute,
  UiPaginationNextAttribute,
  UiPaginationEllipsis,
} from '@/registry/default/ui/pagination'

const TEMPLATE = `
<ui-pagination>
  <ui-pagination-content>
    <ui-pagination-item><a href="#" ui-pagination-previous>Previous</a></ui-pagination-item>
    <ui-pagination-item><a href="#" ui-pagination-link>1</a></ui-pagination-item>
    <ui-pagination-item><a href="#" ui-pagination-link="active.bind: true">2</a></ui-pagination-item>
    <ui-pagination-item><a href="#" ui-pagination-link>3</a></ui-pagination-item>
    <ui-pagination-item><ui-pagination-ellipsis></ui-pagination-ellipsis></ui-pagination-item>
    <ui-pagination-item><a href="#" ui-pagination-next>Next</a></ui-pagination-item>
  </ui-pagination-content>
</ui-pagination>
`

@customElement({
  name: 'pagination-demo',
  template: TEMPLATE,
  dependencies: [
    UiPagination,
    UiPaginationContent,
    UiPaginationItem,
    UiPaginationLinkAttribute,
    UiPaginationPreviousAttribute,
    UiPaginationNextAttribute,
    UiPaginationEllipsis,
  ],
})
export class PaginationDemo {}
