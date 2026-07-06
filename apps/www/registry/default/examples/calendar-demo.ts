import { customElement } from 'aurelia'
import { UiCalendar } from '@/registry/default/ui/calendar'

const TEMPLATE = `
<ui-calendar value.two-way="date" class="rounded-md border"></ui-calendar>
<p class="text-muted-foreground mt-4 text-sm">Selected: \${date || '—'}</p>
`

@customElement({
  name: 'calendar-demo',
  template: TEMPLATE,
  dependencies: [UiCalendar],
})
export class CalendarDemo {
  date = ''
}
