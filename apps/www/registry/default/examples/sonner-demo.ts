import { customElement } from 'aurelia'
import { UiSonner, toaster } from '@/registry/default/ui/sonner'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-sonner></ui-sonner>
<div class="flex flex-wrap gap-3">
  <ui-button variant="outline" click.trigger="show()">Show toast</ui-button>
  <ui-button variant="outline" click.trigger="success()">Success</ui-button>
  <ui-button variant="outline" click.trigger="error()">Error</ui-button>
</div>
`

@customElement({
  name: 'sonner-demo',
  template: TEMPLATE,
  dependencies: [UiSonner, UiButton],
})
export class SonnerDemo {
  private count = 0

  show(): void {
    this.count++
    toaster.create({
      title: `Event has been created (#${this.count})`,
      description: 'Sunday, December 03, 2026 at 9:00 AM',
    })
  }

  success(): void {
    toaster.success({ title: 'Changes saved', description: 'Your profile has been updated.' })
  }

  error(): void {
    toaster.error({ title: 'Something went wrong', description: 'Please try again later.' })
  }
}
