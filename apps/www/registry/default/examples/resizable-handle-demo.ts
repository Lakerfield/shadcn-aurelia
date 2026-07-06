import { customElement } from 'aurelia'
import {
  UiResizablePanelGroup,
  UiResizablePanel,
  UiResizableHandle,
} from '@/registry/default/ui/resizable'

const TEMPLATE = `
<ui-resizable-panel-group direction="horizontal" class="h-[200px] max-w-md rounded-lg border md:min-w-[450px]">
  <ui-resizable-panel default-size="25" min-size="15">
    <div class="flex h-full items-center justify-center p-6">
      <span class="font-semibold">Sidebar</span>
    </div>
  </ui-resizable-panel>
  <ui-resizable-handle with-handle.bind="true"></ui-resizable-handle>
  <ui-resizable-panel default-size="75">
    <div class="flex h-full items-center justify-center p-6">
      <span class="font-semibold">Content</span>
    </div>
  </ui-resizable-panel>
</ui-resizable-panel-group>
`

@customElement({
  name: 'resizable-handle-demo',
  template: TEMPLATE,
  dependencies: [UiResizablePanelGroup, UiResizablePanel, UiResizableHandle],
})
export class ResizableHandleDemo {}
