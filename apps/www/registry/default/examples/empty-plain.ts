import { customElement } from 'aurelia'
import {
  UiEmpty,
  UiEmptyHeader,
  UiEmptyTitle,
  UiEmptyDescription,
} from '@/registry/default/ui/empty'

const TEMPLATE = `
<ui-empty class="w-full max-w-md">
  <ui-empty-header>
    <ui-empty-title>404 — Not found</ui-empty-title>
    <ui-empty-description>
      The page you are looking for does not exist. <a href="#">Go back home</a>
    </ui-empty-description>
  </ui-empty-header>
</ui-empty>
`

@customElement({
  name: 'empty-plain',
  template: TEMPLATE,
  dependencies: [UiEmpty, UiEmptyHeader, UiEmptyTitle, UiEmptyDescription],
})
export class EmptyPlain {}
