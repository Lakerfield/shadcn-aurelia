/**
 * ui-table — custom ATTRIBUTES on real table elements.
 *
 * Custom elements inside <table> would be foster-parented out by the HTML
 * parser and break the table content model, so every part is an attribute on
 * its native element — the DOM stays a valid, fully accessible table:
 *
 *   <table ui-table>
 *     <thead ui-table-header><tr ui-table-row><th ui-table-head>…
 *
 * `ui-table` additionally wraps its <table> in an overflow container div.
 */
import { customAttribute, INode, resolve } from 'aurelia'
import { cn } from '@/registry/default/lib/cn'

@customAttribute('ui-table')
export class UiTableAttribute {
  private readonly el: HTMLTableElement = resolve(INode) as HTMLTableElement
  private container: HTMLDivElement | null = null

  bound(): void {
    const author = this.el.getAttribute('class') ?? ''
    this.el.setAttribute('data-slot', 'table')
    this.el.className = cn('w-full caption-bottom text-sm', author)
  }

  attached(): void {
    this.container = document.createElement('div')
    this.container.dataset.slot = 'table-container'
    this.container.className = 'relative w-full overflow-x-auto'
    this.el.parentNode?.insertBefore(this.container, this.el)
    this.container.appendChild(this.el)
  }

  detaching(): void {
    if (this.container?.parentNode) {
      this.container.parentNode.insertBefore(this.el, this.container)
      this.container.remove()
    }
    this.container = null
  }
}

function defineTablePart(name: string, slot: string, classes: string) {
  @customAttribute(name)
  class TablePart {
    readonly el: HTMLElement = resolve(INode) as HTMLElement

    bound(): void {
      const author = this.el.getAttribute('class') ?? ''
      this.el.setAttribute('data-slot', slot)
      this.el.className = cn(classes, author)
    }
  }
  return TablePart
}

export const UiTableHeaderAttribute = defineTablePart('ui-table-header', 'table-header', '[&_tr]:border-b')

export const UiTableBodyAttribute = defineTablePart(
  'ui-table-body',
  'table-body',
  '[&_tr:last-child]:border-0',
)

export const UiTableFooterAttribute = defineTablePart(
  'ui-table-footer',
  'table-footer',
  'bg-muted/50 border-t font-medium [&>tr]:last:border-b-0',
)

export const UiTableRowAttribute = defineTablePart(
  'ui-table-row',
  'table-row',
  'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
)

export const UiTableHeadAttribute = defineTablePart(
  'ui-table-head',
  'table-head',
  'text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
)

export const UiTableCellAttribute = defineTablePart(
  'ui-table-cell',
  'table-cell',
  'p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
)

export const UiTableCaptionAttribute = defineTablePart(
  'ui-table-caption',
  'table-caption',
  'text-muted-foreground mt-4 text-sm',
)
