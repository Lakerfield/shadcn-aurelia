import { customElement } from 'aurelia'
import {
  UiAttachment,
  UiAttachmentGroup,
  UiAttachmentMedia,
  UiAttachmentContent,
  UiAttachmentTitle,
  UiAttachmentDescription,
  UiAttachmentTriggerAttribute,
} from '@/registry/default/ui/attachment'

const FILE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>`

const TEMPLATE = `
<div class="flex w-full max-w-md flex-col gap-4">
  <ui-attachment-group>
    <ui-attachment repeat.for="file of files" orientation="vertical">
      <ui-attachment-media>${FILE_ICON}</ui-attachment-media>
      <ui-attachment-content>
        <ui-attachment-title>\${file.name}</ui-attachment-title>
        <ui-attachment-description>\${file.size}</ui-attachment-description>
      </ui-attachment-content>
      <button ui-attachment-trigger aria-label.bind="'Open ' + file.name" click.trigger="open(file)"></button>
    </ui-attachment>
  </ui-attachment-group>
  <p class="text-muted-foreground text-sm" role="status">\${opened ? 'Opened: ' + opened : 'The group scrolls horizontally with snap points and edge fades.'}</p>
</div>
`

@customElement({
  name: 'attachment-group',
  template: TEMPLATE,
  dependencies: [
    UiAttachment,
    UiAttachmentGroup,
    UiAttachmentMedia,
    UiAttachmentContent,
    UiAttachmentTitle,
    UiAttachmentDescription,
    UiAttachmentTriggerAttribute,
  ],
})
export class AttachmentGroup {
  files = [
    { name: 'design-spec.pdf', size: '1.2 MB' },
    { name: 'user-research.docx', size: '860 KB' },
    { name: 'roadmap.xlsx', size: '540 KB' },
    { name: 'assets.zip', size: '12.8 MB' },
    { name: 'changelog.md', size: '24 KB' },
    { name: 'metrics.csv', size: '310 KB' },
  ]

  opened = ''

  open(file: { name: string }): void {
    this.opened = file.name
  }
}
