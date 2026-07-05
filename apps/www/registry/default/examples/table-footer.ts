import { customElement } from 'aurelia'
import {
  UiTableAttribute,
  UiTableHeaderAttribute,
  UiTableBodyAttribute,
  UiTableFooterAttribute,
  UiTableRowAttribute,
  UiTableHeadAttribute,
  UiTableCellAttribute,
} from '@/registry/default/ui/table'

const TEMPLATE = `
<table ui-table class="max-w-md">
  <thead ui-table-header>
    <tr ui-table-row>
      <th ui-table-head>Item</th>
      <th ui-table-head class="text-right">Total</th>
    </tr>
  </thead>
  <tbody ui-table-body>
    <tr ui-table-row>
      <td ui-table-cell>Subscription</td>
      <td ui-table-cell class="text-right">$29.00</td>
    </tr>
    <tr ui-table-row>
      <td ui-table-cell>Support add-on</td>
      <td ui-table-cell class="text-right">$9.00</td>
    </tr>
  </tbody>
  <tfoot ui-table-footer>
    <tr ui-table-row>
      <td ui-table-cell>Total</td>
      <td ui-table-cell class="text-right">$38.00</td>
    </tr>
  </tfoot>
</table>
`

@customElement({
  name: 'table-footer-demo',
  template: TEMPLATE,
  dependencies: [
    UiTableAttribute,
    UiTableHeaderAttribute,
    UiTableBodyAttribute,
    UiTableFooterAttribute,
    UiTableRowAttribute,
    UiTableHeadAttribute,
    UiTableCellAttribute,
  ],
})
export class TableFooterDemo {}
