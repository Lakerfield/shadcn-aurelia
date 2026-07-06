import { customElement } from 'aurelia'
import {
  UiResizablePanelGroup,
  UiResizablePanel,
  UiResizableHandle,
} from '@/registry/default/ui/resizable'

const TEMPLATE = `
<ui-resizable-panel-group direction="horizontal" class="h-[200px] max-w-md rounded-lg border md:min-w-[450px]">
  <ui-resizable-panel default-size="50">
    <div class="flex h-full items-center justify-center p-6">
      <span class="font-semibold">One</span>
    </div>
  </ui-resizable-panel>
  <ui-resizable-handle></ui-resizable-handle>
  <ui-resizable-panel default-size="50">
    <ui-resizable-panel-group direction="vertical">
      <ui-resizable-panel default-size="25">
        <div class="flex h-full items-center justify-center p-6">
          <span class="font-semibold">Two</span>
        </div>
      </ui-resizable-panel>
      <ui-resizable-handle></ui-resizable-handle>
      <ui-resizable-panel default-size="75">
        <div class="flex h-full items-center justify-center p-6">
          <span class="font-semibold">Three</span>
        </div>
      </ui-resizable-panel>
    </ui-resizable-panel-group>
  </ui-resizable-panel>
</ui-resizable-panel-group>
`

@customElement({
  name: 'resizable-demo',
  template: TEMPLATE,
  dependencies: [UiResizablePanelGroup, UiResizablePanel, UiResizableHandle],
})
export class ResizableDemo {}
