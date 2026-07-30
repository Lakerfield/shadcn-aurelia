import { bindable } from 'aurelia'
import { splitExample, toConsumerPaths, type SplitExample } from '../lib/split-example'

export type PreviewTab = 'preview' | 'html' | 'ts' | 'file'

export class ComponentPreview {
  @bindable() code = ''

  tab: PreviewTab = 'preview'
  file = ''
  split: SplitExample | null = null

  binding(): void {
    this.codeChanged()
  }

  codeChanged(): void {
    this.file = toConsumerPaths(this.code)
    this.split = splitExample(this.file)
    if (this.split === null && (this.tab === 'html' || this.tab === 'ts')) this.tab = 'file'
  }

  setTab(tab: PreviewTab): void {
    this.tab = tab
  }
}
