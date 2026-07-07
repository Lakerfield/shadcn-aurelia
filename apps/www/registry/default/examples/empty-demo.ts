import { customElement } from 'aurelia'
import {
  UiEmpty,
  UiEmptyHeader,
  UiEmptyMedia,
  UiEmptyTitle,
  UiEmptyDescription,
  UiEmptyContent,
} from '@/registry/default/ui/empty'
import { UiButton } from '@/registry/default/ui/button'

const TEMPLATE = `
<ui-empty class="w-full max-w-md border">
  <ui-empty-header>
    <ui-empty-media variant="icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
      </svg>
    </ui-empty-media>
    <ui-empty-title>No projects yet</ui-empty-title>
    <ui-empty-description>
      Get started by creating your first project.
    </ui-empty-description>
  </ui-empty-header>
  <ui-empty-content>
    <ui-button size="sm">Create project</ui-button>
  </ui-empty-content>
</ui-empty>
`

@customElement({
  name: 'empty-demo',
  template: TEMPLATE,
  dependencies: [
    UiEmpty,
    UiEmptyHeader,
    UiEmptyMedia,
    UiEmptyTitle,
    UiEmptyDescription,
    UiEmptyContent,
    UiButton,
  ],
})
export class EmptyDemo {}
