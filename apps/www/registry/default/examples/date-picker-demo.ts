import { customElement } from 'aurelia'
import { UiDatePicker, UiDatePickerTrigger, UiDatePickerContent } from '@/registry/default/ui/date-picker'
import { UiCalendar } from '@/registry/default/ui/calendar'

const TEMPLATE = `
<ui-date-picker value.two-way="date" placeholder="Pick a date">
  <ui-date-picker-trigger class="w-[240px]"></ui-date-picker-trigger>
  <ui-date-picker-content>
    <ui-calendar></ui-calendar>
  </ui-date-picker-content>
</ui-date-picker>
<p class="text-muted-foreground mt-4 text-sm">Selected: \${date || '—'}</p>
`

@customElement({
  name: 'date-picker-demo',
  template: TEMPLATE,
  dependencies: [UiDatePicker, UiDatePickerTrigger, UiDatePickerContent, UiCalendar],
})
export class DatePickerDemo {
  date = ''
}
