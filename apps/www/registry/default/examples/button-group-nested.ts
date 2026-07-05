import { customElement } from 'aurelia'
import { UiButtonGroup, UiButtonGroupText } from '@/registry/default/ui/button-group'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<div class="flex flex-col items-start gap-4">
  <ui-button-group>
    <ui-button-group-text>https://</ui-button-group-text>
    <ui-button variant="outline">example.com</ui-button>
    <ui-button variant="outline" size="icon" label="Copy URL">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
      </svg>
    </ui-button>
  </ui-button-group>
  <ui-button-group orientation="vertical" class="h-fit">
    <ui-button variant="outline" size="sm">Top</ui-button>
    <ui-button variant="outline" size="sm">Middle</ui-button>
    <ui-button variant="outline" size="sm">Bottom</ui-button>
  </ui-button-group>
</div>
`

@customElement({
  name: 'button-group-nested',
  template: TEMPLATE,
  dependencies: [UiButtonGroup, UiButtonGroupText, UiButton],
})
export class ButtonGroupNested {}
