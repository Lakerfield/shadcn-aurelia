import { customElement } from 'aurelia'
import {
  createTableEngine,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type Row,
  type TableEngine,
} from '@shadcn-aurelia/primitives'
import {
  UiTableAttribute,
  UiTableHeaderAttribute,
  UiTableBodyAttribute,
  UiTableRowAttribute,
  UiTableHeadAttribute,
  UiTableCellAttribute,
} from '@/registry/default/ui/table'
import { UiInput } from '@/registry/default/ui/input'
import { UiButton, buttonVariants } from '@/registry/default/ui/button'
import { UiCheckbox } from '@/registry/default/ui/checkbox'
import {
  UiDropdownMenu,
  UiDropdownMenuTrigger,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuCheckboxItem,
  UiDropdownMenuLabel,
  UiDropdownMenuSeparator,
} from '@/registry/default/ui/dropdown-menu'

interface Payment {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
}

const payments: Payment[] = [
  { id: 'm5gr84i9', amount: 316, status: 'success', email: 'ken99@example.com' },
  { id: '3u1reuv4', amount: 242, status: 'success', email: 'abe45@example.com' },
  { id: 'derv1ws0', amount: 837, status: 'processing', email: 'monserrat44@example.com' },
  { id: '5kma53ae', amount: 874, status: 'success', email: 'silas22@example.com' },
  { id: 'bhqecj4p', amount: 721, status: 'failed', email: 'carmella@example.com' },
  { id: 'p0r8sd2q', amount: 123, status: 'pending', email: 'linda.g@example.com' },
  { id: 'x9v2mlk1', amount: 452, status: 'success', email: 'omar77@example.com' },
  { id: 'q7t5nbe3', amount: 989, status: 'processing', email: 'yuki.t@example.com' },
  { id: 'z2w8hcf6', amount: 615, status: 'failed', email: 'pieter@example.com' },
  { id: 'a4k1jrx7', amount: 88, status: 'success', email: 'fatima9@example.com' },
  { id: 'n6d3vps5', amount: 540, status: 'pending', email: 'george.b@example.com' },
]

const columns: ColumnDef<Payment>[] = [
  { id: 'select', enableSorting: false, enableHiding: false },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'amount', header: 'Amount' },
  { id: 'actions', enableSorting: false, enableHiding: false },
]

interface ViewRow {
  row: Row<Payment>
  selected: boolean
  payment: Payment
  amountLabel: string
}

interface ColumnToggle {
  id: string
  label: string
  visible: boolean
}

const SORT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="m21 16-4 4-4-4"></path><path d="M17 20V4"></path><path d="m3 8 4-4 4 4"></path><path d="M7 4v16"></path></svg>`
const ELLIPSIS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`
const CHEVRON_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="m6 9 6 6 6-6"></path></svg>`

const TEMPLATE = `
<div class="w-full">
  <div class="flex items-center gap-2 py-4">
    <ui-input placeholder="Filter emails..." class="max-w-sm" input.trigger="onFilter($event)"></ui-input>
    <ui-dropdown-menu placement="bottom-end" class="ml-auto">
      <ui-dropdown-menu-trigger class="\${outlineButton}">Columns ${CHEVRON_DOWN}</ui-dropdown-menu-trigger>
      <ui-dropdown-menu-content>
        <ui-dropdown-menu-checkbox-item repeat.for="col of columnToggles"
            checked.bind="col.visible" click.trigger="toggleColumn(col)">
          \${col.label}
        </ui-dropdown-menu-checkbox-item>
      </ui-dropdown-menu-content>
    </ui-dropdown-menu>
  </div>
  <div class="rounded-md border">
    <table ui-table>
      <thead ui-table-header>
        <tr ui-table-row>
          <th ui-table-head class="w-10">
            <ui-checkbox checked.bind="allSelected" checked-change.trigger="onAllChecked($event)">
              <span class="sr-only">Select all rows on this page</span>
            </ui-checkbox>
          </th>
          <th ui-table-head if.bind="statusVisible">Status</th>
          <th ui-table-head if.bind="emailVisible" class="p-0">
            <button type="button" class="\${ghostButton} gap-2" click.trigger="toggleEmailSort()">
              Email ${SORT_ICON}
            </button>
          </th>
          <th ui-table-head if.bind="amountVisible" class="text-right">Amount</th>
          <th ui-table-head class="w-10"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody ui-table-body>
        <tr ui-table-row repeat.for="vr of viewRows" data-state.bind="vr.selected ? 'selected' : null">
          <td ui-table-cell>
            <ui-checkbox checked.bind="vr.selected" checked-change.trigger="onRowChecked(vr, $event)">
              <span class="sr-only">Select row</span>
            </ui-checkbox>
          </td>
          <td ui-table-cell if.bind="statusVisible" class="capitalize">\${vr.payment.status}</td>
          <td ui-table-cell if.bind="emailVisible" class="lowercase">\${vr.payment.email}</td>
          <td ui-table-cell if.bind="amountVisible" class="text-right font-medium">\${vr.amountLabel}</td>
          <td ui-table-cell>
            <ui-dropdown-menu placement="bottom-end">
              <ui-dropdown-menu-trigger class="\${iconButton}">
                <span class="sr-only">Open row menu</span>
                ${ELLIPSIS_ICON}
              </ui-dropdown-menu-trigger>
              <ui-dropdown-menu-content>
                <ui-dropdown-menu-label>Actions</ui-dropdown-menu-label>
                <ui-dropdown-menu-item click.trigger="copyId(vr)">Copy payment ID</ui-dropdown-menu-item>
                <ui-dropdown-menu-separator></ui-dropdown-menu-separator>
                <ui-dropdown-menu-item>View customer</ui-dropdown-menu-item>
                <ui-dropdown-menu-item>View payment details</ui-dropdown-menu-item>
              </ui-dropdown-menu-content>
            </ui-dropdown-menu>
          </td>
        </tr>
        <tr ui-table-row if.bind="viewRows.length === 0">
          <td ui-table-cell colspan="5" class="h-24 text-center">No results.</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="flex items-center justify-end gap-2 py-4">
    <div class="text-muted-foreground flex-1 text-sm">
      \${selectedCount} of \${totalCount} row(s) selected.
    </div>
    <ui-button variant="outline" size="sm" disabled.bind="!canPrev" click.trigger="prevPage()">Previous</ui-button>
    <ui-button variant="outline" size="sm" disabled.bind="!canNext" click.trigger="nextPage()">Next</ui-button>
  </div>
</div>
`

@customElement({
  name: 'data-table-demo',
  template: TEMPLATE,
  dependencies: [
    UiTableAttribute,
    UiTableHeaderAttribute,
    UiTableBodyAttribute,
    UiTableRowAttribute,
    UiTableHeadAttribute,
    UiTableCellAttribute,
    UiInput,
    UiButton,
    UiCheckbox,
    UiDropdownMenu,
    UiDropdownMenuTrigger,
    UiDropdownMenuContent,
    UiDropdownMenuItem,
    UiDropdownMenuCheckboxItem,
    UiDropdownMenuLabel,
    UiDropdownMenuSeparator,
  ],
})
export class DataTableDemo {
  outlineButton = buttonVariants({ variant: 'outline' })
  ghostButton = buttonVariants({ variant: 'ghost' })
  iconButton = buttonVariants({ variant: 'ghost', size: 'icon' })

  viewRows: ViewRow[] = []
  columnToggles: ColumnToggle[] = []
  allSelected = false
  selectedCount = 0
  totalCount = 0
  canPrev = false
  canNext = false
  statusVisible = true
  emailVisible = true
  amountVisible = true

  private engine: TableEngine<Payment> | null = null
  private dispose: (() => void) | null = null
  private readonly currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

  binding(): void {
    this.engine = createTableEngine<Payment>({
      data: payments,
      columns,
      getRowId: (p) => p.id,
      enableRowSelection: true,
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      state: { pagination: { pageIndex: 0, pageSize: 5 } },
    })
    this.columnToggles = this.engine.api
      .getAllColumns()
      .filter((c) => c.getCanHide())
      .map((c) => ({ id: c.id, label: c.id, visible: c.getIsVisible() }))
    this.dispose = this.engine.subscribe(() => this.sync())
    this.sync()
  }

  private sync(): void {
    const t = this.engine!.api
    this.viewRows = t.getRowModel().rows.map((row) => ({
      row,
      selected: row.getIsSelected(),
      payment: row.original,
      amountLabel: this.currency.format(row.original.amount),
    }))
    this.allSelected = t.getIsAllPageRowsSelected()
    this.selectedCount = t.getFilteredSelectedRowModel().rows.length
    this.totalCount = t.getFilteredRowModel().rows.length
    this.canPrev = t.getCanPreviousPage()
    this.canNext = t.getCanNextPage()
    this.statusVisible = t.getColumn('status')?.getIsVisible() ?? true
    this.emailVisible = t.getColumn('email')?.getIsVisible() ?? true
    this.amountVisible = t.getColumn('amount')?.getIsVisible() ?? true
    for (const col of this.columnToggles) {
      col.visible = t.getColumn(col.id)?.getIsVisible() ?? true
    }
  }

  onFilter(e: Event): void {
    const value = (e.target as HTMLInputElement).value
    this.engine!.api.getColumn('email')?.setFilterValue(value)
  }

  toggleEmailSort(): void {
    this.engine!.api.getColumn('email')?.toggleSorting()
  }

  toggleColumn(col: ColumnToggle): void {
    this.engine!.api.getColumn(col.id)?.toggleVisibility()
  }

  onAllChecked(e: CustomEvent<boolean>): void {
    this.engine!.api.toggleAllPageRowsSelected(e.detail)
  }

  onRowChecked(vr: ViewRow, e: CustomEvent<boolean>): void {
    vr.row.toggleSelected(e.detail)
  }

  prevPage(): void {
    this.engine!.api.previousPage()
  }

  nextPage(): void {
    this.engine!.api.nextPage()
  }

  copyId(vr: ViewRow): void {
    void navigator.clipboard.writeText(vr.payment.id)
  }

  unbinding(): void {
    this.dispose?.()
    this.dispose = null
  }
}
