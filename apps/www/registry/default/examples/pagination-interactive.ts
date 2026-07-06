import { customElement } from 'aurelia'
import {
  UiPagination,
  UiPaginationContent,
  UiPaginationItem,
  UiPaginationLinkAttribute,
  UiPaginationPreviousAttribute,
  UiPaginationNextAttribute,
} from '@/registry/default/ui/pagination'

const TEMPLATE = `
<div class="flex flex-col items-center gap-2">
  <ui-pagination aria-label="interactive pagination">
    <ui-pagination-content>
      <ui-pagination-item>
        <a ui-pagination-previous click.trigger="go(page - 1)" tabindex="0" role="button">Previous</a>
      </ui-pagination-item>
      <ui-pagination-item repeat.for="p of pages">
        <a ui-pagination-link="active.bind: p === page" click.trigger="go(p)" tabindex="0" role="button">\${p}</a>
      </ui-pagination-item>
      <ui-pagination-item>
        <a ui-pagination-next click.trigger="go(page + 1)" tabindex="0" role="button">Next</a>
      </ui-pagination-item>
    </ui-pagination-content>
  </ui-pagination>
  <p class="text-muted-foreground text-sm">Page \${page} of \${pages.length}</p>
</div>
`

@customElement({
  name: 'pagination-interactive',
  template: TEMPLATE,
  dependencies: [
    UiPagination,
    UiPaginationContent,
    UiPaginationItem,
    UiPaginationLinkAttribute,
    UiPaginationPreviousAttribute,
    UiPaginationNextAttribute,
  ],
})
export class PaginationInteractive {
  pages = [1, 2, 3, 4, 5]
  page = 1

  go(p: number): void {
    if (p >= 1 && p <= this.pages.length) this.page = p
  }
}
