import { customElement } from 'aurelia'
import { UiScrollArea } from '@/registry/default/ui/scroll-area'
import { UiSeparator } from '@/registry/default/ui/separator'

const TEMPLATE = `
<ui-scroll-area class="h-72 w-48 rounded-md border">
  <div class="p-4">
    <p class="mb-4 text-sm leading-none font-medium">Tags</p>
    <template repeat.for="tag of tags">
      <div class="text-sm">\${tag}</div>
      <ui-separator class="my-2"></ui-separator>
    </template>
  </div>
</ui-scroll-area>
`

@customElement({
  name: 'scroll-area-demo',
  template: TEMPLATE,
  dependencies: [UiScrollArea, UiSeparator],
})
export class ScrollAreaDemo {
  tags = Array.from({ length: 50 }, (_, i) => `v1.2.0-beta.${50 - i}`)
}
