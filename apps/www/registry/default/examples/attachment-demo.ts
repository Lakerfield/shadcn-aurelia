import { customElement } from 'aurelia'
import {
  UiAttachment,
  UiAttachmentMedia,
  UiAttachmentContent,
  UiAttachmentTitle,
  UiAttachmentDescription,
  UiAttachmentActions,
  UiAttachmentAction,
} from '@/registry/default/ui/attachment'

const FILE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>`
const IMAGE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>`
const X_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`

const TEMPLATE = `
<div class="flex w-full max-w-md flex-col gap-4">
  <ui-attachment class="w-full">
    <ui-attachment-media>${FILE_ICON}</ui-attachment-media>
    <ui-attachment-content>
      <ui-attachment-title>sales-dashboard.pdf</ui-attachment-title>
      <ui-attachment-description>2.4 MB · PDF</ui-attachment-description>
    </ui-attachment-content>
    <ui-attachment-actions>
      <ui-attachment-action label="Remove sales-dashboard.pdf" click.trigger="remove()">${X_ICON}</ui-attachment-action>
    </ui-attachment-actions>
  </ui-attachment>

  <ui-attachment state="uploading" class="w-full">
    <ui-attachment-media>${IMAGE_ICON}</ui-attachment-media>
    <ui-attachment-content>
      <ui-attachment-title>team-photo.jpg</ui-attachment-title>
      <ui-attachment-description>Uploading — 4.1 MB</ui-attachment-description>
    </ui-attachment-content>
  </ui-attachment>

  <ui-attachment state="error" class="w-full">
    <ui-attachment-media>${FILE_ICON}</ui-attachment-media>
    <ui-attachment-content>
      <ui-attachment-title>quarterly-report.xlsx</ui-attachment-title>
      <ui-attachment-description>Upload failed — file too large</ui-attachment-description>
    </ui-attachment-content>
  </ui-attachment>

  <div class="flex gap-3">
    <ui-attachment size="sm">
      <ui-attachment-media>${FILE_ICON}</ui-attachment-media>
      <ui-attachment-content>
        <ui-attachment-title>notes.md</ui-attachment-title>
      </ui-attachment-content>
    </ui-attachment>
    <ui-attachment size="xs">
      <ui-attachment-media>${FILE_ICON}</ui-attachment-media>
      <ui-attachment-content>
        <ui-attachment-title>todo.txt</ui-attachment-title>
      </ui-attachment-content>
    </ui-attachment>
  </div>
</div>
`

@customElement({
  name: 'attachment-demo',
  template: TEMPLATE,
  dependencies: [
    UiAttachment,
    UiAttachmentMedia,
    UiAttachmentContent,
    UiAttachmentTitle,
    UiAttachmentDescription,
    UiAttachmentActions,
    UiAttachmentAction,
  ],
})
export class AttachmentDemo {
  remove(): void {
    // Wire up removal in your app.
  }
}
