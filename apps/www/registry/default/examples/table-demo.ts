import { customElement } from 'aurelia'
import {
  UiTableAttribute,
  UiTableHeaderAttribute,
  UiTableBodyAttribute,
  UiTableRowAttribute,
  UiTableHeadAttribute,
  UiTableCellAttribute,
  UiTableCaptionAttribute,
} from '@/registry/default/ui/table'

const TEMPLATE = `
<table ui-table class="max-w-lg">
  <caption ui-table-caption>A list of your recent invoices.</caption>
  <thead ui-table-header>
    <tr ui-table-row>
      <th ui-table-head class="w-[100px]">Invoice</th>
      <th ui-table-head>Status</th>
      <th ui-table-head>Method</th>
      <th ui-table-head class="text-right">Amount</th>
    </tr>
  </thead>
  <tbody ui-table-body>
    <tr ui-table-row repeat.for="inv of invoices">
      <td ui-table-cell class="font-medium">\${inv.id}</td>
      <td ui-table-cell>\${inv.status}</td>
      <td ui-table-cell>\${inv.method}</td>
      <td ui-table-cell class="text-right">\${inv.amount}</td>
    </tr>
  </tbody>
</table>
`

@customElement({
  name: 'table-demo',
  template: TEMPLATE,
  dependencies: [
    UiTableAttribute,
    UiTableHeaderAttribute,
    UiTableBodyAttribute,
    UiTableRowAttribute,
    UiTableHeadAttribute,
    UiTableCellAttribute,
    UiTableCaptionAttribute,
  ],
})
export class TableDemo {
  invoices = [
    { id: 'INV001', status: 'Paid', method: 'Credit card', amount: '$250.00' },
    { id: 'INV002', status: 'Pending', method: 'PayPal', amount: '$150.00' },
    { id: 'INV003', status: 'Unpaid', method: 'Bank transfer', amount: '$350.00' },
    { id: 'INV004', status: 'Paid', method: 'Credit card', amount: '$450.00' },
  ]
}
